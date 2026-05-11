import mysql, { Connection } from 'mysql2/promise';

export class DatabaseHelper {
    private connection: Connection | null = null;

    constructor(
        private config = {
            host: process.env.DB_HOST!,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
            database: process.env.DB_NAME!,
            ssl: { rejectUnauthorized: false },
        }
    ) {}

    async connect(): Promise<void> {
        this.connection = await mysql.createConnection(this.config);
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }

    async query<T = any>(sql: string, params?: any[]): Promise<T> {
        if (!this.connection) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const [rows] = await this.connection.execute(sql, params);
        return rows as T;
    }

    async setActiveSubscription(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = NOW(), expired_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['confirmed', email]
        );
    }

    async expireSubscription(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = DATE_SUB(NOW(), INTERVAL 60 DAY), expired_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['confirmed', email]
        );
    }

    async expireTransaction(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = NULL, expired_at = NULL WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['expired', email]
        );
    }

    async setPendingPayment(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = NULL, expired_at = NULL WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['new', email]
        );
    }

    async invalidateTransaction(email: string): Promise<void> {
        await this.query(
            'UPDATE paid_subscription_subscribers SET transaction_status = ?, start_date = NULL, expired_at = NULL WHERE user_id = (SELECT id FROM users WHERE email = ?)',
            ['invalid', email]
        );
    }

    /**
     * Get binary user ID by email
     */
    async getUserId(email: string): Promise<string> {
        const rows = await this.query<Array<{ user_hex: string }>>(
            'SELECT HEX(id) as user_hex FROM users WHERE email = ?',
            [email]
        );
        if (!rows.length) throw new Error(`User not found: ${email}`);
        return rows[0].user_hex;
    }

    /**
     * Get binary video ID by title
     */
    async getVideoId(title: string): Promise<string> {
        const rows = await this.query<Array<{ vid_hex: string }>>(
            'SELECT HEX(id) as vid_hex FROM videos WHERE title = ? AND deletedAt IS NULL ORDER BY published_at DESC LIMIT 1',
            [title]
        );
        if (!rows.length) throw new Error(`Video not found: ${title}`);
        return rows[0].vid_hex;
    }

    /**
     * Get channel HEX ID from a video
     */
    async getChannelIdByVideo(videoHexId: string): Promise<string> {
        const rows = await this.query<Array<{ ch_hex: string }>>(
            'SELECT HEX(channel_id) as ch_hex FROM videos WHERE id = UNHEX(?)',
            [videoHexId]
        );
        if (!rows.length) throw new Error(`Video not found: ${videoHexId}`);
        return rows[0].ch_hex;
    }

    /**
     * Insert video views spread across multiple days.
     * distribution — array of { daysAgo, count } entries.
     */
    async seedVideoViews(
        videoHexId: string,
        viewerHexId: string,
        distribution: Array<{ daysAgo: number; count: number }>
    ): Promise<number> {
        let total = 0;
        let ipCounter = 0;
        for (const { daysAgo, count } of distribution) {
            for (let i = 0; i < count; i++) {
                ipCounter++;
                const ip = `10.${Math.floor(ipCounter / 65536) % 256}.${Math.floor(ipCounter / 256) % 256}.${ipCounter % 256}`;
                const maxSec = 5 + Math.floor(Math.random() * 115);
                const events = JSON.stringify(
                    Array.from({ length: Math.min(maxSec, 10) }, (_, j) => Math.floor((j + 1) * (maxSec / 10)))
                );
                await this.query(
                    `INSERT INTO video_views (video_id, ip_address, view_events, is_viewed, created_at, user_id)
                     VALUES (UNHEX(?), ?, ?, 1, DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR, UNHEX(?))`,
                    [videoHexId, ip, events, daysAgo, i % 12 + 1, viewerHexId]
                );
                total++;
            }
        }
        return total;
    }

    /**
     * Insert likes spread across time.
     * Each entry specifies { userHexId, hoursAgo }.
     */
    async seedVideoLikes(
        videoHexId: string,
        entries: Array<{ userHexId: string; hoursAgo: number }>
    ): Promise<number> {
        for (const { userHexId, hoursAgo } of entries) {
            await this.query(
                `INSERT INTO video_rates (video_id, user_id, rating, created_at)
                 VALUES (UNHEX(?), UNHEX(?), 'like', DATE_SUB(NOW(), INTERVAL ? HOUR))`,
                [videoHexId, userHexId, hoursAgo]
            );
        }
        return entries.length;
    }

    /**
     * Insert comments spread across multiple days.
     */
    async seedVideoComments(
        videoHexId: string,
        distribution: Array<{ authorHexId: string; daysAgo: number; count: number }>
    ): Promise<number> {
        let total = 0;
        for (const { authorHexId, daysAgo, count } of distribution) {
            for (let i = 0; i < count; i++) {
                total++;
                await this.query(
                    `INSERT INTO comments (id, video_id, author_id, text_original, text_display, created_at, published_at,
                        statistics_like_count, statistics_dislike_count, statistics_reply_count, statistics_popularity)
                     VALUES (UNHEX(REPLACE(UUID(), '-', '')), UNHEX(?), UNHEX(?), ?, ?,
                        DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR,
                        DATE_SUB(NOW(), INTERVAL ? DAY) + INTERVAL ? HOUR,
                        0, 0, 0, 0)`,
                    [videoHexId, authorHexId, `Test comment ${total}`, `Test comment ${total}`,
                     daysAgo, (total * 2) % 12, daysAgo, (total * 2) % 12]
                );
            }
        }
        return total;
    }

    /**
     * Insert channel subscriptions on different days.
     * Each entry specifies { userHexId, daysAgo }.
     */
    async seedChannelSubscribers(
        channelHexId: string,
        entries: Array<{ userHexId: string; daysAgo: number }>
    ): Promise<number> {
        for (const { userHexId, daysAgo } of entries) {
            await this.query(
                `INSERT INTO subscriptions (id, channel_id, user_id, created_at)
                 VALUES (UNHEX(REPLACE(UUID(), '-', '')), UNHEX(?), UNHEX(?),
                    DATE_SUB(NOW(), INTERVAL ? DAY))`,
                [channelHexId, userHexId, daysAgo]
            );
        }
        return entries.length;
    }

    /**
     * Update video and channel statistics counters after seeding.
     */
    async updateVideoStats(
        videoHexId: string,
        views: number,
        likes: number,
        comments: number
    ): Promise<void> {
        await this.query(
            `UPDATE videos SET
                statistics_view_count = statistics_view_count + ?,
                statistics_like_count = statistics_like_count + ?,
                statistics_comment_count = statistics_comment_count + ?
             WHERE id = UNHEX(?)`,
            [views, likes, comments, videoHexId]
        );
        await this.query(
            `UPDATE channels SET statistics_view_count = statistics_view_count + ?
             WHERE id = (SELECT channel_id FROM videos WHERE id = UNHEX(?))`,
            [views, videoHexId]
        );
    }

    /**
     * Update channel subscriber count after seeding.
     */
    async updateChannelSubscriberCount(
        channelHexId: string,
        count: number
    ): Promise<void> {
        await this.query(
            `UPDATE channels SET statistics_subscriber_count = statistics_subscriber_count + ?
             WHERE id = UNHEX(?)`,
            [count, channelHexId]
        );
    }

    async setChaptersEnabled(videoHexId: string, enabled: boolean): Promise<void> {
        await this.query(
            'UPDATE videos SET chapters_enabled = ? WHERE id = UNHEX(?)',
            [enabled ? 1 : 0, videoHexId]
        );
    }
}
