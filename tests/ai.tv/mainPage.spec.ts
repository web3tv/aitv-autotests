import { test, expect, APIRequestContext } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';

const API_URL = process.env.API_URL;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getItems(body: any): { id: string }[] {
    return body?.items ?? body?.data?.items ?? [];
}

/** Fetch a feed endpoint, log the URL, return items. Fails the test if status != 200. */
async function fetchFeedItems(
    request: APIRequestContext,
    endpoint: string,
    params: Record<string, string | number> = {},
): Promise<{ id: string }[]> {
    const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    ).toString();
    console.log(`[feed] GET ${endpoint}${qs ? `?${qs}` : ''}`);
    const response = await request.get(endpoint, { params });
    expect(response.status(), 'Endpoint should return 200').toBe(200);
    return getItems(await response.json());
}

/** Check whether videoId is present in items, logging the search target and result. */
function videoInItems(items: { id: string }[], videoId: string): boolean {
    console.log(`[feed] video   : ${videoId}`);
    console.log(`[feed] items   : ${items.length > 0 ? items.map(i => i.id).join(', ') : '(empty)'}`);
    return items.some(item => item.id === videoId);
}

async function setupPublicChannel(
    request: APIRequestContext,
): Promise<{ token: string; channelId: string }> {
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    const user = await authApi.createAndVerifyUser();
    const token = await authApi.getUserToken(user.email, process.env.USER_PASSWORD!);
    const channelId = await videoApi.getChannelId(token);
    return { token, channelId };
}

async function setupPrivateChannel(
    request: APIRequestContext,
): Promise<{ token: string; channelId: string }> {
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    const user = await authApi.createAndVerifyUser();
    const token = await authApi.getUserToken(user.email, process.env.USER_PASSWORD!);
    const channelId = await videoApi.getChannelId(token);
    return { token, channelId };
}

/**
 * Create a CHANNEL-type playlist (type is set automatically when channelId is provided).
 * Returns playlist ID.
 */
async function createChannelPlaylist(
    request: APIRequestContext,
    token: string,
    channelId: string,
    privacyStatus: 'public' | 'private',
): Promise<string> {
    const response = await request.post(`${API_URL}/playlists/`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        data: { title: `Playlist_${Date.now()}`, privacyStatus, channelId },
    });
    if (!response.ok()) throw new Error(`Failed to create playlist: ${response.status()} ${await response.text()}`);
    const json = await response.json();
    const id: string = json?.id ?? json?.data?.id;
    if (!id) throw new Error(`Playlist response missing id: ${JSON.stringify(json)}`);
    return id;
}

async function addVideoToPlaylist(
    request: APIRequestContext,
    token: string,
    playlistId: string,
    itemId: string,
): Promise<void> {
    const response = await request.post(`${API_URL}/playlist/items/`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        data: { playlistId, itemId },
    });
    if (!response.ok()) throw new Error(`Failed to add video to playlist: ${response.status()} ${await response.text()}`);
}

/** publishedAt 2 minutes from now — appears first in coming-soon (ASC sort) */
function scheduledSoonIso(): string {
    return new Date(Date.now() + 5 * 60 * 1000).toISOString();
}

// ─── Suite 1: Private content — not visible in any feed ──────────────────────
// Scenario: privacy settings block content. 4 uploads on a public channel:
//   private video, private short, public video in private playlist, scheduled private video.

