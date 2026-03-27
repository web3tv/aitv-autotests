import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../src/pages/auth/LoginPage';

const mainBaseUrl = process.env.BASE_URL || 'https://web3tv.dev';

/** Login on main domain, then session cookie is shared across subdomains */
async function loginOnMainDomain(page: import('@playwright/test').Page) {
    const login = process.env.USER_LOGIN_PUBLIC!;
    const password = process.env.USER_PASSWORD!;
    const loginPage = new LoginPage(page);

    await page.goto(`${mainBaseUrl}/login`);
    await page.waitForLoadState('networkidle');
    await loginPage.fillEmailInput(login);
    await loginPage.fillPasswordInput(password);
    await loginPage.clickLoginBtn();
    await page.waitForURL(`${mainBaseUrl}/`);
    await page.waitForResponse(resp => resp.url().includes('/api/users/whoami') && resp.status() === 200, { timeout: 40_000 });
}

test.describe('Studio SideBar visual tests', () => {

    test.use({
        viewport: { width: 2560, height: 2000 },
    });

    test('Studio SideBar menu for logged in user', async ({ page }) => {
        await test.step('Login on main domain', async () => {
            await loginOnMainDomain(page);
        });

        await test.step('Navigate to studio dashboard and verify sidebar screenshot', async () => {
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');
            await expect(page.locator('.sidebarNav')).toBeVisible();
            await page.evaluate(async () => {
                await document.fonts.ready;
            });
            await expect(page.locator('.sidebarNav')).toHaveScreenshot({ maxDiffPixelRatio: 0.02 });
        });
    });
});

test.describe('Studio Header visual tests', () => {

    test('Studio Header panel for logged in user', async ({ page }) => {
        await test.step('Login on main domain', async () => {
            await loginOnMainDomain(page);
        });

        await test.step('Navigate to studio dashboard and verify header screenshot', async () => {
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
    });
});
