import { test, expect, request as playwrightRequest, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { VideoPlayerPage } from '../../../src/pages/components/VideoPlayerPage';
import { ChannelMainPage } from '../../../src/pages/channel/ChannelMainPage';
import { setupVideoViaApi } from '../../../src/utils/studioTestHelpers';
import {
    VISUAL_VIDEO_TITLE,
    VISUAL_VIDEO_DESCRIPTION,
    VISUAL_VIDEO_CATEGORY_SLUG,
    VISUAL_VIDEO_GENRES,
    VISUAL_VIDEO_CONTENT_RATING,
} from '../shared/videoSeed';

// See the desktop spec: screenshot the seeded, deterministic details block (title +
// 18+ badge + description + genre chips + actions) and mask only the channel byline
// (random handle + followers) and the relative views/date.
const videoDetailsMasks = (page: Page) => {
    const video = new VideoPlayerPage(page);
    return [
        video.channelByline,
        video.videoViewsCount,
        video.videoViewsCountDate,
    ];
};

const channelPageMasks = (page: Page) => {
    const channel = new ChannelMainPage(page);
    return [
        channel.videos,
        channel.avatar,
        channel.videoCount,
        channel.subscribersCount,
        channel.channelName,
        channel.channelHandle,
    ];
};

test.describe('Mobile video & channel visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;
    let videoUrl: string;
    let channelUrl: string;

    test.beforeAll(async () => {
        // 3 video uploads + processing exceed the 90s default hook timeout (and this
        // hook re-runs on every test retry).
        test.setTimeout(240_000);
        const requestContext = await playwrightRequest.newContext();
        password = process.env.USER_PASSWORD!;

        // Fixed content → deterministic details block; videoCount: 3 → stable grid.
        const setup = await setupVideoViaApi(requestContext, {
            privacySetting: 'public',
            title: VISUAL_VIDEO_TITLE,
            description: VISUAL_VIDEO_DESCRIPTION,
            categorySlug: VISUAL_VIDEO_CATEGORY_SLUG,
            genres: VISUAL_VIDEO_GENRES,
            contentRating: VISUAL_VIDEO_CONTENT_RATING,
            videoCount: 3,
        });
        userEmail = setup.user.email;
        username = setup.user.username;
        videoUrl = setup.videoUrl;
        channelUrl = setup.channelUrl;

        await requestContext.dispose();
    });

    // ── Video page ──

    // Screenshot the seeded details block (title/18+ badge/description/genre chips/
    // actions), not the page — the player poster and recommendation sections below
    // stay out of frame.
    async function shootVideoDetails(page: Page, name: string): Promise<void> {
        const videoPlayer = new VideoPlayerPage(page);
        const header = new HeaderPage(page);

        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(header.mobileHeader, 'Mobile header is not visible').toBeVisible({ timeout: 15_000 });
        await expect(videoPlayer.videoDescriptionBlock, 'Video details block is not visible')
            .toBeVisible({ timeout: 15_000 });
        await expect(videoPlayer.videoTitle).toBeVisible({ timeout: 15_000 });
        await expect(videoPlayer.tagChips.first(), 'Genre chips did not render')
            .toBeVisible({ timeout: 10_000 });
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(videoPlayer.videoDescriptionBlock).toHaveScreenshot(name, {
            mask: videoDetailsMasks(page),
        });
    }

    test('Video page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-MOB-001' },
    }, async ({ page }) => {
        await test.step('Open video page and screenshot details block', async () => {
            await shootVideoDetails(page, 'video-page-anon.png');
        });
    });

    test('Video page for logged in user', {
        annotation: { type: 'TC', description: 'VIS-MOB-002' },
    }, async ({ page }) => {
        await test.step('Login', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username, true);
        });
        await test.step('Open video page and screenshot details block', async () => {
            await shootVideoDetails(page, 'video-page-logged-in.png');
        });
    });

    // ── Channel page ──
    // TODO(channel-redesign): rework after the upcoming channel redesign — identity
    // header is random per run and grid tiles carry relative dates, so both stay
    // masked. The fixed 3-video seed keeps the tile count/height deterministic.

    test('Channel page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-MOB-003' },
    }, async ({ page }) => {
        const channelPage = new ChannelMainPage(page);
        const header = new HeaderPage(page);

        await test.step('Open channel page', async () => {
            await page.goto(channelUrl);
            await page.waitForLoadState('domcontentloaded');
            await expect(header.mobileHeader, 'Mobile header is not visible').toBeVisible({ timeout: 15_000 });
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(channelPage.forYouHeading).toBeVisible({ timeout: 10_000 });
            await expect(channelPage.channelSubscribeBtn).toBeVisible();
            await page.waitForTimeout(2000);
        });

        await test.step('Take screenshot', async () => {
            await expect(page).toHaveScreenshot('channel-page-anon.png', {
                fullPage: false,
                mask: channelPageMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    test('Channel page for logged in user', {
        annotation: { type: 'TC', description: 'VIS-MOB-004' },
    }, async ({ page }) => {
        const channelPage = new ChannelMainPage(page);
        const header = new HeaderPage(page);

        await test.step('Login and open channel page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username, true);
            await page.goto(channelUrl);
            await page.waitForLoadState('domcontentloaded');
            await expect(header.mobileHeader, 'Mobile header is not visible').toBeVisible({ timeout: 15_000 });
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(channelPage.forYouHeading).toBeVisible({ timeout: 10_000 });
            await expect(channelPage.editChannelBtn).toBeVisible();
            await page.waitForTimeout(2000);
        });

        await test.step('Take screenshot', async () => {
            await expect(page).toHaveScreenshot('channel-page-logged-in.png', {
                fullPage: false,
                mask: channelPageMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

});