test.describe('Private content — not visible in any feed', () => {
    let privateVideoId = '';         // private video        → GET /videos/
    let privateShortId = '';         // private short        → GET /videos/?type=short
    let privatePlaylistVideoId = ''; // public video, private playlist → /latest-in-playlists
    let scheduledPrivateId = '';     // scheduled private video       → /coming-soon

    test.beforeAll(async ({ request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const { token, channelId } = await setupPublicChannel(request);

        const vPrivate = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'private',
            waitForProcessing: true,
        });
        privateVideoId = vPrivate.id;

        const sPrivate = await videoApi.uploadVideo(token, 'test-data/fixtures/video/shortsVideo.mp4', {
            privacySetting: 'private',
            contentType: 'short',
            waitForProcessing: true,
        });
        privateShortId = sPrivate.id;

        const vPrivPlaylist = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'public',
            waitForProcessing: true,
        });
        privatePlaylistVideoId = vPrivPlaylist.id;
        const privPlaylistId = await createChannelPlaylist(request, token, channelId, 'private');
        await addVideoToPlaylist(request, token, privPlaylistId, privatePlaylistVideoId);

        const vScheduledPrivate = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            waitForProcessing: true,
        });
        scheduledPrivateId = vScheduledPrivate.id;
        await videoApi.updateVideo(token, scheduledPrivateId, {
            privacySetting: 'private',
            publishedAt: scheduledSoonIso(),
        });
    });

    test('Private video is not visible in GET /videos/', { annotation: { type: 'TC', description: 'AITV-005' } }, async ({ request }) => {
        await test.step('GET /videos/?id → private video absent', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/`, { id: privateVideoId });
            expect(videoInItems(items, privateVideoId), 'Private video should NOT appear in anonymous feed').toBeFalsy();
        });
    });

    test('Private short is not visible in GET /videos/?type=short', { annotation: { type: 'TC', description: 'AITV-015' } }, async ({ request }) => {
        await test.step('GET /videos/?type=short&id → private short absent', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/`, { id: privateShortId, type: 'short' });
            expect(videoInItems(items, privateShortId), 'Private short should NOT appear in anonymous feed').toBeFalsy();
        });
    });

    test('Public video in private playlist is not in latest-in-playlists', { annotation: { type: 'TC', description: 'AITV-010' } }, async ({ request }) => {
        await test.step('GET /videos/latest-in-playlists → video from private playlist absent', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/latest-in-playlists`, { maxResults: 20 });
            expect(videoInItems(items, privatePlaylistVideoId), 'Video in private playlist should NOT appear in latest-in-playlists').toBeFalsy();
        });
    });

    test('Scheduled private video is not in coming-soon', { annotation: { type: 'TC', description: 'AITV-013' } }, async ({ request }) => {
        await test.step('GET /videos/coming-soon → scheduled private video absent', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/coming-soon`, { maxResults: 10 });
            expect(videoInItems(items, scheduledPrivateId), 'Scheduled private video should NOT appear in coming-soon').toBeFalsy();
        });
    });
});

// ─── Suite 2: Private channel — not visible in any feed ───────────────────────
// Scenario: channel privacy blocks content. 4 uploads on a private channel:
//   public video, public short, public video in public playlist, scheduled public video.

test.describe('Private channel — content not visible in any feed', () => {
    let videoId = '';         // public video        → GET /videos/
    let shortId = '';         // public short        → GET /videos/?type=short
    let playlistVideoId = ''; // public video in public playlist → /latest-in-playlists
    let scheduledId = '';     // scheduled public video         → /coming-soon

    test.beforeAll(async ({ request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const { token, channelId } = await setupPrivateChannel(request);

        const v = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'public',
            waitForProcessing: true,
        });
        videoId = v.id;

        const s = await videoApi.uploadVideo(token, 'test-data/fixtures/video/shortsVideo.mp4', {
            privacySetting: 'public',
            contentType: 'short',
            waitForProcessing: true,
        });
        shortId = s.id;

        const vPlaylist = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'public',
            waitForProcessing: true,
        });
        playlistVideoId = vPlaylist.id;
        const playlistId = await createChannelPlaylist(request, token, channelId, 'public');
        await addVideoToPlaylist(request, token, playlistId, playlistVideoId);

        const vScheduled = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'public',
            waitForProcessing: true,
        });
        scheduledId = vScheduled.id;
        await videoApi.updateVideo(token, scheduledId, {
            privacySetting: 'public',
            publishedAt: scheduledSoonIso(),
        });
    });

    test('Public video on private channel is not visible in GET /videos/', { annotation: { type: 'TC', description: 'AITV-006' } }, async ({ request }) => {
        await test.step('GET /videos/?id → video from private channel absent', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/`, { id: videoId });
            expect(videoInItems(items, videoId), 'Video from private channel should NOT appear in anonymous feed').toBeFalsy();
        });
    });

    test('Public short on private channel is not visible in GET /videos/?type=short', { annotation: { type: 'TC', description: 'AITV-016' } }, async ({ request }) => {
        await test.step('GET /videos/?type=short&id → short from private channel absent', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/`, { id: shortId, type: 'short' });
            expect(videoInItems(items, shortId), 'Short from private channel should NOT appear in anonymous feed').toBeFalsy();
        });
    });

    test('Public video from private channel is not in latest-in-playlists', { annotation: { type: 'TC', description: 'AITV-019' } }, async ({ request }) => {
        await test.step('GET /videos/latest-in-playlists → video from private channel absent', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/latest-in-playlists`, { maxResults: 20 });
            expect(videoInItems(items, playlistVideoId), 'Video from private channel should NOT appear in latest-in-playlists').toBeFalsy();
        });
    });

    test('Scheduled public video from private channel is not in coming-soon', { annotation: { type: 'TC', description: 'AITV-018' } }, async ({ request }) => {
        await test.step('GET /videos/coming-soon → scheduled video from private channel absent', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/coming-soon`, { maxResults: 10 });
            expect(videoInItems(items, scheduledId), 'Scheduled video from private channel should NOT appear in coming-soon').toBeFalsy();
        });
    });
});

