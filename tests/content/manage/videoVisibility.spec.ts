import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { ChannelMainPage } from '../../../src/pages/channel/ChannelMainPage';
import { VideoPlayerPage } from '../../../src/pages/components/VideoPlayerPage';
import { setupVideoViaApi, VideoSetupResult } from '../../../src/utils/studioTestHelpers';
import { resolveSharedFixture, SharedFixture } from '../../fixtures/sharedFixture';
import { FIXTURE_VIDEO_TITLE, FIXTURE_UNLISTED_TITLE } from '../../fixtures/videoSeed';

// READ-ONLY: public/private/unlisted videos all live on the shared `@qavischan`
// fixture, so these tests only VIEW them (channel listing + direct-link access) — no
// per-run upload. Login (when needed) uses the fixture's non-owner viewer. Content URLs
// are resolved from the current stand at runtime (env-agnostic).
let fx: SharedFixture;
test.beforeAll(async () => { fx = await resolveSharedFixture(); });

test.describe('Public video visibility', () => {
    test('Public video visible on channel page', { tag: '@critical', annotation: { type: 'TC', description: 'VIS-001' } }, async ({ page }) => {
        await test.step('Open channel page and verify video is listed', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(fx.channelUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.assertVideoOnChannel(fx.videoUrl);
        });
    });

    test('Anonymous user can view public video via direct link', { tag: '@critical', annotation: { type: 'TC', description: 'VIS-001' } }, async ({ page }) => {
        await test.step('Open video page as anonymous and verify content', async () => {
            const videoPlayer = new VideoPlayerPage(page);
            await page.goto(fx.videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(videoPlayer.videoTitle, 'Video title is not shown').toContainText(FIXTURE_VIDEO_TITLE, { timeout: 10_000 });
            await videoPlayer.assertPlayerVisible();
        });
    });

    test('Authorized user can view public video via direct link', { annotation: { type: 'TC', description: 'VIS-002' } }, async ({ page }) => {
        await test.step('Login as the fixture viewer and verify video is accessible', async () => {
            const authFlow = new AuthFlow(page);
            const videoPlayer = new VideoPlayerPage(page);
            await authFlow.loginSuccess(fx.viewerEmail, fx.password, fx.viewerUsername);

            await page.goto(fx.videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(videoPlayer.videoTitle, 'Video title is not shown').toContainText(FIXTURE_VIDEO_TITLE, { timeout: 10_000 });
            await videoPlayer.assertPlayerVisible();
        });
    });
});

test.describe('Private video visibility', () => {
    test('Private video not shown on channel page', { annotation: { type: 'TC', description: 'VIS-003' } }, async ({ page }) => {
        await test.step('Open channel page and verify the private video is not listed', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(fx.channelUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.assertVideoAbsentOnChannel(fx.privateVideoUrl);
        });
    });

    test('Anonymous user blocked on private video direct link', { annotation: { type: 'TC', description: 'VIS-003' } }, async ({ page }) => {
        await test.step('Open private video page as anonymous and verify access denied', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(fx.privateVideoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.checkPrivateVideoViaDirectLink();
        });
    });

    test('Authorized non-owner blocked on private video direct link', { annotation: { type: 'TC', description: 'VIS-004' } }, async ({ page }) => {
        await test.step('Login as the fixture viewer and verify access denied', async () => {
            const authFlow = new AuthFlow(page);
            const channelMainPage = new ChannelMainPage(page);
            await authFlow.loginSuccess(fx.viewerEmail, fx.password, fx.viewerUsername);

            await page.goto(fx.privateVideoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.checkPrivateVideoViaDirectLink();
        });
    });
});

test.describe('Unlisted video visibility', () => {
    test('Unlisted video not shown on channel page', { annotation: { type: 'TC', description: 'VIS-005' } }, async ({ page }) => {
        await test.step('Open channel page and verify the unlisted video is not listed', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(fx.channelUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.assertVideoAbsentOnChannel(fx.unlistedVideoUrl);
        });
    });

    test('Anonymous user can access unlisted video via direct link', { annotation: { type: 'TC', description: 'VIS-005' } }, async ({ page }) => {
        await test.step('Open unlisted video page as anonymous and verify content', async () => {
            const videoPlayer = new VideoPlayerPage(page);
            await page.goto(fx.unlistedVideoUrl, { waitUntil: 'domcontentloaded' });
            await expect(videoPlayer.videoTitle, 'Unlisted video title is not shown').toContainText(FIXTURE_UNLISTED_TITLE, { timeout: 10_000 });
            await videoPlayer.assertPlayerVisible();
        });
    });

    test('Authorized user can access unlisted video via direct link', { annotation: { type: 'TC', description: 'VIS-006' } }, async ({ page }) => {
        await test.step('Login as the fixture viewer and verify video is accessible', async () => {
            const authFlow = new AuthFlow(page);
            const videoPlayer = new VideoPlayerPage(page);
            await authFlow.loginSuccess(fx.viewerEmail, fx.password, fx.viewerUsername);

            await page.goto(fx.unlistedVideoUrl, { waitUntil: 'domcontentloaded' });
            await expect(videoPlayer.videoTitle, 'Unlisted video title is not shown').toContainText(FIXTURE_UNLISTED_TITLE, { timeout: 10_000 });
            await videoPlayer.assertPlayerVisible();
        });
    });
});

// Paid visibility stays on its own seed (mutating paywall/subscription) — unchanged.
test.describe.skip('Paid video visibility', () => {
    let setup: VideoSetupResult;

    test.beforeAll(async ({ request }) => {
        setup = await setupVideoViaApi(request, { privacySetting: 'paid' });
    });

    test('Paid video shows badges on channel page', { annotation: { type: 'TC', description: 'VIS-007' } }, async ({ page }) => {
        await test.step('Open channel page and verify exclusive/locked badges', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(setup.channelUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.checkPaidVideoAttributes();
        });
    });

    test('Anonymous user sees paywall on paid video', { annotation: { type: 'TC', description: 'VIS-007' } }, async ({ page }) => {
        await test.step('Open video page as anonymous and verify paywall', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.assertPaywallContent(setup.membershipName!, setup.membershipDescription!, '$0.99');
        });
    });
});
