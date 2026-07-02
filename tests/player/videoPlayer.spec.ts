import { test } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { setupVideoViaApi } from '../../src/utils/studioTestHelpers';

test('Video player plays uploaded video', { tag: '@critical', annotation: [{ type: 'TC', description: 'PLAYER-001' }, { type: 'TC', description: 'PLAYER-002' }, { type: 'TC', description: 'PLAYER-003' }] }, async ({ page, request }) => {
    test.setTimeout(120_000);
    const password = process.env.USER_PASSWORD!;
    const authFlow = new AuthFlow(page);
    const videoPlayer = new VideoPlayerPage(page);
    let setup: Awaited<ReturnType<typeof setupVideoViaApi>>;

    await test.step('Create user and upload video via API', async () => {
        setup = await setupVideoViaApi(request, { privacySetting: 'public' });
    });

    await test.step('Login, open video and assert player is playing', async () => {
        await authFlow.loginSuccess(setup.user.email, password, setup.user.username);
        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await videoPlayer.assertVideoIsPlaying();
    });
});

test('Video player plays uploaded short', { annotation: [{ type: 'TC', description: 'SHORTS-001' }, { type: 'TC', description: 'SHORTS-002' }] }, async ({ page, request }) => {
    test.setTimeout(180_000);
    const password = process.env.USER_PASSWORD!;
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const videoPlayer = new VideoPlayerPage(page);
    let setup: Awaited<ReturnType<typeof setupVideoViaApi>>;

    await test.step('Create user and upload short via API', async () => {
        setup = await setupVideoViaApi(request, {
            privacySetting: 'public',
            contentType: 'short',
        });
    });

    await test.step('Login as another user, open short and assert player is playing', async () => {
        const user2 = await authApi.createUserFast();
        await authFlow.loginSuccess(user2.email, password, user2.username);
        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await videoPlayer.assertShortsIsPlaying();
    });
});
