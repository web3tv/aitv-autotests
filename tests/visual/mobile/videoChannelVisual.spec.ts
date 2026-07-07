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

// See the desktop spec: after the 2026 redesign the grid (`aitv-video-card`) is
// cover-only and seeded, so it is screenshot unmasked. Only the random name/@handle
// and the authed header trigger are masked. `username` targets the hero name/@handle,
// which carry no data-id attributes.
const channelPageMasks = (page: Page, username: string) => {
    const header = new HeaderPage(page);
    return [
        page.getByRole('heading', { name: username }),
        page.getByText(`@${username}`, { exact: true }),
        header.userIcon,
    ];
};

test.describe('Mobile video & channel visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;
    let videoUrl: string;
    let channelUrl: string;
    // Second, channel-less account for the logged-in non-owner ("user") channel view.
    let viewerEmail: string;
    let viewerUsername: string;

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

        const viewer = await new AuthApi(requestContext).createUserFast();
        viewerEmail = viewer.email;
        viewerUsername = viewer.username;

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

    // ── Channel page (2026 redesign) ──
    // Three viewer states — anonymous, logged-in non-owner ("user"), and owner. The
    // seeded 3-video grid is screenshot unmasked; only the random name/@handle and the
    // authed header trigger are masked. State is told apart by the hero action button:
    // visitors see "Follow", the owner sees "Edit".

    // Open the owner's channel, wait for the grid covers to paint, and screenshot the
    // viewport. `ownerView` selects the hero-button anchor so the shot waits for the
    // intended UI.
    async function shootChannel(page: Page, name: string, ownerView: boolean): Promise<void> {
        const channelPage = new ChannelMainPage(page);
        const header = new HeaderPage(page);

        await page.goto(channelUrl, { waitUntil: 'domcontentloaded' });
        await expect(header.mobileHeader, 'Mobile header is not visible').toBeVisible({ timeout: 15_000 });
        await expect(channelPage.channelNameHeading.first(), 'Channel name is not visible')
            .toBeVisible({ timeout: 15_000 });
        const stateAnchor = ownerView ? channelPage.editBtn : channelPage.followBtn;
        await expect(stateAnchor, `Expected ${ownerView ? 'owner (Edit)' : 'visitor (Follow)'} hero control`)
            .toBeVisible({ timeout: 15_000 });
        await expect(channelPage.videoCards.first(), 'Channel video grid did not render')
            .toBeVisible({ timeout: 15_000 });
        await page.waitForFunction(() => {
            const imgs = Array.from(document.querySelectorAll('[data-id="aitv-video-card"] img')).slice(0, 6);
            return imgs.length > 0 && imgs.every(i => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0);
        }, { timeout: 20_000 });
        await page.evaluate(async () => { await document.fonts.ready; });
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot(name, {
            fullPage: false,
            mask: channelPageMasks(page, username),
            maxDiffPixelRatio: 0.02,
        });
    }

    test('Channel page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-MOB-003' },
    }, async ({ page }) => {
        await test.step('Open channel page and screenshot', async () => {
            await shootChannel(page, 'channel-page-anon.png', false);
        });
    });

    test('Channel page for logged-in user (not owner)', {
        annotation: { type: 'TC', description: 'VIS-MOB-005' },
    }, async ({ page }) => {
        await test.step('Login as non-owner', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(viewerEmail, password, viewerUsername, true);
        });
        await test.step('Open channel page and screenshot', async () => {
            await shootChannel(page, 'channel-page-user.png', false);
        });
    });

    test('Channel page for channel owner', {
        annotation: { type: 'TC', description: 'VIS-MOB-004' },
    }, async ({ page }) => {
        await test.step('Login as owner', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username, true);
        });
        await test.step('Open channel page and screenshot', async () => {
            await shootChannel(page, 'channel-page-owner.png', true);
        });
    });

});
