import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';

test('Upload short video via API with public channel', async ({ request }) => {
    test.setTimeout(120_000);
    const password = process.env.USER_PASSWORD!;
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);

    const user = await authApi.createAndVerifyUser();
    const token = await authApi.getUserToken(user.email, password);
    const channelId = await videoApi.getChannelId(token);

    console.log('User:', user.username, '| Channel:', channelId);

    await videoApi.setChannelPublic(token, channelId, user.username);
    console.log('Channel set to public');

    const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/shortsVideo.mp4', {
        title: `Short_${Date.now()}`,
        privacySetting: 'public',
        contentType: 'short',
        waitForProcessing: true,
    });

    console.log('Video ID:', video.id);
    console.log('Video URL:', video.videoPlayerFeUrl);

    expect(video.videoPlayerFeUrl).toBeTruthy();
    expect(video.videoPlayerFeUrl).toContain('/short/');
});
