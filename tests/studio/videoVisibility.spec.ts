import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { ChannelMainPage } from '../../src/pages/channel/ChannelMainPage';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { setupVideoViaApi, VideoSetupResult } from '../../src/utils/studioTestHelpers';

test.describe('Public video visibility', () => {
    let setup: VideoSetupResult;

    test.beforeAll(async ({ request }) => {
        setup = await setupVideoViaApi(request, { privacySetting: 'public' });
    });

    test('Public video visible on channel page', { annotation: { type: 'TC', description: 'VIS-001' } }, async ({ page }) => {
        await test.step('Open channel page and verify video is displayed', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(setup.channelUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.checkVideoIsExist(setup.videoName);
        });
    });

    test('Anonymous user can view public video via direct link', { annotation: { type: 'TC', description: 'VIS-001' } }, async ({ page }) => {
        await test.step('Open video page as anonymous and verify content', async () => {
            const videoPlayer = new VideoPlayerPage(page);
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('h1', { hasText: setup.videoName })).toBeVisible({ timeout: 10_000 });
            await expect(page.getByText(setup.description)).toBeVisible({ timeout: 10_000 });
            await videoPlayer.assertPlayerVisible();
        });
    });

    test('Authorized user can view public video via direct link', { annotation: { type: 'TC', description: 'VIS-002' } }, async ({ page, request }) => {
        await test.step('Login as another user and verify video is accessible', async () => {
            const authApi = new AuthApi(request);
            const authFlow = new AuthFlow(page);
            const videoPlayer = new VideoPlayerPage(page);
            const password = process.env.USER_PASSWORD!;

            const user2 = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(user2.email, password, user2.username);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('h1', { hasText: setup.videoName })).toBeVisible({ timeout: 10_000 });
            await expect(page.getByText(setup.description)).toBeVisible({ timeout: 10_000 });
            await videoPlayer.assertPlayerVisible();
        });
    });
});

test.describe('Private video visibility', () => {
    let setup: VideoSetupResult;

    test.beforeAll(async ({ request }) => {
        setup = await setupVideoViaApi(request, { privacySetting: 'private' });
    });

    test('Private video not shown on channel page', { annotation: { type: 'TC', description: 'VIS-003' } }, async ({ page }) => {
        await test.step('Open channel page and verify video is hidden', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(setup.channelUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.checkPrivateVideoOnChannelPage();
        });
    });

    test('Anonymous user blocked on private video direct link', { annotation: { type: 'TC', description: 'VIS-003' } }, async ({ page }) => {
        await test.step('Open video page as anonymous and verify access denied', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.checkPrivateVideoViaDirectLink();
        });
    });

    test('Authorized user blocked on private video direct link', { annotation: { type: 'TC', description: 'VIS-004' } }, async ({ page, request }) => {
        await test.step('Login as another user and verify access denied', async () => {
            const authApi = new AuthApi(request);
            const authFlow = new AuthFlow(page);
            const channelMainPage = new ChannelMainPage(page);
            const password = process.env.USER_PASSWORD!;

            const user2 = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(user2.email, password, user2.username);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.checkPrivateVideoViaDirectLink();
        });
    });
});

test.describe('Unlisted video visibility', () => {
    let setup: VideoSetupResult;

    test.beforeAll(async ({ request }) => {
        setup = await setupVideoViaApi(request, { privacySetting: 'unlisted' });
    });

    test('Unlisted video not shown on channel page', { annotation: { type: 'TC', description: 'VIS-005' } }, async ({ page }) => {
        await test.step('Open channel page and verify video is hidden', async () => {
            const channelMainPage = new ChannelMainPage(page);
            await page.goto(setup.channelUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.checkUnlistedVideoNotAvailable();
        });
    });

    test('Anonymous user can access unlisted video via direct link', { annotation: { type: 'TC', description: 'VIS-005' } }, async ({ page }) => {
        await test.step('Open video page as anonymous and verify content', async () => {
            const videoPlayer = new VideoPlayerPage(page);
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('h1', { hasText: setup.videoName })).toBeVisible({ timeout: 10_000 });
            await expect(page.getByText(setup.description)).toBeVisible({ timeout: 10_000 });
            await videoPlayer.assertPlayerVisible();
        });
    });

    test('Authorized user can access unlisted video via direct link', { annotation: { type: 'TC', description: 'VIS-006' } }, async ({ page, request }) => {
        await test.step('Login as another user and verify video is accessible', async () => {
            const authApi = new AuthApi(request);
            const authFlow = new AuthFlow(page);
            const videoPlayer = new VideoPlayerPage(page);
            const password = process.env.USER_PASSWORD!;

            const user2 = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(user2.email, password, user2.username);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('h1', { hasText: setup.videoName })).toBeVisible({ timeout: 10_000 });
            await expect(page.getByText(setup.description)).toBeVisible({ timeout: 10_000 });
            await videoPlayer.assertPlayerVisible();
        });
    });
});

test.describe('Paid video visibility', () => {
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
            await expect(page.getByRole('heading', { name: setup.membershipName! })).toBeVisible();
            await expect(page.locator('body')).toContainText(setup.membershipDescription!);
            await expect(page.locator('body')).toContainText('$0.991 week');
            await channelMainPage.clickRegisterLoginBtn();
            await expect(page.locator('body')).toContainText('Please log in to your Web3.TV account using one of the login methods below');
        });
    });

    test('Authorized user sees subscribe button on paid video', { annotation: { type: 'TC', description: 'VIS-008' } }, async ({ page, request }) => {
        await test.step('Login as another user and verify subscribe flow', async () => {
            const authApi = new AuthApi(request);
            const authFlow = new AuthFlow(page);
            const channelMainPage = new ChannelMainPage(page);
            const password = process.env.USER_PASSWORD!;

            const user2 = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(user2.email, password, user2.username);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(page.getByRole('heading', { name: setup.membershipName! })).toBeVisible();
            await expect(page.locator('body')).toContainText(setup.membershipDescription!);
            await expect(page.locator('body')).toContainText('$0.991 week');
            await channelMainPage.clickButtonSubscribeNow();
            channelMainPage.clickPayWith()
            await expect(page).toHaveURL(/test\.pay\.hero\.io\/invoice\/currency-list(\?.*)?$/);
        });
    });
});
