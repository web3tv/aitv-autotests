/**
 * Seed the shared VIEW-ONLY visual fixture (see tests/fixtures/sharedFixture.ts).
 *
 * GET-OR-CREATE + CONTENT-WIPE, idempotent. The auth/identity service permanently
 * reserves a handle+email once registered — a deleted account can never be recreated
 * (409) — so the FIXED fixture accounts (owner / viewer) are created once and reused,
 * and only their CONTENT is wiped and re-seeded each run: a deterministic owner channel
 * with N videos, a series with episodes, and a fixed follower count. The resolved
 * identifiers are written to test-data/visual-fixture.json for the specs to read.
 *
 * Prereqs (same as any @db work): a DB port-forward — content-wipe and follower seeding
 * go straight to the database.
 *   kubectl port-forward -n web3tv svc/mariadb 3307:3306
 *   npm run seed:fixture                 # default env .env.web3tv2
 *   ENV_FILE=.env.web3tv npm run seed:fixture
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), process.env.ENV_FILE || '.env.web3tv2') });

import { request } from '@playwright/test';
import { AuthApi, STATIC_OTP_CODE } from '../src/api/AuthApi';
import { DatabaseHelper } from '../src/api/DatabaseHelper';
import { setupVideoViaApi, setupSeriesWithEpisodes } from '../src/utils/studioTestHelpers';
import { deleteUser } from './deleteUser';
import {
    FIXTURE_OWNER,
    FIXTURE_VIEWER,
    FIXTURE_FOLLOWER_COUNT,
} from '../tests/fixtures/sharedFixture';
import {
    FIXTURE_VIDEO_TITLE,
    FIXTURE_VIDEO_DESCRIPTION,
    FIXTURE_VIDEO_CATEGORY_SLUG,
    FIXTURE_VIDEO_GENRES,
    FIXTURE_VIDEO_CONTENT_RATING,
    FIXTURE_SERIES_TITLE,
    FIXTURE_SERIES_EPISODE_COUNT,
    FIXTURE_SHORT_TITLE,
    FIXTURE_PRIVATE_TITLE,
    FIXTURE_UNLISTED_TITLE,
    FIXTURE_DESC_TITLE,
    FIXTURE_DESC_HTML,
} from '../tests/fixtures/videoSeed';

const VIDEO_COUNT = 3;

/**
 * Reuse the fixed account if it already exists (login succeeds), otherwise register it
 * with the deterministic email+handle. Never deletes — the identity service would then
 * refuse to recreate it.
 */
async function getOrCreateUser(
    authApi: AuthApi,
    account: { email: string; username: string },
    password: string,
): Promise<{ email: string; username: string }> {
    try {
        await authApi.getUserToken(account.email, password);
        console.log(`  · reusing existing @${account.username}`);
        return account;
    } catch {
        console.log(`  · creating @${account.username}`);
        return authApi.createUserFast(STATIC_OTP_CODE, { email: account.email, username: account.username });
    }
}