// ─── Suite 3: Public content — visible in feeds ───────────────────────────────
// Positive scenario: public channel, correct settings → content appears in all feeds.
// 4 uploads: public video, public short, public video in public playlist, scheduled public video.

test.describe('Public content — visible in all feeds', () => {
    let publicVideoId = '';    // public video        → GET /videos/
    let publicShortId = '';    // public short        → GET /videos/?type=short
    let playlistVideoId = '';  // public video in public playlist → /latest-in-playlists
    let scheduledPublicId = '';// scheduled public video         → /coming-soon

    test.beforeAll(async ({ request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const { token, channelId } = await setupPublicChannel(request);

        const v = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'public',
            waitForProcessing: true,
        });
        publicVideoId = v.id;

        const s = await videoApi.uploadVideo(token, 'test-data/fixtures/video/shortsVideo.mp4', {
            privacySetting: 'public',
            contentType: 'short',
            waitForProcessing: true,
        });
        publicShortId = s.id;

        const vPlaylist = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'public',
            waitForProcessing: true,
        });
        playlistVideoId = vPlaylist.id;
        const playlistId = await createChannelPlaylist(request, token, channelId, 'public');
        await addVideoToPlaylist(request, token, playlistId, playlistVideoId);

        const vScheduled = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'public',
            waitForProcessing: true,
        });
        scheduledPublicId = vScheduled.id;
        await videoApi.updateVideo(token, scheduledPublicId, {
            privacySetting: 'public',
            publishedAt: scheduledSoonIso(),
        });
    });

    test('Public video is visible in GET /videos/', { annotation: { type: 'TC', description: 'AITV-020' } }, async ({ request }) => {
        await test.step('GET /videos/?id → public video present', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/`, { id: publicVideoId });
            expect(videoInItems(items, publicVideoId), 'Public video should appear in anonymous feed').toBeTruthy();
        });
    });

    test('Public short is visible in GET /videos/?type=short', { annotation: { type: 'TC', description: 'AITV-021' } }, async ({ request }) => {
        await test.step('GET /videos/?type=short&id → public short present', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/`, { id: publicShortId, type: 'short' });
            expect(videoInItems(items, publicShortId), 'Public short should appear in anonymous feed').toBeTruthy();
        });
    });

    test('Public video in public channel playlist appears in latest-in-playlists', { annotation: { type: 'TC', description: 'AITV-008' } }, async ({ request }) => {
        await test.step('GET /videos/latest-in-playlists → video present', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/latest-in-playlists`, { maxResults: 20 });
            expect(videoInItems(items, playlistVideoId), 'Public video in public channel playlist should appear in latest-in-playlists').toBeTruthy();
        });
    });

    test('Scheduled public video appears in coming-soon', { annotation: { type: 'TC', description: 'AITV-012' } }, async ({ request }) => {
        await test.step('GET /videos/coming-soon → scheduled public video present', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/coming-soon`, { maxResults: 10 });
            expect(videoInItems(items, scheduledPublicId), 'Scheduled public video should appear in coming-soon').toBeTruthy();
        });
    });
});

// ─── Suite 4: Deleted content — disappears from all feeds ─────────────────────
// Each test is self-contained (own user + upload) because deletion modifies state.

