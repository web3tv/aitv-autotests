import { test, expect, request as playwrightRequest, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { VideoPlayerPage } from '../../../src/pages/components/VideoPlayerPage';
import { ChannelMainPage } from '../../../src/pages/channel/ChannelMainPage';
import { setupVideoViaApi } from '../../../src/utils/studioTestHelpers';
import { AuthApi } from '../../../src/api/AuthApi';
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

// After the 2026 channel redesign the grid tiles (`aitv-video-card`) are cover-only
// at rest and seeded with the fixed cat.jpg cover, so the grid is screenshot for real
// — no longer masked. Only genuinely non-deterministic regions stay masked: the
// identity name/@handle (a random username per run) and the authed header's profile
// trigger. The hero avatar is the default silhouette (identical across users) and the
// followers count is a fixed "0", so both are left visible. `username` is the seeded
// owner's handle, used to target the name heading and @handle text (the hero carries
// no data-id attributes).
const channelPageMasks = (page: Page, username: string) => {
    const header = new HeaderPage(page);
    return [
        page.getByRole('heading', { name: username }),   // channel name (rendered as h1)
        page.getByText(`@${username}`, { exact: true }),  // @handle
        header.userIcon,          // authed profile trigger (no-op match when anonymous)
        header.channelTriggerBtn,
    ];
};

test.describe('Main domain visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;
    let videoUrl: string;
    let channelUrl: string;
    // A second account that does NOT own the seeded channel — used for the logged-in
    // non-owner ("user") channel screenshot.
    let viewerEmail: string;
    let viewerUsername: string;

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

        // Second, channel-less account for the non-owner channel view.
        const viewer = await new AuthApi(requestContext).createUserFast();
        viewerEmail = viewer.email;
        viewerUsername = viewer.username;

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

    // ── Channel page (2026 redesign) ──
    //
    // Three viewer states of the public channel view: anonymous, a logged-in non-owner
    // ("user"), and the channel owner. The seeded 3-video grid (cat.jpg covers, fixed
    // titles) is screenshot unmasked; only the random name/@handle and the authed
    // header trigger are masked (see channelPageMasks). State is distinguished by the
    // hero action button — visitors see "Follow", the owner sees "Edit"/"Share".

    // Open the owner's channel, wait for the grid covers to finish loading, and
    // screenshot the viewport. `ownerView` picks the hero-button anchor so the shot is
    // only taken once the intended (owner vs visitor) UI has rendered.
    async function shootChannel(page: Page, name: string, ownerView: boolean): Promise<void> {
        const channelPage = new ChannelMainPage(page);
        const header = new HeaderPage(page);

        await page.goto(channelUrl, { waitUntil: 'domcontentloaded' });
        await expect(header.header, 'Header is not visible').toBeVisible({ timeout: 15_000 });
        await expect(channelPage.channelNameHeading.first(), 'Channel name is not visible')
            .toBeVisible({ timeout: 15_000 });
        const stateAnchor = ownerView ? channelPage.editBtn : channelPage.followBtn;
        await expect(stateAnchor, `Expected ${ownerView ? 'owner (Edit)' : 'visitor (Follow)'} hero control`)
            .toBeVisible({ timeout: 15_000 });
        await expect(channelPage.videoCards.first(), 'Channel video grid did not render')
            .toBeVisible({ timeout: 15_000 });
        // Grid covers are lazy — wait until the above-the-fold tile images have painted
        // so the screenshot never catches the MuiSkeleton placeholders.
        await page.waitForFunction(() => {
            const imgs = Array.from(document.querySelectorAll('[data-id="aitv-video-card"] img')).slice(0, 6);
            return imgs.length > 0 && imgs.every(i => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0);
        }, { timeout: 20_000 });
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(page).toHaveScreenshot(name, {
            fullPage: false,
            mask: channelPageMasks(page, username),
            maxDiffPixelRatio: 0.02,
        });
    }

    test('Channel page for anonymous user', async ({ page }) => {
        await shootChannel(page, 'channel-page-anon.png', false);
    });

    test('Channel page for logged-in user (not owner)', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(viewerEmail, password, viewerUsername);
        await shootChannel(page, 'channel-page-user.png', false);
    });

    test('Channel page for channel owner', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username);
        await shootChannel(page, 'channel-page-owner.png', true);
    });

})
