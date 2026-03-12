import { test } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { UploadVideoFlow } from '../../src/flows/UploadVideoFlow';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { StudioProfilePage } from '../../src/pages/studio/StudioProfilePage';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';

test('Video player plays uploaded video', async ({ page, request }) => {
    test.setTimeout(180_000);
    let videoUrl: string | null;
    const videoName: string = Date.now().toString();
    const password = process.env.USER_PASSWORD!;

    await test.step('Create user and set channel privacy to public', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const studioProfilePage = new StudioProfilePage(page);

        const user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password);
        await sideBar.clickStudioProfileChannel();
        await studioProfilePage.changePrivacyToPublic();
    });

    await test.step('Upload public video', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
        await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.selectVisibility('public');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Public');

        videoUrl = await studioContentPage.getFirstVideoUrl();
        if (!videoUrl) {
            throw new Error('Video URL was not found');
        }
    });

    await test.step('Open video and assert player is playing', async () => {
        const videoPlayer = new VideoPlayerPage(page);

        await page.goto(videoUrl!, { waitUntil: 'domcontentloaded' });
        await videoPlayer.assertVideoIsPlaying();
    });
});
