import { test, expect, request as playwrightRequest, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { StudioNavigationPage } from '../../../src/pages/studio/StudioNavigationPage';
import { setupVideoViaApi } from '../../../src/utils/studioTestHelpers';

const studioBaseUrl = process.env.STUDIO_URL!;

const studioHeaderMasks = (page: Page) => [
    page.locator('[data-id="aitv-profile-menu-trigger"]'),
    page.locator('[data-id="aitv-studio-channel-trigger-button"]'),
];

const studioDashboardMasks = (page: Page) => [
    ...studioHeaderMasks(page),
    page.locator('[data-id="analytics-data"]'),
    page.locator('[data-id="video-title"]'),
    page.locator('[data-id="video-cover"]'),
];

const studioContentMasks = (page: Page) => [
    ...studioHeaderMasks(page),
    page.locator('[data-id="image"]'),
    page.locator('[data-id="date"]'),
    page.locator('[data-testid="video-row"] .title'),
    page.locator('[data-testid="video-row"] .description'),
];

test.describe('Studio visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;

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

        await requestContext.dispose();
    });

    // ── SideBar ──

    test('Studio SideBar menu for logged in user', {
        annotation: { type: 'TC', description: 'VIS-STD-001' },
    }, async ({ page }) => {
        await test.step('Login and navigate to dashboard', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.goto(`${studioBaseUrl}/dashboard`);
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Take sidebar screenshot', async () => {
            const nav = new StudioNavigationPage(page);
            await nav.assertVisible();
            await expect(nav.nav).toHaveScreenshot('studio-sidebar.webp', { maxDiffPixelRatio: 0.02 });
        });
    });

    // ── Header ──

    test('Studio Header panel for logged in user', {
        annotation: { type: 'TC', description: 'VIS-STD-002' },
    }, async ({ page }) => {
        await test.step('Login and navigate to dashboard', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.goto(`${studioBaseUrl}/dashboard`);
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Take header screenshot', async () => {
            const headerPage = new HeaderPage(page);
            await expect(headerPage.header, 'Header is not visible').toBeVisible();
            await expect(headerPage.header).toHaveScreenshot('studio-header.webp', {
                mask: studioHeaderMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    // ── Studio pages ──

    test('Studio Dashboard for logged in user', {
        annotation: { type: 'TC', description: 'VIS-STD-003' },
    }, async ({ page }) => {
        await test.step('Login and navigate to dashboard', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.goto(`${studioBaseUrl}/dashboard`);
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Take dashboard screenshot', async () => {
            const headerPage = new HeaderPage(page);
            await expect(headerPage.header, 'Header is not visible').toBeVisible();
            await expect(page).toHaveScreenshot('studio-dashboard.webp', {
                mask: studioDashboardMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    test('Studio Content page for logged in user', {
        annotation: { type: 'TC', description: 'VIS-STD-004' },
    }, async ({ page }) => {
        await test.step('Login and navigate to content page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.goto(`${studioBaseUrl}/content`);
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Take content page screenshot', async () => {
            const headerPage = new HeaderPage(page);
            await expect(headerPage.header, 'Header is not visible').toBeVisible();
            await expect(page).toHaveScreenshot('studio-content.webp', {
                mask: studioContentMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

});
