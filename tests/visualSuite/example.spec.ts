import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';



test('SideBar menu for anonymous user', async ({ page }) => {
    await page.goto('/@tttttttt');
    await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible({timeout:10_000});
    await expect(page.locator('.sidebarNav')).toHaveScreenshot();
});

test('SideBar menu for authorized user', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    const login = process.env.USER_LOGIN_PUBLIC!;
    const password = process.env.USER_PASSWORD!;
    await authFlow.loginSuccess(login, password);
    await expect(page.locator('.sidebarNav')).toHaveScreenshot();
});


test('Channel page for anonymous user', async ({ page }) => {
    await page.goto('/@tttttttt');
    await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible({timeout:10_000});
    await expect(page).toHaveScreenshot({
        fullPage: false,
        mask: [
            page.locator('[data-id="video"]'),
            page.locator('[data-id="avatar"]')
        ],});
});






