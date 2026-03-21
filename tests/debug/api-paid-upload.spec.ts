import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';
import { SubscriptionApi } from '../../src/api/SubscriptionApi';

test('Upload paid video via API with subscription binding', async ({ request }) => {
    test.setTimeout(120_000);
    const password = process.env.USER_PASSWORD!;
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    const subscriptionApi = new SubscriptionApi(request);

    const user = await authApi.createAndVerifyUser();
    const token = await authApi.getUserToken(user.email, password);
    const channelId = await videoApi.getChannelId(token);

    console.log('User:', user.username, '| Channel:', channelId);

    // 1. Create paid subscription
    const sub = await subscriptionApi.createPaidSubscription(token, channelId);
    console.log('Subscription created:', sub.id);

    // 2. Upload paid video with subId binding
    const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
        title: `PaidVideo_${Date.now()}`,
        privacySetting: 'paid',
        subId: sub.id,
        waitForProcessing: true,
    });

    console.log('Video uploaded:', video.id);
    console.log('Video URL:', video.videoPlayerFeUrl);

    expect(video.videoPlayerFeUrl).toBeTruthy();
});
