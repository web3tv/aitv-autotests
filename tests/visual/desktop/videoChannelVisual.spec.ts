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

// The video-page screenshot is scoped to the details block (title + 18+ badge +
// description + genre chips + action buttons), which is seeded with fixed content.
// Only the genuinely non-deterministic fields inside it are masked: the channel
// byline (random handle + follower count) and the relative views/date line.
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
        // Seeding uploads 3 videos and waits for each to process — well over the 90s
        // default hook timeout, and this hook re-runs on every test retry.
        test.setTimeout(240_000);
        const requestContext = await playwrightRequest.newContext();
        password = process.env.USER_PASSWORD!;

        // Fixed title/description/category/genres → the watch-page details block
        // renders deterministically. videoCount: 3 → the channel grid has a stable
        // multi-tile layout to screenshot.
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

    // Screenshot the seeded, deterministic details block (title/18+ badge/description/
    // genre chips/action buttons) rather than the whole page. The player poster
    // (backend-derived) and the algorithmic recommendation sections below are outside
    // this element, so they never enter the frame.
    async function shootVideoDetails(page: Page, name: string): Promise<void> {
        const videoPlayer = new VideoPlayerPage(page);
        const header = new HeaderPage(page);

        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(header.header, 'Header is not visible').toBeVisible({ timeout: 15_000 });
        await expect(videoPlayer.videoDescriptionBlock, 'Video details block is not visible')
            .toBeVisible({ timeout: 15_000 });
        await expect(videoPlayer.videoTitle).toBeVisible({ timeout: 15_000 });
        // Wait for the seeded genre chips so the (deterministic) tags are painted.
        await expect(videoPlayer.tagChips.first(), 'Genre chips did not render')
            .toBeVisible({ timeout: 10_000 });
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(videoPlayer.videoDescriptionBlock).toHaveScreenshot(name, {
            mask: videoDetailsMasks(page),
        });
    }

    test('Video page for anonymous user', async ({ page }) => {
        await shootVideoDetails(page, 'video-page-anon.png');
    });

    test('Video page for logged in user', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username);
        await shootVideoDetails(page, 'video-page-logged-in.png');
    });

    // ── Channel page ──
    //
    // TODO(channel-redesign): the channel page is scheduled for a redesign — REWORK
    // this visual test once it lands. Today the identity header (avatar/name/@handle/
    // subscribers) is random per run and the grid tiles carry per-tile relative dates,
    // so both stay masked and the shot mostly verifies layout. Seeding a FIXED 3-video
    // grid (see beforeAll) at least makes the tile COUNT — and thus the masked grid's
    // height — deterministic. After the redesign, unmask the grid (fixed titles +
    // cat.jpg covers are deterministic) for a meaningful screenshot.

    test('Channel page for anonymous user', async ({ page }) => {
        const channelPage = new ChannelMainPage(page);
        const header = new HeaderPage(page);

        await page.goto(channelUrl);
        await page.waitForLoadState('domcontentloaded');
        await expect(header.header, 'Header is not visible').toBeVisible({ timeout: 15_000 });
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(channelPage.forYouHeading).toBeVisible({timeout:10_000});
        await expect(page).toHaveScreenshot('channel-page-anon.png', {
            fullPage: false,
            mask: channelPageMasks(page),
            maxDiffPixelRatio: 0.02
        });
    });

    test('Channel page for logged in user', async ({ page }) => {
        const channelPage = new ChannelMainPage(page);
        const header = new HeaderPage(page);
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username);

        await page.goto(channelUrl);
        await page.waitForLoadState('domcontentloaded');
        await expect(header.header, 'Header is not visible').toBeVisible({ timeout: 15_000 });
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(channelPage.forYouHeading).toBeVisible({timeout:10_000});
        await expect(page).toHaveScreenshot('channel-page-logged-in.png', {
            fullPage: false,
            mask: channelPageMasks(page),
            maxDiffPixelRatio: 0.02
        });
    });

})
