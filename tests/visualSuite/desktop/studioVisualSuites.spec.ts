import { test, expect, request as playwrightRequest } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { VideoApi } from '../../../src/api/VideoApi';
import { LoginPage } from '../../../src/pages/auth/LoginPage';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';

const mainBaseUrl = process.env.BASE_URL || 'https://web3tv.dev';

async function loginOnMainDomain(page: import('@playwright/test').Page, email: string, password: string) {
    const loginPage = new LoginPage(page);

    // await page.goto(`${mainBaseUrl}/login`);
    // await page.waitForLoadState('networkidle');
    await loginPage.fillEmailInput(email);
    await loginPage.fillPasswordInput(password);
    await loginPage.clickLoginBtn();
    await page.waitForURL(`${mainBaseUrl}/`);
    await page.waitForResponse(resp => resp.url().includes('/api/users/whoami') && resp.status() === 200, { timeout: 40_000 });
}

test.describe('Studio visual tests', () => {

    let userEmail: string;
    let password: string;

    test.beforeAll(async () => {
        const requestContext = await playwrightRequest.newContext();
        const authApi = new AuthApi(requestContext);
        const videoApi = new VideoApi(requestContext);
        password = process.env.USER_PASSWORD!;

        const user = await authApi.createUserFast();
        userEmail = user.email;

        const token = await authApi.getUserToken(user.email, password);

        await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            title: `Visual_${Date.now()}`,
            description: 'Visual test video',
            privacySetting: 'public',
            waitForProcessing: true,
        });

        await requestContext.dispose();
    });

    // ── SideBar ──

    test('Studio SideBar menu for logged in user', async ({ page }) => {
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.sidebarNav')).toBeVisible();
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.locator('.sidebarNav')).toHaveScreenshot({ maxDiffPixelRatio: 0.02 });
    });

    // ── Header ──

    test('Studio Header panel for logged in user', async ({ page }) => {
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.locator('[data-id="header"]')).toHaveScreenshot({
            mask: [
                page.locator('#profile-button')
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    // ── Studio pages ──

    test('Studio Dashboard for logged in user', async ({ page }) => {
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page).toHaveScreenshot({
            mask: [
                page.locator('#profile-button'),
                page.locator('[data-id="analytics-data"]'),
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Studio Content page(videos) for logged in user', async ({ page }) => {
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/content');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page).toHaveScreenshot({
            mask: [
                page.locator('#profile-button'),
                page.locator('[data-testid="video-row"]'),
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Studio Content page(shorts) for logged in user', async ({ page }) => {
        const studioContent = new StudioContentPage(page);
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/content');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(studioContent.shortsTab, 'Shorts tab is not visible').toBeVisible();
        await expect(studioContent.shortsTab, 'Shorts tab is not enabled').toBeEnabled();
        await studioContent.clickShortsTab();
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page).toHaveScreenshot({
            mask: [
                page.locator('#profile-button'),
                page.locator('[data-testid="video-row"]'),
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Studio Settings page for logged in user', async ({ page }) => {
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page).toHaveScreenshot({
            mask: [
                page.locator('#profile-button'),
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Studio Edit Channel page for logged in user', async ({ page }) => {
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/channel');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page).toHaveScreenshot({
            mask: [
                page.locator('#profile-button'),
                page.locator('[data-id="avatar"]'),
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Studio Playlists page for logged in user', async ({ page }) => {
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/playlists');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page).toHaveScreenshot({
            mask: [
                page.locator('#profile-button'),
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Studio Membership page for logged in user', async ({ page }) => {
        await loginOnMainDomain(page, userEmail, password);
        await page.goto('/membership');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; });
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page).toHaveScreenshot({
            mask: [
                page.locator('#profile-button'),
            ],
            maxDiffPixelRatio: 0.02
        });
    });
});
