import { test, expect, request as playwrightRequest, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { setupVideoViaApi } from '../../../src/utils/studioTestHelpers';

const videoPageMasks = (page: Page) => [
    page.locator('[data-id="recommended-videos"]'),
    page.locator('[aria-label="Video Player"]'),
    page.locator('h1'),
    page.locator('h2'),
    page.locator('.MuiAvatar-circular'),
    page.locator('[data-id="video-views-count"]'),
    page.locator('[data-id="video-views-count"] + p'),
];

const channelPageMasks = (page: Page) => [
    page.locator('[data-id="video"]'),
    page.locator('[data-id="avatar"]'),
    page.locator('[data-id="count"]'),
    page.locator('[data-id="subscribers"]'),
    page.locator('[data-id="name"]'),
    page.locator('[data-id="handle"]'),
];

test.describe('Mobile video & channel visual tests', () => {

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

    test('Video page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-MOB-001' },
    }, async ({ page }) => {
        await test.step('Open video page', async () => {
            await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
            await expect(page.getByRole('button', { name: 'Share' })).toBeVisible({ timeout: 10_000 });
            await page.evaluate(async () => { await document.fonts.ready; });
            await page.waitForTimeout(1000);
        });

        await test.step('Take screenshot', async () => {
            await expect(page).toHaveScreenshot('video-page-anon.png', {
                mask: videoPageMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    test('Video page for logged in user', {
        annotation: { type: 'TC', description: 'VIS-MOB-002' },
    }, async ({ page }) => {
        await test.step('Login and open video page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
            await expect(page.getByRole('button', { name: 'Share' })).toBeVisible({ timeout: 10_000 });
            await page.evaluate(async () => { await document.fonts.ready; });
            await page.waitForTimeout(1000);
        });

        await test.step('Take screenshot', async () => {
            await expect(page).toHaveScreenshot('video-page-logged-in.png', {
                mask: videoPageMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    // ── Channel page ──

    test('Channel page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-MOB-003' },
    }, async ({ page }) => {
        await test.step('Open channel page', async () => {
            await page.goto(channelUrl);
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible({ timeout: 10_000 });
            await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible();
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
        await test.step('Login and open channel page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.goto(channelUrl);
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible({ timeout: 10_000 });
            await expect(page.getByRole('button', { name: 'Edit channel' })).toBeVisible();
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

    // ── Mobile navigation ──

    test('Mobile navigation buttons for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-MOB-005' },
    }, async ({ page }) => {
        await test.step('Open main page', async () => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(page.getByRole('heading', { name: 'Recommended for You' })).toBeVisible({ timeout: 10_000 });
        });

        await test.step('Take navigation screenshot', async () => {
            const nav = page.getByText('HomeShortsYou');
            await expect(nav).toBeVisible({ timeout: 10_000 });
            await expect(nav).toHaveScreenshot('mobile-nav-anon.png', { maxDiffPixelRatio: 0.02 });
        });
    });

    test('Mobile navigation buttons for logged in user', {
        annotation: { type: 'TC', description: 'VIS-MOB-006' },
    }, async ({ page }) => {
        await test.step('Login and navigate to main page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(page.getByRole('heading', { name: 'Recommended for You' })).toBeVisible({ timeout: 10_000 });
        });

        await test.step('Take navigation screenshot', async () => {
            const nav = page.getByText('HomeShortsYou');
            await expect(nav).toBeVisible({ timeout: 10_000 });
            await expect(nav).toHaveScreenshot('mobile-nav-logged-in.png', { maxDiffPixelRatio: 0.02 });
        });
    });

});
