import { test } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';

test('Video player plays uploaded video', { annotation: [{ type: 'TC', description: 'PLAYER-001' }, { type: 'TC', description: 'PLAYER-002' }, { type: 'TC', description: 'PLAYER-003' }] }, async ({ page, request }) => {
    test.setTimeout(120_000);
    const videoName: string = Date.now().toString();
    const password = process.env.USER_PASSWORD!;
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    let videoUrl: string;
    let userEmail: string;
    let username: string;

    await test.step('Create user, set channel public and upload video via API', async () => {
        const user = await authApi.createAndVerifyUser();
        userEmail = user.email;
        username = user.username;
        const token = await authApi.getUserToken(userEmail, password);
        const channelId = await videoApi.getChannelId(token);
        await videoApi.setChannelPublic(token, channelId, username);

        const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            title: videoName,
            privacySetting: 'public',
            waitForProcessing: true,
        });
        videoUrl = video.videoPlayerFeUrl;
    });

    await test.step('Login, open video and assert player is playing', async () => {
        const authFlow = new AuthFlow(page);
        const videoPlayer = new VideoPlayerPage(page);

        await authFlow.loginSuccess(userEmail, password, username);
        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await videoPlayer.assertVideoIsPlaying();
    });
});

test('Video player plays uploaded short', { annotation: [{ type: 'TC', description: 'SHORTS-001' }, { type: 'TC', description: 'SHORTS-002' }] }, async ({ page, request }) => {
    test.setTimeout(180_000);
    const videoName: string = Date.now().toString();
    const password = process.env.USER_PASSWORD!;
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    let shortUrl: string;

    await test.step('Create user, set channel public and upload short via API', async () => {
        const user = await authApi.createAndVerifyUser();
        const token = await authApi.getUserToken(user.email, password);
        const channelId = await videoApi.getChannelId(token);
        await videoApi.setChannelPublic(token, channelId, user.username);

        const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/shortsVideo.mp4', {
            title: videoName,
            privacySetting: 'public',
            contentType: 'short',
            waitForProcessing: true,
        });
        shortUrl = video.videoPlayerFeUrl;
    });

    await test.step('Login as another user, open short and assert player is playing', async () => {
        const authFlow = new AuthFlow(page);
        const videoPlayer = new VideoPlayerPage(page);

        const user2 = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user2.email, password, user2.username);
        await page.goto(shortUrl, { waitUntil: 'domcontentloaded' });
        await videoPlayer.assertShortsIsPlaying();
    });
});
