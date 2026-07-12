import { test, expect, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { VideoPlayerPage } from '../../../src/pages/components/VideoPlayerPage';
import { ChannelMainPage } from '../../../src/pages/channel/ChannelMainPage';
import { resolveSharedFixture } from '../../fixtures/sharedFixture';

// NOTE: this file is intentionally a near-duplicate of its desktop twin
// (tests/visual/desktop/videoChannelVisual.spec.ts). Keep the two in sync — they share
// one skeleton and differ ONLY in the lines marked `// platform:` (header anchor,
// isMobile login flag, describe title, TC prefix, mobile settle).

// The video-page screenshot is scoped to the details block (title + 18+ badge +
// description + genre chips + action buttons), seeded with fixed content. The views/
// date line stays masked (relative "N views • X ago" is non-deterministic); the channel
// byline is the fixed fixture handle + follower count, but stays masked so this spec's
// video shot is independent of channel-identity churn.
const videoDetailsMasks = (page: Page) => {
    const video = new VideoPlayerPage(page);
    return [
        video.channelByline,
        video.videoViewsCount,
        video.videoViewsCountDate,
    ];
};

// The channel comes from a FIXED seeded fixture (deterministic handle, name, follower
// count, description, socials and owner avatar — see tests/fixtures/sharedFixture.ts),
// so the identity hero AND the authed header controls are screenshot UNMASKED. Only the
// seeded short stays masked — it auto-plays.
const channelPageMasks = (page: Page) => {
    const channel = new ChannelMainPage(page);
    return [
        channel.shortCards,
    ];
};

// platform: describe title
test.describe('Video & channel visual tests (mobile)', () => {

    let userEmail: string;
    let password: string;
    let username: string;
    let videoUrl: string;
    let channelUrl: string;
    // The fixed logged-in NON-owner used for the "user" channel screenshot.
    let viewerEmail: string;
    let viewerUsername: string;

    test.beforeAll(async () => {
        // Resolve the pre-seeded fixture from the current stand (no per-run uploads).
        // Seed once with `npm run seed:fixture`; the fixture-check preflight fails fast
        // with a re-seed hint if it's missing.
        const fx = await resolveSharedFixture();
        userEmail = fx.ownerEmail;
        username = fx.ownerUsername;
        password = fx.password;
        videoUrl = fx.videoUrl;
        channelUrl = fx.channelUrl;
        viewerEmail = fx.viewerEmail;
        viewerUsername = fx.viewerUsername;
    });

    // ── Video page ──
    // Screenshot the seeded, deterministic details block (title/18+ badge/description/
    // genre chips/action buttons) rather than the whole page — the player poster and the
    // algorithmic recommendation sections stay outside this element, out of frame.
    async function shootVideoDetails(page: Page, name: string): Promise<void> {
        const videoPlayer = new VideoPlayerPage(page);
        const header = new HeaderPage(page);

        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(header.mobileHeader, 'Mobile header is not visible').toBeVisible({ timeout: 15_000 }); // platform: header anchor
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

    // ── Channel page (2026 redesign) ──
    // Three viewer states of the public channel view: anonymous, a logged-in non-owner
    // ("user"), and the channel owner. The seeded grid (cat.jpg covers, fixed titles) is
    // screenshot unmasked; state is distinguished by the hero action button — visitors
    // see "Follow", the owner sees "Edit"/"Share". `ownerView` picks that anchor so the
    // shot is only taken once the intended UI has rendered.
    async function shootChannel(page: Page, name: string, ownerView: boolean): Promise<void> {
        const channelPage = new ChannelMainPage(page);
        const header = new HeaderPage(page);

        await page.goto(channelUrl, { waitUntil: 'domcontentloaded' });
        await expect(header.mobileHeader, 'Mobile header is not visible').toBeVisible({ timeout: 15_000 }); // platform: header anchor
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
        await page.waitForTimeout(2000); // platform: mobile settle (webkit is slower to settle the grid)
        await expect(page).toHaveScreenshot(name, {
            fullPage: false,
            mask: channelPageMasks(page),
            maxDiffPixelRatio: 0.02,
        });
    }

    test('Video page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-MOB-001' }, // platform: TC prefix
    }, async ({ page }) => {
        await test.step('Open video page and screenshot details block', async () => {
            await shootVideoDetails(page, 'video-page-anon.png');
        });
    });

    test('Video page for logged in user', {
        annotation: { type: 'TC', description: 'VIS-MOB-002' }, // platform: TC prefix
    }, async ({ page }) => {
        await test.step('Login', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username, true); // platform: isMobile flag
        });
        await test.step('Open video page and screenshot details block', async () => {
            await shootVideoDetails(page, 'video-page-logged-in.png');
        });
    });

    test('Channel page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-MOB-003' }, // platform: TC prefix
    }, async ({ page }) => {
        await test.step('Open channel page and screenshot', async () => {
            await shootChannel(page, 'channel-page-anon.png', false);
        });
    });

    test('Channel page for logged-in user (not owner)', {
        annotation: { type: 'TC', description: 'VIS-MOB-004' }, // platform: TC prefix
    }, async ({ page }) => {
        await test.step('Login as non-owner', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(viewerEmail, password, viewerUsername, true); // platform: isMobile flag
        });
        await test.step('Open channel page and screenshot', async () => {
            await shootChannel(page, 'channel-page-user.png', false);
        });
    });

    test('Channel page for channel owner', {
        annotation: { type: 'TC', description: 'VIS-MOB-005' }, // platform: TC prefix
    }, async ({ page }) => {
        await test.step('Login as owner', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username, true); // platform: isMobile flag
        });
        await test.step('Open channel page and screenshot', async () => {
            await shootChannel(page, 'channel-page-owner.png', true);
        });
    });

});
