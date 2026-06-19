import { test, expect, request as playwrightRequest } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { setupVideoViaApi } from '../../../src/utils/studioTestHelpers';

test.describe('Main domain visual tests', () => {

    test.use({ viewport: { width: 2560, height: 2000 } });

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
        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('button', { name: 'Share' })).toBeVisible({ timeout: 10_000 });
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot({
            fullPage: true,
            mask: [
                page.locator('[data-id="recommended-videos"]'),
                page.locator('[aria-label="Video Player"]')
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Video page for logged in user', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username);

        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('button', { name: 'Share' })).toBeVisible({ timeout: 10_000 });
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot({
            fullPage: true,
            mask: [
                page.locator('[data-id="recommended-videos"]'),
                page.locator('[aria-label="Video Player"]')
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    // ── Channel page ──

    test('Channel page for anonymous user', async ({ page }) => {
        await page.goto(channelUrl);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible({timeout:10_000});
        await expect(page).toHaveScreenshot({
            fullPage: false,
            mask: [
                page.locator('[data-id="video"]'),
                page.locator('[data-id="avatar"]'),
                page.locator('[data-id="count"]'),
                page.locator('[data-id="subscribers"]')
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Channel page for logged in user', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username);

        await page.goto(channelUrl);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible({timeout:10_000});
        await expect(page).toHaveScreenshot({
            fullPage: false,
            mask: [
                page.locator('[data-id="video"]'),
                page.locator('[data-id="avatar"]'),
                page.locator('[data-id="count"]'),
                page.locator('[data-id="subscribers"]')
            ],
            maxDiffPixelRatio: 0.02
        });
    });

})