async function main() {
    const password = process.env.USER_PASSWORD!;
    const baseUrl = process.env.BASE_URL!;
    if (!password || !baseUrl) throw new Error('USER_PASSWORD / BASE_URL not set — check your env file');

    const ctx = await request.newContext();
    const authApi = new AuthApi(ctx);

    // ── 1. Ensure the fixed accounts exist (create once, reuse forever) ──────────
    console.log('\n▸ Ensuring fixed accounts…');
    const owner = await getOrCreateUser(authApi, FIXTURE_OWNER, password);
    const viewer = await getOrCreateUser(authApi, FIXTURE_VIEWER, password);

    // ── 2. Wipe the owner's existing content (keeps the account + channel) ───────
    console.log('▸ Wiping owner content…');
    await deleteUser(owner.email, false, { contentOnly: true });

    // ── 3. Upload the seeded videos on the owner's channel ───────────────────────
    console.log('▸ Uploading videos…');
    const setup = await setupVideoViaApi(ctx, {
        existingUser: owner,
        privacySetting: 'public',
        title: FIXTURE_VIDEO_TITLE,
        description: FIXTURE_VIDEO_DESCRIPTION,
        categorySlug: FIXTURE_VIDEO_CATEGORY_SLUG,
        genres: FIXTURE_VIDEO_GENRES,
        contentRating: FIXTURE_VIDEO_CONTENT_RATING,
        videoCount: VIDEO_COUNT,
    });

    // ── 3b. A short (populates the "Shorts" tab) ─────────────────────────────────
    console.log('▸ Uploading short…');
    const shortSetup = await setupVideoViaApi(ctx, {
        existingUser: owner,
        privacySetting: 'public',
        contentType: 'short',
        title: FIXTURE_SHORT_TITLE,
        categorySlug: FIXTURE_VIDEO_CATEGORY_SLUG,
    });

    // ── 3c. Non-public videos (must stay HIDDEN on the public channel) ───────────
    console.log('▸ Uploading private + unlisted videos…');
    const privateSetup = await setupVideoViaApi(ctx, {
        existingUser: owner,
        privacySetting: 'private',
        title: FIXTURE_PRIVATE_TITLE,
        categorySlug: FIXTURE_VIDEO_CATEGORY_SLUG,
    });
    const unlistedSetup = await setupVideoViaApi(ctx, {
        existingUser: owner,
        privacySetting: 'unlisted',
        title: FIXTURE_UNLISTED_TITLE,
        categorySlug: FIXTURE_VIDEO_CATEGORY_SLUG,
    });

    // ── 3d. Unlisted video with a multi-paragraph description (DESC-PARA-001) ─────
    // Unlisted → reachable by direct link but NOT on the channel grid (visual baselines
    // unaffected). Description carries empty <p></p> spacers the watch page must keep.
    console.log('▸ Uploading multi-paragraph-description video…');
    await setupVideoViaApi(ctx, {
        existingUser: owner,
        privacySetting: 'unlisted',
        title: FIXTURE_DESC_TITLE,
        description: FIXTURE_DESC_HTML,
        categorySlug: FIXTURE_VIDEO_CATEGORY_SLUG,
    });

    // ── 4. Add a SERIES with episodes to the same channel ────────────────────────
    console.log(`▸ Creating series "${FIXTURE_SERIES_TITLE}" (${FIXTURE_SERIES_EPISODE_COUNT} episodes)…`);
    const series = await setupSeriesWithEpisodes(ctx, {
        existingUser: owner,
        seriesTitle: FIXTURE_SERIES_TITLE,
        episodeCount: FIXTURE_SERIES_EPISODE_COUNT,
        categorySlug: FIXTURE_VIDEO_CATEGORY_SLUG,
        genres: FIXTURE_VIDEO_GENRES,
    });
    await ctx.dispose();

    // ── 5. Seed followers on the channel via DB (no free-follow API exists) ──────
    // Reuse existing arbitrary users as subscriber rows (no new accounts → no leak);
    // the channel's incoming subscriptions were just cleared by the content-wipe.
    console.log(`▸ Seeding ${FIXTURE_FOLLOWER_COUNT} followers via DB…`);
    const db = new DatabaseHelper();
    await db.connect();
    try {
        const videoHex = await db.getVideoId(FIXTURE_VIDEO_TITLE);
        const channelHex = await db.getChannelIdByVideo(videoHex);
        const ownerHex = await db.getUserId(owner.email);
        const others = await db.query<Array<{ h: string }>>(
            'SELECT HEX(id) h FROM users WHERE id <> UNHEX(?) ORDER BY created_at DESC LIMIT ?',
            [ownerHex, FIXTURE_FOLLOWER_COUNT]
        );
        const entries = others.map((r, i) => ({ userHexId: r.h, daysAgo: i + 1 }));
        await db.seedChannelSubscribers(channelHex, entries);
        await db.updateChannelSubscriberCount(channelHex, entries.length);
    } finally {
        await db.disconnect();
    }

    // The seed only ensures the data EXISTS on the stand — tests resolve the actual
    // URLs at runtime (resolveSharedFixture), so nothing is written/committed here.
    console.log('\n✓ Visual fixture ready on this stand:');
    console.log(`  channel : ${setup.channelUrl}`);
    console.log(`  owner   : ${owner.email} (@${owner.username})`);
    console.log(`  viewer  : ${viewer.email} (@${viewer.username})`);
    console.log(`  content : video + short + private + unlisted + description`);
    console.log(`  series  : "${series.seriesTitle}" (${FIXTURE_SERIES_EPISODE_COUNT} episodes)`);
    console.log(`  followers: ${FIXTURE_FOLLOWER_COUNT}`);
    console.log(`  → tests resolve URLs at runtime; nothing to commit.\n`);
}

main().catch((err) => {
    console.error('\n✗ Seed failed:', err?.message ?? err);
    process.exit(1);
});
