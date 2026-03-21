import { test, expect, Page } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';

async function confirmVideoUploading(
    page: Page,
    description: string,
    visibility: string
): Promise<void> {
    const sideBarPage = new SideBarPage(page);
    const studioContentPage = new StudioContentPage(page);

    await sideBarPage.clickStudioContent();
    await studioContentPage.checkVideoDescription(description);
    await studioContentPage.checkVideoVisibility(visibility);
}

test('Upload video via API and verify in Studio Content', async ({ page, request }) => {
    test.setTimeout(300_000);

    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);

    let videoDescription: string;
    let userEmail: string;
    let username: string;

    await test.step('Create user and upload video via API', async () => {
        const user = await authApi.createAndVerifyUser();
        userEmail = user.email;
        username = user.username;

        const token = await authApi.getUserToken(userEmail, process.env.USER_PASSWORD!);

        videoDescription = `desc_${Date.now()}`;

        await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            title: `API Video ${Date.now()}`,
            description: videoDescription,
            privacySetting: 'public',
            waitForProcessing: true,
        });
    });

    await test.step('Login and verify video in Studio Content', async () => {
        const authFlow = new AuthFlow(page);
        await authFlow.loginSuccess(userEmail, process.env.USER_PASSWORD!, username);

        await confirmVideoUploading(page, videoDescription, 'Public');

    });
});
