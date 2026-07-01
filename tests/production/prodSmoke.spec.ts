import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { RegistrationFlow } from '../../src/flows/RegistrationFlow';
import { ContentCreationFlow } from '../../src/flows/ContentCreationFlow';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { uploadWithChunkCheck } from '../../src/utils/studioTestHelpers';

test.describe('Auth', () => {

    test('Success login as user', { annotation: { type: 'TC', description: 'PROD-001' } }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const email = process.env.PROD_TEST_EMAIL;
        const password = process.env.PROD_TEST_PASSWORD;
        const username = process.env.PROD_TEST_USERNAME;
        if (!email || !password || !username) throw new Error('PROD_TEST_* env vars not set. Run setup.spec.ts first.');

        await test.step('Login with pre-created prod user', async () => {
            await authFlow.loginSuccess(email, password, username);
        });
    });

    test('Register user via email', { annotation: { type: 'TC', description: 'PROD-002' } }, async ({ page, request }) => {
        const authFlow = new AuthFlow(page);
        const registrationFlow = new RegistrationFlow(page, request);
        let username: string;

        await test.step('Register new user via popup', async () => {
            ({ username } = await registrationFlow.registerAndVerifyUserViaPopup());
        });

        await test.step('Verify user is logged in after registration', async () => {
            await authFlow.assertLoggedInAs(username);
        });
    });

    test('Register user via wallet', { annotation: { type: 'TC', description: 'PROD-003' } }, async ({ page }) => {
        const authFlow = new AuthFlow(page);

        await test.step('Register with a new wallet', async () => {
            await authFlow.walletRegisterSuccess();
        });
    });

});

test.describe('Video upload', () => {

    test('Upload private video', { annotation: { type: 'TC', description: 'PROD-004' } }, async ({ page }) => {
        test.setTimeout(180_000);
        const authFlow = new AuthFlow(page);
        const flow = new ContentCreationFlow(page);
        const email = process.env.PROD_TEST_EMAIL;
        const password = process.env.PROD_TEST_PASSWORD;
        const username = process.env.PROD_TEST_USERNAME;
        if (!email || !password || !username) throw new Error('PROD_TEST_* env vars not set. Run setup.spec.ts first.');
        const videoName = `prod-smoke-${Date.now()}`;

        await test.step('Login with pre-created prod user', async () => {
            await authFlow.loginSuccess(email, password, username);
        });

        await test.step('Upload and publish a private video through the full upload flow', async () => {
            await uploadWithChunkCheck(page, async () => {
                await flow.createMovie({
                    filePath: 'test-data/fixtures/video/5secVideo.mp4',
                    title: videoName,
                    visibility: 'private',
                });
            });
            await flow.modal.closeSuccess();
        });
    });

});

test.describe('Video player', () => {

    test('Video player plays video', { annotation: { type: 'TC', description: 'PROD-005' } }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const videoPlayer = new VideoPlayerPage(page);
        const email = process.env.PROD_TEST_EMAIL;
        const password = process.env.PROD_TEST_PASSWORD;
        const username = process.env.PROD_TEST_USERNAME;
        const videoUrl = process.env.PROD_VIDEO_URL;
        if (!email || !password || !username) throw new Error('PROD_TEST_* env vars not set. Run setup.spec.ts first.');
        if (!videoUrl) throw new Error('PROD_VIDEO_URL env var not set.');

        await test.step('Login with pre-created prod user', async () => {
            await authFlow.loginSuccess(email, password, username);
        });

        await test.step('Open video page and assert player is playing', async () => {
            await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
            await videoPlayer.assertVideoIsPlaying();
        });
    });

});

test.describe.skip('Visual', () => {

    test('Home page visual', { annotation: { type: 'TC', description: 'PROD-VIS-001' } }, async ({ page }) => {
        // TODO: implement
    });

    test('Studio page visual', { annotation: { type: 'TC', description: 'PROD-VIS-002' } }, async ({ page }) => {
        // TODO: implement
    });

});
