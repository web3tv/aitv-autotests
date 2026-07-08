import { request } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';
import {
    FIXTURE_VIDEO_TITLE,
    FIXTURE_SHORT_TITLE,
    FIXTURE_PRIVATE_TITLE,
    FIXTURE_UNLISTED_TITLE,
    FIXTURE_SERIES_TITLE,
    FIXTURE_DESC_TITLE,
} from './videoSeed';

/**
 * Single shared, READ-ONLY fixture for view-only tests (visual + functional).
 *
 * A one-off seed script (`npm run seed:fixture`, run locally) creates a FIXED channel
 * `@qavischan` with deterministic content (public/short/private/unlisted videos, a
 * series, followers). Instead of committing per-env video URLs (slugs differ per env
 * and per re-seed), tests RESOLVE the current stand's URLs at runtime by title via
 * `resolveSharedFixture()`. The account (email/handle/password) is deterministic and
 * identical on every stand, so the SAME code works on dev1 and dev2 — nothing to
 * commit, nothing to re-commit after a re-seed.
 *
 * Read-only contract: never mutate `@qavischan` (see CLAUDE.md) — the functional
 * project runs in parallel and a mutation both races other workers and breaks the
 * visual baselines. Mutating tests seed their own resource.
 */

const domain = process.env.EMAIL_DOMAIN ?? 'aitv-test.com';

// The auth/identity service permanently reserves a handle+email once registered, so
// these fixed accounts are created ONCE and never deleted — the seed reuses them and
// only refreshes their content (get-or-create). (`qavisualowner`/`qavisualviewer` were
// burned during earlier wipe experiments, hence the `chan`/`watch` names.)
/** Fixed owner of the shared channel (deterministic email + handle — same on every env). */
export const FIXTURE_OWNER = { email: `qa_vis_chan@${domain}`, username: 'qavischan' };
/** Fixed logged-in NON-owner used for the "user" channel view. */
export const FIXTURE_VIEWER = { email: `qa_vis_watch@${domain}`, username: 'qaviswatch' };
/** Deterministic follower count seeded on the channel (renders in the identity header). */
export const FIXTURE_FOLLOWER_COUNT = 5;

export interface SharedFixture {
    /** `${BASE_URL}/@${owner.username}`. */
    channelUrl: string;
    /** Watch URL of the public video. */
    videoUrl: string;
    /** Watch URL of the public short. */
    shortUrl: string;
    /** Watch URL of a PRIVATE video on the same channel (must stay hidden publicly). */
    privateVideoUrl: string;
    /** Watch URL of an UNLISTED video (hidden on channel, reachable by direct link). */
    unlistedVideoUrl: string;
    /** Watch URL of an UNLISTED video with a multi-paragraph description (DESC-PARA-001). */
    descriptionVideoUrl: string;
    ownerEmail: string;
    ownerUsername: string;
    viewerEmail: string;
    viewerUsername: string;
    password: string;
    followerCount: number;
    /** Series on the channel (populates the "Series" tab). */
    seriesTitle: string;
    seriesSlug: string;
    /** Playlist id — needed for `?list=` series-context playback. */
    seriesId: string;
    /** Watch URLs of every episode in order (episode auto-advance uses [0]→[1]). */
    episodeUrls: string[];
}

const SEED_HINT =
    `The shared read-only fixture is missing/stale on this stand. Seed it (locally, once):\n` +
    `  kubectl port-forward -n web3tv svc/mariadb 3307:3306\n` +
    `  npm run seed:fixture`;

/**
 * Resolve the shared fixture for the CURRENT stand (BASE_URL/API_URL from env). Logs in
 * as the fixed owner and looks the content up by title, so there is no per-env committed
 * data. Throws a clear "re-seed" error if any expected content is absent — this is also
 * the liveness check used by the `fixture-check` preflight project.
 */
export async function resolveSharedFixture(): Promise<SharedFixture> {
    const baseUrl = process.env.BASE_URL!;
    const password = process.env.USER_PASSWORD!;
    const ctx = await request.newContext();
    try {
        const token = await new AuthApi(ctx).getUserToken(FIXTURE_OWNER.email, password).catch(() => {
            throw new Error(`${SEED_HINT}\n(cause: owner @${FIXTURE_OWNER.username} cannot log in)`);
        });
        const videoApi = new VideoApi(ctx);

        const videos = await videoApi.listStudioContent(token, 'video');
        const shorts = await videoApi.listStudioContent(token, 'short');
        const playlists = await videoApi.listMyPlaylists(token);

        // Episode watch URLs use the '/video/' segment; the short uses '/short/'.
        const urlOf = (it: { type: string; categorySlug: string; slug: string }) =>
            `${baseUrl}/${it.type === 'short' ? 'short' : 'video'}/${it.categorySlug}/${it.slug}`;
        const find = (title: string, list: Array<{ title: string }>) => {
            const it = list.find((v) => v.title === title);
            if (!it) throw new Error(`${SEED_HINT}\n(cause: content "${title}" not found on the channel)`);
            return it as any;
        };

        const series = playlists.find((p) => p.title === FIXTURE_SERIES_TITLE);
        if (!series?.id || !series?.slug) {
            throw new Error(`${SEED_HINT}\n(cause: series "${FIXTURE_SERIES_TITLE}" not found)`);
        }
        const episodes = await videoApi.getSeriesEpisodes(token, series.slug);

        return {
            channelUrl: `${baseUrl}/@${FIXTURE_OWNER.username}`,
            videoUrl: urlOf(find(FIXTURE_VIDEO_TITLE, videos)),
            shortUrl: urlOf(find(FIXTURE_SHORT_TITLE, shorts)),
            privateVideoUrl: urlOf(find(FIXTURE_PRIVATE_TITLE, videos)),
            unlistedVideoUrl: urlOf(find(FIXTURE_UNLISTED_TITLE, videos)),
            descriptionVideoUrl: urlOf(find(FIXTURE_DESC_TITLE, videos)),
            ownerEmail: FIXTURE_OWNER.email,
            ownerUsername: FIXTURE_OWNER.username,
            viewerEmail: FIXTURE_VIEWER.email,
            viewerUsername: FIXTURE_VIEWER.username,
            password,
            followerCount: FIXTURE_FOLLOWER_COUNT,
            seriesTitle: FIXTURE_SERIES_TITLE,
            seriesSlug: series.slug,
            seriesId: series.id,
            episodeUrls: episodes.map((e) => e.watchUrl),
        };
    } finally {
        await ctx.dispose();
    }
}