test.describe('Deleted content — disappears from all feeds', () => {
    test('Deleted video disappears from GET /videos/ and latest-in-playlists', { annotation: { type: 'TC', description: 'AITV-007' } }, async ({ request }) => {
        test.setTimeout(180_000);
        const videoApi = new VideoApi(request);
        let videoId = '';
        let token = '';

        await test.step('Setup: create user, upload public video, add to public channel playlist', async () => {
            const setup = await setupPublicChannel(request);
            token = setup.token;
            const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
                privacySetting: 'public',
                waitForProcessing: true,
            });
            videoId = video.id;
            const playlistId = await createChannelPlaylist(request, token, setup.channelId, 'public');
            await addVideoToPlaylist(request, token, playlistId, videoId);
        });

        await test.step('Verify video IS visible in GET /videos/ and latest-in-playlists before deletion', async () => {
            const itemsVideos = await fetchFeedItems(request, `${API_URL}/videos/`, { id: videoId });
            expect(videoInItems(itemsVideos, videoId), 'Public video should appear in /videos/ before deletion').toBeTruthy();

            const itemsPlaylists = await fetchFeedItems(request, `${API_URL}/videos/latest-in-playlists`, { maxResults: 20 });
            expect(videoInItems(itemsPlaylists, videoId), 'Public video should appear in latest-in-playlists before deletion').toBeTruthy();
        });

        await test.step('Delete the video', async () => {
            await videoApi.deleteVideo(token, videoId);
        });

        await test.step('Verify deleted video is NOT in GET /videos/ and NOT in latest-in-playlists', async () => {
            const itemsVideos = await fetchFeedItems(request, `${API_URL}/videos/`, { id: videoId });
            expect(videoInItems(itemsVideos, videoId), 'Deleted video should NOT appear in /videos/').toBeFalsy();

            const itemsPlaylists = await fetchFeedItems(request, `${API_URL}/videos/latest-in-playlists`, { maxResults: 20 });
            expect(videoInItems(itemsPlaylists, videoId), 'Deleted video should NOT appear in latest-in-playlists').toBeFalsy();
        });
    });

    test('Deleted short is not visible in GET /videos/?type=short', { annotation: { type: 'TC', description: 'AITV-017' } }, async ({ request }) => {
        test.setTimeout(180_000);
        const videoApi = new VideoApi(request);
        let videoId = '';
        let token = '';

        await test.step('Setup: create user, upload public short', async () => {
            const setup = await setupPublicChannel(request);
            token = setup.token;
            const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/shortsVideo.mp4', {
                privacySetting: 'public',
                contentType: 'short',
                waitForProcessing: true,
            });
            videoId = video.id;
        });

        await test.step('Verify short IS visible before deletion', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/`, { id: videoId, type: 'short' });
            expect(videoInItems(items, videoId), 'Public short should appear before deletion').toBeTruthy();
        });

        await test.step('Delete the short', async () => {
            await videoApi.deleteVideo(token, videoId);
        });

        await test.step('Verify deleted short is NOT visible in GET /videos/?type=short', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/`, { id: videoId, type: 'short' });
            expect(videoInItems(items, videoId), 'Deleted short should NOT appear in anonymous feed').toBeFalsy();
        });
    });

    test('Deleted scheduled video is not in coming-soon', { annotation: { type: 'TC', description: 'AITV-014' } }, async ({ request }) => {
        test.setTimeout(180_000);
        const videoApi = new VideoApi(request);
        let videoId = '';
        let token = '';

        await test.step('Setup: create user, upload and schedule public video', async () => {
            const setup = await setupPublicChannel(request);
            token = setup.token;
            const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
                privacySetting: 'public',
                waitForProcessing: true,
            });
            videoId = video.id;
            await videoApi.updateVideo(token, videoId, {
                privacySetting: 'public',
                publishedAt: scheduledSoonIso(),
            });
        });

        await test.step('Verify video IS in coming-soon before deletion', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/coming-soon`, { maxResults: 10 });
            expect(videoInItems(items, videoId), 'Video should be in coming-soon before deletion').toBeTruthy();
        });

        await test.step('Delete the video', async () => {
            await videoApi.deleteVideo(token, videoId);
        });

        await test.step('Verify deleted video is NOT in coming-soon', async () => {
            const items = await fetchFeedItems(request, `${API_URL}/videos/coming-soon`, { maxResults: 10 });
            expect(videoInItems(items, videoId), 'Deleted video should NOT appear in coming-soon').toBeFalsy();
        });
    });
});

// ─── Individual: state-change test ───────────────────────────────────────────

test('Video made private disappears from latest-in-playlists', { annotation: { type: 'TC', description: 'AITV-009' } }, async ({ request }) => {
    test.setTimeout(180_000);
    const videoApi = new VideoApi(request);
    let videoId = '';
    let token = '';

    await test.step('Setup: create user, upload public video, add to public channel playlist', async () => {
        const setup = await setupPublicChannel(request);
        token = setup.token;
        const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            privacySetting: 'public',
            waitForProcessing: true,
        });
        videoId = video.id;
        const playlistId = await createChannelPlaylist(request, token, setup.channelId, 'public');
        await addVideoToPlaylist(request, token, playlistId, videoId);
    });

    await test.step('Verify video IS in latest-in-playlists while public', async () => {
        const items = await fetchFeedItems(request, `${API_URL}/videos/latest-in-playlists`, { maxResults: 20 });
        expect(videoInItems(items, videoId), 'Public video should be in feed before privacy change').toBeTruthy();
    });

    await test.step('Change video privacy to private', async () => {
        await videoApi.updateVideo(token, videoId, { privacySetting: 'private' });
    });

    await test.step('Verify private video is NOT in latest-in-playlists', async () => {
        const items = await fetchFeedItems(request, `${API_URL}/videos/latest-in-playlists`, { maxResults: 20 });
        expect(videoInItems(items, videoId), 'Private video should NOT appear in latest-in-playlists').toBeFalsy();

      });
});
