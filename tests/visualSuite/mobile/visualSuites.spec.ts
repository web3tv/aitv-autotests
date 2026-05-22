import { test, expect, request as playwrightRequest } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { VideoApi } from '../../../src/api/VideoApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';

test.describe('Mobile visual tests', () => {

    let userEmail: string;
    let password: string;
    let username: string;
    let videoUrl: string;
    let channelUrl: string;

    test.beforeAll(async () => {
        const requestContext = await playwrightRequest.newContext();
        const authApi = new AuthApi(requestContext);
        const videoApi = new VideoApi(requestContext);
        password = process.env.USER_PASSWORD!;
        const baseUrl = process.env.BASE_URL!;

        const user = await authApi.createAndVerifyUser();
        userEmail = user.email;
        username = user.username;

        const token = await authApi.getUserToken(user.email, password);

        const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            title: `Visual_${Date.now()}`,
            description: 'Visual test video',
            privacySetting: 'public',
            waitForProcessing: true,
        });
        videoUrl = video.videoPlayerFeUrl;
        channelUrl = `${baseUrl}/@${user.username}`;

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
            mask: [
                page.locator('[data-id="recommended-videos"]'),
                page.locator('[aria-label="Video Player"]'),
                // page.locator('[data-id="name"]'),
                // page.locator('[data-id="avatar"]'),
                // page.locator('[data-id="subscribers"]'),
                // page.locator('[data-id="count"]'),
                // page.locator('h1'),
                // page.getByText(/^@/)
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Video page for logged in user', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username, 'mobile');

        await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('button', { name: 'Share' })).toBeVisible({ timeout: 10_000 });
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot({
            mask: [
                page.locator('[data-id="recommended-videos"]'),
                page.locator('[aria-label="Video Player"]'),
                // page.locator('[data-id="name"]'),
                // page.locator('[data-id="avatar"]'),
                // page.locator('[data-id="subscribers"]'),
                // page.locator('[data-id="count"]'),
                // page.locator('h1'),
                // page.getByText(/^@/)
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
        await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible();
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot({
            fullPage: false,
            mask: [
                page.locator('[data-id="video"]'),
                page.locator('[data-id="avatar"]'),
                page.locator('[data-id="count"]'),
                page.locator('[data-id="subscribers"]'),
                // page.locator('[data-id="name"]'),
                // page.getByText(/^@/)
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    test('Channel page for logged in user', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username, 'mobile');

        await page.goto(channelUrl);
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible({timeout:10_000});
        await expect(page.getByRole('button', { name: 'Edit channel' })).toBeVisible();
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot({
            fullPage: false,
            mask: [
                page.locator('[data-id="video"]'),
                page.locator('[data-id="avatar"]'),
                page.locator('[data-id="count"]'),
                page.locator('[data-id="subscribers"]'),
                // page.locator('[data-id="name"]'),
                // page.getByText(/^@/)
            ],
            maxDiffPixelRatio: 0.02
        });
    });

    // ── Mobile navigation buttons ──

    test('Mobile navigation buttonse for anonymous user', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.getByRole('heading', { name: 'Recommended for You' })).toBeVisible({timeout:10_000});
        await expect(page.getByText('HomeShortsYou')).toBeVisible({timeout:10_000});
        await expect(page.getByText('HomeShortsYou')).toHaveScreenshot({maxDiffPixelRatio: 0.02});
    });

    test('Mobile navigation buttons for logged in user', async ({ page }) => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, password, username, 'mobile');

        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        await expect(page.getByRole('heading', { name: 'Recommended for You' })).toBeVisible({timeout:10_000});
        await expect(page.getByText('HomeShortsYou')).toBeVisible({timeout:10_000});
        await expect(page.getByText('HomeShortsYou')).toHaveScreenshot({maxDiffPixelRatio: 0.02});
    });

})
