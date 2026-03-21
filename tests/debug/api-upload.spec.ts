import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';

test('Upload video via API', async ({ request }) => {
    test.setTimeout(300_000);

    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);

    // Create & verify user
    const user = await authApi.createAndVerifyUser();
    console.log(`User: ${user.email}`);

    // Get user token
    const token = await authApi.getUserToken(user.email, process.env.USER_PASSWORD!);
    console.log(`Token obtained`);

    // Upload video via API
    console.log('Starting upload...');
    const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
        title: 'API Upload Test',
        description: 'Uploaded via VideoApi',
    });

    console.log(`Video uploaded! ID: ${video.id}, URL: ${video.videoPlayerFeUrl}`);
    expect(video.id).toBeTruthy();
    expect(video.title).toBe('API Upload Test');
});
