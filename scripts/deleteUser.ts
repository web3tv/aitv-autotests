import * as dotenv from 'dotenv';
import * as path from 'path';
import mysql from 'mysql2/promise';

dotenv.config({ path: path.resolve(process.cwd(), '.env.web3tv2') });

const arg = process.argv[2];
if (!arg) {
    console.error('Usage:');
    console.error('  npm run delete-user user@example.com          — delete one user by email');
    console.error('  npm run delete-user 1F108FC4E1506B9E...        — delete one user by hex ID');
    console.error('  npm run delete-user aitv-test.com             — delete all users with this domain');
    process.exit(1);
}

const isHexId = /^[0-9a-fA-F]{32}$/.test(arg);

async function deleteUser(emailOrHexId: string, byId = false) {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        ssl: { rejectUnauthorized: false },
    });

    const del = async (table: string, condition: string, params: any[]) => {
        const [result] = await connection.execute(`DELETE FROM ${table} WHERE ${condition}`, params) as any;
        if (result.affectedRows > 0) {
            console.log(`  ✓ ${table}: ${result.affectedRows} row(s)`);
        }
    };

    const delByVideoIds = async (table: string, params: any[]) => {
        const [result] = await connection.execute(
            `DELETE FROM ${table} WHERE video_id IN (SELECT id FROM videos WHERE uploaded_by = ?)`,
            params
        ) as any;
        if (result.affectedRows > 0) {
            console.log(`  ✓ ${table} (user's videos): ${result.affectedRows} row(s)`);
        }
    };

    try {
        const [rows] = await connection.execute(
            byId
                ? 'SELECT id, email, HEX(id) as hex_id FROM users WHERE id = UNHEX(?)'
                : 'SELECT id, email, HEX(id) as hex_id FROM users WHERE email = ?',
            [emailOrHexId]
        ) as any;

        if (!rows.length) {
            console.error(`User not found: ${emailOrHexId}`);
            process.exit(1);
        }

        const userId = rows[0].id;
        const userHex = rows[0].hex_id;
        console.log(`\nDeleting user: ${rows[0].email} (${userHex})\n`);

        // ── 1. Простые прямые связи user → users ─────────────────
        await del('live_streams',                'user_id = ?',    [userId]);
        await del('user_video_recommendations',  'user_id = ?',    [userId]);
        await del('user_notification_history',   'user_id = ?',    [userId]);
        await del('video_histories',             'user_id = ?',    [userId]);
        await del('siwe_nonces',                 'user_id = ?',    [userId]);
        await del('social_identity',             'user_id = ?',    [userId]);
        await del('feedback',                    'user_id = ?',    [userId]);
        await del('favorite_coins',              'user_id = ?',    [userId]);
        await del('user_youtube_video',          'user_id = ?',    [userId]);
        await del('email_verfications',          'user_id = ?',    [userId]);
        await del('reset_password_request',      'user_id = ?',    [userId]);
        await del('user_new_password',           'user_id = ?',    [userId]);
        await del('user_channel_access',         'user_id = ?',    [userId]);
        await del('user_profiles',               'user_id = ?',    [userId]);
        await del('user_notification_settings',  'user_id = ?',    [userId]);
        await del('user_new_email',              'user_id = ?',    [userId]);
        await del('payment_blockchain_txs',
            `transaction_id IN (SELECT id FROM transaction WHERE user_id = ?)`, [userId]);
        await del('transaction',                 'user_id = ?',    [userId]);
        await del('paid_subscription_subscribers','user_id = ?',   [userId]);
        await del('paid_subscription_contents',
            `subscription_id IN (SELECT id FROM paid_subscriptions WHERE created_by = ?)`, [userId]);
        await del('paid_subscriptions',          'created_by = ?', [userId]);
        await del('channel_transfer_log',        'old_owner_id = ? OR new_owner_id = ?', [userId, userId]);
        await del('reports',                     'author_id = ?',  [userId]);
        await del('subscriptions',               'user_id = ?',    [userId]);

        // ── 2. Картинки (сначала зависимые таблицы) ──────────────
        await del('video_upload_thumbnails',
            `picture_id IN (SELECT id FROM pictures WHERE uploaded_by = ?)`, [userId]);
        await connection.execute(
            `UPDATE channels SET picture_id = NULL
             WHERE picture_id IN (SELECT id FROM pictures WHERE uploaded_by = ?)`,
            [userId]
        );
        await del('pictures', 'uploaded_by = ?', [userId]);

        // ── 3. Плейлисты (сначала видео внутри) ──────────────────
        await del('playlist_videos',
            `playlist_id IN (SELECT id FROM playlists WHERE user_id = ?)`, [userId]);
        await del('playlists', 'user_id = ?', [userId]);

        // ── 4. Активность этого юзера (лайки/просмотры) ──────────
        await del('video_rates',   'user_id = ?', [userId]);
        await del('video_views',   'user_id = ?', [userId]);
        await del('user_video_access', 'user_id = ?', [userId]);

        // ── 5. Комментарии этого юзера ────────────────────────────
        await del('comment_rates', 'user_id = ?', [userId]);
        await del('comment_rates',
            `comment_id IN (SELECT id FROM comments WHERE author_id = ?)`, [userId]);
        await del('comments', 'author_id = ?', [userId]);

        // ── 6. Всё что связано с видео этого юзера ───────────────
        // 6a. Обнуляем highlight_video_id на каналах других юзеров
        await connection.execute(
            `UPDATE channels SET highlight_video_id = NULL
             WHERE highlight_video_id IN (SELECT id FROM videos WHERE uploaded_by = ?)`,
            [userId]
        );

        // 6b. Комментарии на видео этого юзера
        await connection.execute(
            `DELETE cr FROM comment_rates cr
             JOIN comments c ON cr.comment_id = c.id
             WHERE c.video_id IN (SELECT id FROM videos WHERE uploaded_by = ?)`,
            [userId]
        ).then(([r]: any) => {
            if (r.affectedRows > 0) console.log(`  ✓ comment_rates (on user's videos): ${r.affectedRows} row(s)`);
        });
        await delByVideoIds('comments',              [userId]);

        // 6c. Все таблицы с video_id → videos
        await delByVideoIds('video_rates',           [userId]);
        await delByVideoIds('video_views',           [userId]);
        await delByVideoIds('video_histories',       [userId]);
        await delByVideoIds('video_transcodings',    [userId]);
        await delByVideoIds('video_hotspots',        [userId]);
        await delByVideoIds('video_chapters',        [userId]);
        await connection.execute(
            `DELETE vc FROM video_upload_chunks vc
             JOIN video_uploads vu ON vc.upload_id = vu.video_id
             WHERE vu.video_id IN (SELECT id FROM videos WHERE uploaded_by = ?)`,
            [userId]
        ).then(([r]: any) => {
            if (r.affectedRows > 0) console.log(`  ✓ video_upload_chunks (user's videos): ${r.affectedRows} row(s)`);
        });
        await delByVideoIds('video_uploads',         [userId]);
        await delByVideoIds('video_slug_histories',  [userId]);
        await delByVideoIds('video_category_videos', [userId]);
        await delByVideoIds('video_invitations',     [userId]);
        await delByVideoIds('video_imports',         [userId]);
        await delByVideoIds('blog_posts',            [userId]);
        await delByVideoIds('video_seo',             [userId]);
        await delByVideoIds('video_transcripts',     [userId]);
        await delByVideoIds('video_audio_tracks',    [userId]);
        await delByVideoIds('user_video_access',     [userId]);
        await delByVideoIds('playlist_videos',       [userId]);
        await del('video_imports', 'user_id = ?',    [userId]);

        // 6d. Сами видео
        await del('videos', 'uploaded_by = ?', [userId]);

        // ── 7. Каналы этого юзера ─────────────────────────────────
        await del('subscriptions',
            `channel_id IN (SELECT id FROM channels WHERE user_id = ?)`, [userId]);
        await del('user_channel_access',
            `channel_id IN (SELECT id FROM channels WHERE user_id = ?)`, [userId]);
        await del('blog_posts',
            `author_id = ?`, [userId]);
        await del('channels', 'user_id = ?', [userId]);

        // ── 8. Сам юзер ───────────────────────────────────────────
        await del('users', 'id = ?', [userId]);

        console.log('\nDone.');
    } finally {
        await connection.end();
    }
}

async function main() {
    if (isHexId) {
        await deleteUser(arg, true);
        return;
    }

    const isDomain = !arg.includes('@');

    if (!isDomain) {
        await deleteUser(arg);
        return;
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        ssl: { rejectUnauthorized: false },
    });

    const [rows] = await connection.execute(
        `SELECT email FROM users WHERE email LIKE ?`,
        [`%@${arg}`]
    ) as any;
    await connection.end();

    if (!rows.length) {
        console.log(`No users found with domain: ${arg}`);
        return;
    }

    console.log(`Found ${rows.length} user(s) with domain @${arg}\n`);
    for (const row of rows) {
        await deleteUser(row.email);
    }
}

main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
