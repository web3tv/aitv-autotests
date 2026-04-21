import { expect, Page, APIRequestContext, Response } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { VideoApi } from '../api/VideoApi';
import { SubscriptionApi } from '../api/SubscriptionApi';
import { AuthFlow } from '../flows/AuthFlow';
import { StudioProfilePage } from '../pages/studio/StudioProfilePage';
import { SideBarPage } from '../pages/components/SideBarPage';

export async function setupUserWithPublicChannel(page: Page, request: APIRequestContext): Promise<{ email: string, username: string }> {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const studioProfilePage = new StudioProfilePage(page);
    const sideBar = new SideBarPage(page);

    const user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    await sideBar.clickStudioEditChannel();
    await studioProfilePage.changePrivacyToPublic();
    await sideBar.clickStudioContent();
    return user;
}

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
    user: { id: string; email: string; username: string };
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
        description?: string;
        subscriptionOptions?: { title: string; description: string; price: string; duration?: number };
    }
): Promise<VideoSetupResult> {
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    const password = process.env.USER_PASSWORD!;
    const baseUrl = process.env.BASE_URL!;

    const user = await authApi.createAndVerifyUser();
    const token = await authApi.getUserToken(user.email, password);
    const channelId = await videoApi.getChannelId(token);
    await videoApi.setChannelPublic(token, channelId, user.username);

    const videoName = Date.now().toString();
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

    const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
        title: videoName,
        description,
        privacySetting: options.privacySetting,
        subId,
        waitForProcessing: true,
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
