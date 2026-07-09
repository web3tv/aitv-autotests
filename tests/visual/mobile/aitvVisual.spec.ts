import { test, expect, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { MainPage } from '../../../src/pages/components/MainPage';
import { LoginPopupPage } from '../../../src/pages/testPopups/LoginPopupPage';
import { resolveSharedFixture } from '../../fixtures/sharedFixture';

const mainPageMasks = (page: Page) => [
    new MainPage(page).hero,
];

const mainPageLoggedInMasks = (page: Page) => [
    ...mainPageMasks(page),
    new HeaderPage(page).userIcon,
];

/**
 * Settle the mobile header before a screenshot. `toHaveScreenshot` runs its
 * "wait for element to be stable" check BEFORE the animation-freeze CSS is applied,
 * so the home page's auto-rotating hero swiper + autoplaying video keep the header's
 * bounding box moving and, on mobile webkit, it can fail to converge within the 10s
 * timeout (flaky). Pausing the hero videos and resetting scroll removes the motion
 * source (without changing layout — the hero media stays visibility:hidden), and a
 * short settle mirrors the pattern used by the other stable mobile visual tests.
 */
async function settleMobileHeader(page: Page, headerPage: HeaderPage): Promise<void> {
    await page.evaluate(() => {
        document
            .querySelectorAll('[data-id="aitv-hero"] video')
            .forEach((v) => (v as HTMLVideoElement).pause());
        window.scrollTo(0, 0);
    });
    // On the live stand mobile webkit can render the header well past the default
    // 10s (the hero video loads first and the page stays black) — wait longer.
    await expect(headerPage.mobileHeader, 'Mobile header is not visible')
        .toBeVisible({ timeout: 30000 });
    await expect(headerPage.mobileDropdownTrigger, 'Mobile header dropdown trigger is not visible')
        .toBeVisible({ timeout: 30000 });
    // Visual settle: let the mobile layout/animations finish before the screenshot.
    await page.waitForTimeout(1000);
}

test.describe('AITV mobile visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;

    test.beforeAll(async () => {
        // Logged-in views only need any real account — reuse the shared visual
        // fixture owner instead of registering a fresh user each run.
        const fx = await resolveSharedFixture();
        userEmail = fx.ownerEmail;
        username = fx.ownerUsername;
        password = fx.password;
    });

    // ── Header ──

    test('Header for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-003' },
    }, async ({ page }) => {
        const headerPage = new HeaderPage(page);

        await test.step('Open main page', async () => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
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
            await settleMobileHeader(page, headerPage);
            await expect(headerPage.mobileHeader).toHaveScreenshot('header-anon.png', { maxDiffPixelRatio: 0.02 });
        });
    });

    test('Header for logged in user', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-004' },
    }, async ({ page }) => {
        const headerPage = new HeaderPage(page);

        await test.step('Login and navigate to main page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username, true);
            await page.waitForLoadState('domcontentloaded');
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
            await settleMobileHeader(page, headerPage);
            await expect(headerPage.mobileHeader).toHaveScreenshot('header-logged-in.png', {
                mask: [headerPage.userIcon],
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    test('Header navigation dropdown', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-005' },
    }, async ({ page }) => {
        const headerPage = new HeaderPage(page);

        await test.step('Open main page', async () => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Hide dynamic content', async () => {
            await page.addStyleTag({
                content: `
                    [data-id="aitv-hero"] img,
                    [data-id="aitv-hero"] video,
                    [data-id="aitv-top-card"] img,
                    [data-id="aitv-video-card"] img { visibility: hidden !important; }
                `,
            });
        });

        await test.step('Click dropdown trigger and take screenshot', async () => {
            await expect(headerPage.mobileDropdownTrigger, 'Dropdown trigger is not visible').toBeVisible();
            await headerPage.mobileDropdownTrigger.click();
            await expect(headerPage.mobileDropdownMenu, 'Dropdown menu is not visible').toBeVisible();
            await expect(page).toHaveScreenshot('header-dropdown-open.png', {
                mask: mainPageMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    // ── Auth modal ──

    test('Auth modal on Get Started click', {
        annotation: { type: 'TC', description: 'VIS-AITV-MOB-006' },
    }, async ({ page }) => {
        const headerPage = new HeaderPage(page);
        const loginPopupPage = new LoginPopupPage(page);

        await test.step('Open main page and click Get Started', async () => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
            await headerPage.clickGetStarted();
        });

        await test.step('Wait for auth modal and take screenshot', async () => {
            await loginPopupPage.assertPopupVisible();
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(loginPopupPage.dialog).toHaveScreenshot('auth-modal.png', { maxDiffPixelRatio: 0.02 });
        });
    });

});
