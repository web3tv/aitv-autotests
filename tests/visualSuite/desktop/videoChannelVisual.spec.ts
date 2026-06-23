import { test, expect, request as playwrightRequest, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { VideoPlayerPage } from '../../../src/pages/components/VideoPlayerPage';
import { ChannelMainPage } from '../../../src/pages/channel/ChannelMainPage';
import { setupVideoViaApi } from '../../../src/utils/studioTestHelpers';

const videoPageMasks = (page: Page) => {
    const video = new VideoPlayerPage(page);
    const header = new HeaderPage(page);
    return [
        video.recommendedVideos,
        video.playerContainer,
        header.userIcon,
        header.channelTriggerBtn,
        video.videoTitle,
        video.videoSubtitle,
        video.authorAvatar,
        video.videoViewsCount,
        video.videoViewsCountDate,
        video.commentingAsTrigger,
    ];
};

const channelPageMasks = (page: Page) => {
    const channel = new ChannelMainPage(page);
    const header = new HeaderPage(page);
    return [
        channel.videos,
        channel.avatar,
        channel.videoCount,
        channel.subscribersCount,
        channel.channelName,
        channel.channelHandle,
        header.userIcon,
        header.channelTriggerBtn,
    ];
};

test.describe('Main domain visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;
    let videoUrl: string;
    let channelUrl: string;

    test.beforeAll(async () => {
        const requestContext = await playwrightRequest.newContext();
        password = process.env.USER_PASSWORD!;

        const setup = await setupVideoViaApi(requestContext, {
            privacySetting: 'public',
            title: `Visual_${Date.now()}`,
            description: 'Visual test video',
        });
        userEmail = setup.user.email;
        username = setup.user.username;
        videoUrl = setup.videoUrl;
        channelUrl = setup.channelUrl;

        await requestContext.dispose();
    });


    // ── Video page ──

    test('Video page for anonymous user', async ({ page }) => {
        const videoPlayer = new VideoPlayerPage(page);

        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(videoPlayer.videoTitle).toBeVisible({ timeout: 15_000 });
        await expect(videoPlayer.shareBtn).toBeVisible({ timeout: 10_000 });
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot('video-page-anon.png', {
            fullPage: true,
            mask: videoPageMasks(page),
            // maxDiffPixelRatio: 0.02
        });
    });

    test('Video page for logged in user', async ({ page }) => {
        const videoPlayer = new VideoPlayerPage(page);
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username);

        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(videoPlayer.videoTitle).toBeVisible({ timeout: 15_000 });
        await expect(videoPlayer.shareBtn).toBeVisible({ timeout: 10_000 });
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot('video-page-logged-in.png', {
            fullPage: true,
            mask: videoPageMasks(page),
            // maxDiffPixelRatio: 0.02
        });
    });

    // ── Channel page ──

    test('Channel page for anonymous user', async ({ page }) => {
        const channelPage = new ChannelMainPage(page);

        await page.goto(channelUrl);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(channelPage.forYouHeading).toBeVisible({timeout:10_000});
        await expect(page).toHaveScreenshot('channel-page-anon.png', {
            fullPage: false,
            mask: channelPageMasks(page),
            // maxDiffPixelRatio: 0.02
        });
    });

    test('Channel page for logged in user', async ({ page }) => {
        const channelPage = new ChannelMainPage(page);
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username);

        await page.goto(channelUrl);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(channelPage.forYouHeading).toBeVisible({timeout:10_000});
        await expect(page).toHaveScreenshot('channel-page-logged-in.png', {
            fullPage: false,
            mask: channelPageMasks(page),
            // maxDiffPixelRatio: 0.02
        });
    });

})
