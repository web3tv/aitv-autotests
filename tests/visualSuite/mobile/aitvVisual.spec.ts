import { test, expect, request as playwrightRequest, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AuthApi } from '../../../src/api/AuthApi';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { LoginPopupPage } from '../../../src/pages/testPopups/LoginPopupPage';

const mainPageMasks = (page: Page) => [
    page.locator('[data-id="aitv-hero"] .MuiTypography-root'),
];

const mainPageLoggedInMasks = (page: Page) => [
    ...mainPageMasks(page),
    new HeaderPage(page).userIcon,
];

test.describe('AITV mobile visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;

    test.beforeAll(async () => {
        const requestContext = await playwrightRequest.newContext();
        password = process.env.USER_PASSWORD!;

        const authApi = new AuthApi(requestContext);
        const user = await authApi.createUserFast();
        userEmail = user.email;
        username = user.username;

        await requestContext.dispose();
    });

    // ── Main Page ──

    test('Main page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-001' },
    }, async ({ page }) => {
        await test.step('Open main page', async () => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(page.getByText('Top titles today')).toBeVisible();
        });

        await test.step('Hide dynamic images via CSS', async () => {
            await page.addStyleTag({
                content: `
                    [data-id="aitv-hero"] img,
                    [data-id="aitv-hero"] video,
                    [data-id="aitv-top-card"] img,
                    [data-id="aitv-video-card"] img { visibility: hidden !important; }
                `,
            });
        });

        await test.step('Take screenshot', async () => {
            await expect(page).toHaveScreenshot('main-page-anon.png', {
                fullPage: true,
                mask: mainPageMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    test('Main page for logged in user', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-002' },
    }, async ({ page }) => {
        await test.step('Login and navigate to main page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username, 'mobile');
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(page.getByText('Top titles today')).toBeVisible();
        });

        await test.step('Hide dynamic images via CSS', async () => {
            await page.addStyleTag({
                content: `
                    [data-id="aitv-hero"] img,
                    [data-id="aitv-hero"] video,
                    [data-id="aitv-top-card"] img,
                    [data-id="aitv-video-card"] img { visibility: hidden !important; }
                `,
            });
        });

        await test.step('Take screenshot', async () => {
            await expect(page).toHaveScreenshot('main-page-logged-in.png', {
                fullPage: true,
                mask: mainPageLoggedInMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    // ── Header ──

    test('Header for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-003' },
    }, async ({ page }) => {
        await test.step('Open main page', async () => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Hide hero background', async () => {
            await page.addStyleTag({
                content: `
                    [data-id="aitv-hero"] img,
                    [data-id="aitv-hero"] video { visibility: hidden !important; }
                `,
            });
        });

        await test.step('Take header screenshot', async () => {
            await expect(page.locator('[data-id="aitv-header"]')).toBeVisible();
            await expect(page.locator('[data-id="aitv-header"]')).toHaveScreenshot('header-anon.png', { maxDiffPixelRatio: 0.02 });
        });
    });

    test('Header for logged in user', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-004' },
    }, async ({ page }) => {
        await test.step('Login and navigate to main page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username, 'mobile');
            await page.waitForLoadState('networkidle');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Hide hero background', async () => {
            await page.addStyleTag({
                content: `
                    [data-id="aitv-hero"] img,
                    [data-id="aitv-hero"] video { visibility: hidden !important; }
                `,
            });
        });

        await test.step('Take header screenshot', async () => {
            await expect(page.locator('[data-id="aitv-header"]')).toBeVisible();
            await expect(page.locator('[data-id="aitv-header"]')).toHaveScreenshot('header-logged-in.png', {
                mask: [new HeaderPage(page).userIcon],
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    // ── Auth modal ──

    test('Auth modal on Get Started click', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-005' },
    }, async ({ page }) => {
        const headerPage = new HeaderPage(page);
        const loginPopupPage = new LoginPopupPage(page);

        await test.step('Open main page and click Get Started', async () => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await headerPage.clickGetStarted();
        });

        await test.step('Wait for auth modal and take screenshot', async () => {
            await loginPopupPage.assertPopupVisible();
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(page.getByRole('dialog')).toHaveScreenshot('auth-modal.png', { maxDiffPixelRatio: 0.02 });
        });
    });

});
