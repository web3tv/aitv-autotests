import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';



test.describe('SideBar menu visual tests', () => {

    test.use({
        viewport: { width: 2560, height: 2000 },
    });

    test('SideBar menu for anonymous user', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.getByRole('heading', { name: 'Recommended for You' })).toBeVisible();
        await expect(page.locator('.sidebarNav')).toHaveScreenshot({maxDiffPixelRatio: 0.02});
    });

    test('SideBar menu for logged in user', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const login = process.env.USER_LOGIN_PUBLIC!;
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(login, password, login);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.locator('.sidebarNav')).toHaveScreenshot({maxDiffPixelRatio: 0.02});
    });
})

test.describe('Header panel visual tests', () => {


    test('Header panel for anonymous user', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.getByRole('heading', { name: 'Recommended for You' })).toBeVisible();
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
        await expect(page.locator('[data-id="header"]')).toHaveScreenshot({maxDiffPixelRatio: 0.02});
    });

    test('Header panel for logged in user', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const login = process.env.USER_LOGIN_PUBLIC!;
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(login, password, login);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.locator('[data-id="header"]')).toBeVisible();
        await expect(page.locator('[data-id="header"]')).toHaveScreenshot({
            mask: [
                page.locator('[id="profile-button"]')
            ],
            maxDiffPixelRatio: 0.02
        });
       
    });
})

test.describe('Video page visual tests', () => {
    const videoUrl = process.env.VIDEO_FREE_URL!;

    test('Video page for anonymous user', async ({ page }) => {
        await page.goto(videoUrl);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.getByRole('link', { name: 'user_with_public_videos Channel 0 Subscribers' })).toBeVisible();
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
        const login = process.env.USER_LOGIN_PUBLIC!;
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(login, password, login);

        await page.goto(videoUrl);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.getByRole('link', { name: 'user_with_public_videos Channel 0 Subscribers' })).toBeVisible();
        await expect(page).toHaveScreenshot({
            fullPage: true,
            mask: [
                page.locator('[data-id="recommended-videos"]'),
                page.locator('[aria-label="Video Player"]')
            ],
            maxDiffPixelRatio: 0.02
        });
       
    });
})

test.describe('Channel page visual tests', () => {
    const channelUrl = process.env.USER_CHANNEL_PUBLIC_URL!;

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
        const login = process.env.USER_LOGIN_PUBLIC!;
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(login, password, login);
        
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

    test('Channel page for anonymous user - collapse sidebar', async ({ page }) => {
        await page.goto(channelUrl);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible({timeout:10_000});
        await page.getByTestId('menu-btn').click();
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
