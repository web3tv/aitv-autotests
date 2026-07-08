import { test, expect, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { MainPage } from '../../../src/pages/components/MainPage';
import { LoginPopupPage } from '../../../src/pages/testPopups/LoginPopupPage';
import { resolveSharedFixture } from '../../fixtures/sharedFixture';

// Intentional LAYOUT check: the home page hero + card imagery are SSR-driven and
// non-deterministic, so the hero is masked and all images are CSS-hidden (see the
// "Hide dynamic images" steps). Because `visibility:hidden` preserves layout, this
// screenshot still verifies the full-page structure, typography and spacing — it does
// NOT verify imagery, and that is by design.
const mainPageMasks = (page: Page) => [
    new MainPage(page).hero,
];

const mainPageLoggedInMasks = (page: Page) => [
    ...mainPageMasks(page),
    new HeaderPage(page).userIcon,
];

const videoCardHoverMasks = (page: Page) => {
    const mainPage = new MainPage(page);
    return [
        mainPage.hero,
        mainPage.topCardImage,
        mainPage.videoCardImage,
    ];
};

test.describe('AITV visual tests', () => {

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

    // ── Main Page ──

    test('Main page for anonymous user', {
        annotation: { type: 'TC', description: 'VIS-AITV-001' },
    }, async ({ page }) => {
        const mainPage = new MainPage(page);

        await test.step('Open main page', async () => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(mainPage.topTitlesTodayHeading).toBeVisible();
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
        annotation: { type: 'TC', description: 'VIS-AITV-002' },
    }, async ({ page }) => {
        const mainPage = new MainPage(page);

        await test.step('Login and navigate to main page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.waitForLoadState('domcontentloaded');
            await page.evaluate(async () => { await document.fonts.ready; });
            await expect(mainPage.topTitlesTodayHeading).toBeVisible();
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
        annotation: { type: 'TC', description: 'VIS-AITV-003' },
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
            await expect(headerPage.header).toBeVisible();
            await expect(headerPage.header).toHaveScreenshot('header-anon.png', { maxDiffPixelRatio: 0.02 });
        });
    });

    test('Header for logged in user', {
        annotation: { type: 'TC', description: 'VIS-AITV-004' },
    }, async ({ page }) => {
        const headerPage = new HeaderPage(page);

        await test.step('Login and navigate to main page', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
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
            await expect(headerPage.header).toBeVisible();
            await expect(headerPage.header).toHaveScreenshot('header-logged-in.png', {
                mask: [headerPage.userIcon],
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    // ── Auth modal ──

    test('Auth modal on Get Started click', {
        annotation: { type: 'TC', description: 'VIS-AITV-005' },
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

    // ── Video card hover preview ──

    test('Video card hover preview on main page', {
        annotation: { type: 'TC', description: 'VIS-AITV-006' },
    }, async ({ page }) => {
        const mainPage = new MainPage(page);

        await test.step('Open main page and wait for video cards', async () => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Scroll to first category section', async () => {
            await expect(mainPage.categorySection.first(), 'First category section is not visible').toBeVisible();
            await mainPage.categorySection.first().scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
        });

        await test.step('Hover on first video card in category section and take screenshot', async () => {
            const card = mainPage.categorySection.first().locator('[data-id="aitv-video-card"]').first();
            await expect(card, 'First video card in category section is not visible').toBeVisible();
            await card.hover();
            await page.waitForTimeout(600);
            await page.addStyleTag({
                content: `
                    .MuiAvatar-root,
                    .MuiTypography-body1,
                    .MuiTypography-body1 ~ div { visibility: hidden !important; }
                `,
            });
            await expect(page).toHaveScreenshot('main-page-video-card-hover.png', {
                mask: videoCardHoverMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

});
