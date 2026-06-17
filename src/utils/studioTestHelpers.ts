import { expect, Page, APIRequestContext, Response } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { VideoApi } from '../api/VideoApi';
import { SubscriptionApi } from '../api/SubscriptionApi';

export async function uploadWithChunkCheck(page: Page, uploadFn: () => Promise<void>): Promise<void> {
    let chunkError: string | null = null;
    const listener = (response: Response) => {
        if (response.url().includes('chunk') && response.status() === 500) {
            chunkError = `Chunk upload failed with 500: ${response.url()}`;
        }
    };
    page.on('response', listener);
    await uploadFn();
    page.off('response', listener);
    expect(chunkError, chunkError ?? '').toBeNull();
}

export interface VideoSetupResult {
    user: { id?: string; email: string; username: string };
    token: string;
    channelId: string;
    videoId: string;
    videoUrl: string;
    videoName: string;
    description: string;
    channelUrl: string;
    subId?: string;
    membershipName?: string;
    membershipDescription?: string;
}

export async function setupVideoViaApi(
    request: APIRequestContext,
    options: {
        privacySetting: 'public' | 'private' | 'unlisted' | 'paid';
        title?: string;
        description?: string;
        contentType?: 'video' | 'short';
        coverVerticalImgPath?: string;
        waitForProcessing?: boolean;
        subscriptionOptions?: { title: string; description: string; price: string; duration?: number };
    }
): Promise<VideoSetupResult> {
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    const password = process.env.USER_PASSWORD!;
    const baseUrl = process.env.BASE_URL!;

    const user = await authApi.createUserFast();
    const token = await authApi.getUserToken(user.email, password);
    const channelId = await videoApi.getChannelId(token);

    const videoName = options.title ?? Date.now().toString();
    const description = options.description ?? (Date.now() + 1).toString();

    let subId: string | undefined;
    let membershipName: string | undefined;
    let membershipDescription: string | undefined;

    if (options.privacySetting === 'paid') {
        const subscriptionApi = new SubscriptionApi(request);
        const subOpts = options.subscriptionOptions ?? {
            title: `Subscription ${videoName}`,
            description: `Description ${videoName}`,
            price: '0.99',
        };
        membershipName = subOpts.title;
        membershipDescription = subOpts.description;
        const sub = await subscriptionApi.createPaidSubscription(token, channelId, subOpts);
        subId = sub.id;
    }

    const contentType = options.contentType ?? 'video';
    const filePath = contentType === 'short'
        ? 'test-data/fixtures/video/shortsVideo.mp4'
        : 'test-data/fixtures/video/5secVideo.mp4';

    const video = await videoApi.uploadVideo(token, filePath, {
        title: videoName,
        description,
        privacySetting: options.privacySetting,
        contentType,
        subId,
        coverVerticalImgPath: options.coverVerticalImgPath ?? 'test-data/fixtures/photo/cat.jpg',
        waitForProcessing: options.waitForProcessing ?? true,
    });

    return {
        user,
        token,
        channelId,
        videoId: video.id,
        videoUrl: video.videoPlayerFeUrl,
        videoName,
        description,
        channelUrl: `${baseUrl}/@${user.username}`,
        subId,
        membershipName,
        membershipDescription,
    };
}
