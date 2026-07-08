import { test } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { resolveSharedFixture, SharedFixture } from '../fixtures/sharedFixture';

// READ-ONLY: play the pre-seeded public video/short from the shared `@qavischan`
// fixture (no per-test upload/transcode). Log in as the fixture's non-owner viewer.
// Content URLs are resolved from the current stand at runtime (env-agnostic); the
// `fixture-check` preflight fails the run cleanly with a re-seed hint if it's missing.
let fx: SharedFixture;
test.beforeAll(async () => { fx = await resolveSharedFixture(); });

test('Video player plays uploaded video', { tag: '@critical', annotation: [{ type: 'TC', description: 'PLAYER-001' }, { type: 'TC', description: 'PLAYER-002' }, { type: 'TC', description: 'PLAYER-003' }] }, async ({ page }) => {
    const authFlow = new AuthFlow(page);
    const videoPlayer = new VideoPlayerPage(page);

    await test.step('Login as the fixture viewer (non-owner)', async () => {
        await authFlow.loginSuccess(fx.viewerEmail, fx.password, fx.viewerUsername);
    });

    await test.step('Open the seeded public video and assert player is playing', async () => {
        await page.goto(fx.videoUrl, { waitUntil: 'domcontentloaded' });
        await videoPlayer.assertVideoIsPlaying();
    });
});

test('Video player plays uploaded short', { annotation: [{ type: 'TC', description: 'SHORTS-001' }, { type: 'TC', description: 'SHORTS-002' }] }, async ({ page }) => {
    const authFlow = new AuthFlow(page);
    const videoPlayer = new VideoPlayerPage(page);

    await test.step('Login as the fixture viewer (non-owner)', async () => {
        await authFlow.loginSuccess(fx.viewerEmail, fx.password, fx.viewerUsername);
    });

    await test.step('Open the seeded short and assert player is playing', async () => {
        await page.goto(fx.shortUrl, { waitUntil: 'domcontentloaded' });
        await videoPlayer.assertShortsIsPlaying();
    });
});
