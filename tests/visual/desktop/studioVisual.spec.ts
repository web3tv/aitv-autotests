import { test, expect, Page } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { HeaderPage } from '../../../src/pages/components/HeaderPage';
import { StudioNavigationPage } from '../../../src/pages/studio/StudioNavigationPage';
import { StudioAnalyticsPage } from '../../../src/pages/studio/StudioAnalyticsPage';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { resolveSharedFixture } from '../../fixtures/sharedFixture';

const studioBaseUrl = process.env.STUDIO_URL!;

const studioHeaderMasks = (page: Page) => {
    const header = new HeaderPage(page);
    return [
        header.userIcon,
        header.channelTriggerBtn,
    ];
};

// Intentional LAYOUT check: the dashboard/content screenshots mask the dynamic
// analytics values, latest-video title/cover and per-row image/title/date/description.
// Page structure, labels, tabs, search and controls are still verified — the changing
// data values are not, and that is by design.
const studioDashboardMasks = (page: Page) => {
    const analytics = new StudioAnalyticsPage(page);
    return [
        ...studioHeaderMasks(page),
        analytics.dashboardAnalyticsData,
        analytics.dashboardVideoTitle,
        analytics.dashboardVideoCover,
    ];
};

const studioContentMasks = (page: Page) => {
    const content = new StudioContentPage(page);
    return [
        ...studioHeaderMasks(page),
        content.videoRowImages,
        content.videoRowDates,
        content.videoRowTitles,
        content.videoRowDescriptions,
    ];
};

test.describe('Studio visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;

    test.beforeAll(async () => {
        // Studio views need an owner with ≥1 video — reuse the shared visual fixture
        // owner (its content is masked below anyway) instead of seeding a fresh one.
        const fx = await resolveSharedFixture();
        userEmail = fx.ownerEmail;
        username = fx.ownerUsername;
        password = fx.password;
    });

    // ── SideBar ──

    test('Studio SideBar menu for logged in user', {
        annotation: { type: 'TC', description: 'VIS-STD-001' },
    }, async ({ page }) => {
        await test.step('Login and navigate to dashboard', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(userEmail, password, username);
            await page.goto(`${studioBaseUrl}/dashboard`);
            await page.waitForLoadState('domcontentloaded');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Take sidebar screenshot', async () => {
            const nav = new StudioNavigationPage(page);
            await nav.assertVisible();
            await expect(nav.nav).toHaveScreenshot('studio-sidebar.png', { maxDiffPixelRatio: 0.02 });
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
            await page.waitForLoadState('domcontentloaded');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Take header screenshot', async () => {
            const headerPage = new HeaderPage(page);
            await expect(headerPage.header, 'Header is not visible').toBeVisible();
            await expect(headerPage.header).toHaveScreenshot('studio-header.png', {
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
            await page.waitForLoadState('domcontentloaded');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Take dashboard screenshot', async () => {
            const headerPage = new HeaderPage(page);
            await expect(headerPage.header, 'Header is not visible').toBeVisible();
            await expect(page).toHaveScreenshot('studio-dashboard.png', {
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
            await page.waitForLoadState('domcontentloaded');
            await page.evaluate(async () => { await document.fonts.ready; });
        });

        await test.step('Take content page screenshot', async () => {
            const headerPage = new HeaderPage(page);
            await expect(headerPage.header, 'Header is not visible').toBeVisible();
            await expect(page).toHaveScreenshot('studio-content.png', {
                mask: studioContentMasks(page),
                maxDiffPixelRatio: 0.02,
            });
        });
    });

});
