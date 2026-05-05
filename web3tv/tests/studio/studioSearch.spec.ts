import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';

test.describe('Studio Content Search', () => {

    test('Search filters videos by title', {
        annotation: { type: 'TC', description: 'STUDIO-017' },
    }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const studioContent = new StudioContentPage(page);
        const password = process.env.USER_PASSWORD!;

        let videoName1: string;
        let videoName2: string;

        await test.step('Setup: create user and upload 2 videos via API', async () => {
            const user = await authApi.createAndVerifyUser();
            const token = await authApi.getUserToken(user.email, password);
            const channelId = await videoApi.getChannelId(token);
            await videoApi.setChannelPublic(token, channelId, user.username);

            const video1 = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
                title: `SearchAlpha_${Date.now()}`,
                description: `desc_alpha_${Date.now()}`,
                privacySetting: 'public',
                waitForProcessing: true,
            });
            videoName1 = video1.title;

            const video2 = await videoApi.uploadVideo(token, 'test-data/fixtures/video/10secVideo.mp4', {
                title: `SearchBeta_${Date.now()}`,
                description: `desc_beta_${Date.now()}`,
                privacySetting: 'public',
                waitForProcessing: true,
            });
            videoName2 = video2.title;

            await authFlow.loginSuccess(user.email, password, user.username);
        });

        await test.step('Navigate to Studio Content page', async () => {
            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 15000 }
            );
            await sideBar.clickStudioContent();
            await responsePromise;
        });

        await test.step('Search by video1 title — only video1 is shown', async () => {
            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 15000 }
            );
            await studioContent.searchByText(videoName1!);
            await responsePromise;

            await studioContent.assertVideoRowContainsTitle(videoName1!);
            expect(await studioContent.getVideoRowsCount()).toBe(1);
        });

        await test.step('Clear search — both videos are shown', async () => {
            await studioContent.clearSearch();

            await studioContent.assertVideoRowContainsTitle(videoName1!);
            await studioContent.assertVideoRowContainsTitle(videoName2!);
            expect(await studioContent.getVideoRowsCount()).toBe(2);
        });

        await test.step('Search by video2 title — only video2 is shown', async () => {
            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 15000 }
            );
            await studioContent.searchByText(videoName2!);
            await responsePromise;

            await studioContent.assertVideoRowContainsTitle(videoName2!);
            expect(await studioContent.getVideoRowsCount()).toBe(1);
        });
    });

    test('Search does NOT match by description', {
        annotation: { type: 'TC', description: 'STUDIO-018' },
    }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const studioContent = new StudioContentPage(page);
        const password = process.env.USER_PASSWORD!;

        let videoDescription: string;

        await test.step('Setup: create user and upload video via API', async () => {
            const user = await authApi.createAndVerifyUser();
            const token = await authApi.getUserToken(user.email, password);
            const channelId = await videoApi.getChannelId(token);
            await videoApi.setChannelPublic(token, channelId, user.username);

            videoDescription = `UniqueDesc_${Date.now()}`;
            await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
                title: `Video_${Date.now()}`,
                description: videoDescription,
                privacySetting: 'public',
                waitForProcessing: true,
            });

            await authFlow.loginSuccess(user.email, password, user.username);
        });

        await test.step('Navigate to Studio Content page', async () => {
            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 15000 }
            );
            await sideBar.clickStudioContent();
            await responsePromise;
        });

        await test.step('Search by description — no results found', async () => {
            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 15000 }
            );
            await studioContent.searchByText(videoDescription!);
            await responsePromise;

            await studioContent.assertNoVideoRows();
        });
    });

    test('Search filters shorts by title', {
        annotation: { type: 'TC', description: 'STUDIO-019' },
    }, async ({ page, request }) => {
        test.setTimeout(180_000);
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const studioContent = new StudioContentPage(page);
        const password = process.env.USER_PASSWORD!;

        let shortName: string;

        await test.step('Setup: create user and upload 1 short via API', async () => {
            const user = await authApi.createAndVerifyUser();
            const token = await authApi.getUserToken(user.email, password);
            const channelId = await videoApi.getChannelId(token);
            await videoApi.setChannelPublic(token, channelId, user.username);

            const short1 = await videoApi.uploadVideo(token, 'test-data/fixtures/video/shortsVideo.mp4', {
                title: `ShortAlpha_${Date.now()}`,
                description: `short_desc_alpha_${Date.now()}`,
                privacySetting: 'public',
                contentType: 'short',
                waitForProcessing: true,
            });
            shortName = short1.title;

            await authFlow.loginSuccess(user.email, password, user.username);
        });

        await test.step('Navigate to Studio Content page and switch to Shorts tab', async () => {
            const videosResponsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 15000 }
            );
            await sideBar.clickStudioContent();
            await videosResponsePromise;

            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 15000 }
            );
            await expect(studioContent.shortsTab, 'Shorts tab is not visible').toBeVisible();
            await expect(studioContent.shortsTab, 'Shorts tab is not enabled').toBeEnabled();
            await studioContent.clickShortsTab();
            await responsePromise;
        });

        await test.step('Search by short title — short is shown', async () => {
            await studioContent.searchByText(shortName!);

            await studioContent.assertVideoRowContainsTitle(shortName!);
            expect(await studioContent.getVideoRowsCount()).toBe(1);
        });

        await test.step('Clear search — short is still shown', async () => {
            await studioContent.clearSearch();

            await studioContent.assertVideoRowContainsTitle(shortName!);
            expect(await studioContent.getVideoRowsCount()).toBe(1);
        });
    });
});
