import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { UploadVideoFlow } from '../../../src/flows/UploadVideoFlow';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { AuthApi } from '../../../src/api/AuthApi';
import { setupUserWithPublicChannel, uploadWithChunkCheck } from '../../../src/utils/studioTestHelpers';

test('Upload video', { tag: '@critical', annotation: { type: 'TC', description: 'UPLOAD-001' } }, async ({ page, request }) => {
    test.setTimeout(120_000);
    let user: { email: string, username: string };
    const videoName: string = Date.now().toString();

    await test.step('Create user and fix channel privacy to public', async () => {
        user = await setupUserWithPublicChannel(page, request);
    });

    await test.step('Upload public video and verify on studio content page', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        await uploadWithChunkCheck(page, async () => {
            await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
            await uploadVideoFlow.fillInReqFileds(videoName);
            await uploadVideoFlow.waitStatusSuccessfully();
        });

        await uploadVideoFlow.selectVisibility('public');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Public');

        const videoUrl = await studioContentPage.getFirstVideoUrl();
        expect(videoUrl, 'Video URL was not found on studio content page').toBeTruthy();
    });
});

test('Upload short video', { annotation: { type: 'TC', description: 'UPLOAD-005' } }, async ({ page, request }) => {
    test.setTimeout(180_000);
    let user: { email: string, username: string };
    const videoName: string = Date.now().toString();

    await test.step('Create user and fix channel privacy to public', async () => {
        user = await setupUserWithPublicChannel(page, request);
    });

    await test.step('Upload public short and verify on studio content page', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        await uploadWithChunkCheck(page, async () => {
            await uploadVideoFlow.uploadShort('test-data/fixtures/video/shortsVideo.MOV', 'shortsVideo');
            await uploadVideoFlow.fillInReqFileds(videoName);
            await uploadVideoFlow.waitStatusSuccessfully();
        });

        await uploadVideoFlow.selectVisibility('private');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmShortsUploading('Private');

        const videoUrl = await studioContentPage.getFirstVideoUrl();
        expect(videoUrl, 'Short URL was not found on studio content page').toBeTruthy();
    });
});

test('Publish video while still processing', { annotation: { type: 'TC', description: 'UPLOAD-013' } }, async ({ page, request }) => {
    test.setTimeout(120_000);
    const videoName: string = Date.now().toString();

    await test.step('Create user and fix channel privacy to public', async () => {
        await setupUserWithPublicChannel(page, request);
    });

    await test.step('Upload video, fill fields and publish without waiting for completed status', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        await uploadWithChunkCheck(page, async () => {
            await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
            await uploadVideoFlow.fillInReqFileds(videoName);
        });

        await uploadVideoFlow.selectVisibility('public');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Public');
        await studioContentPage.checkVideoStatus('processing');
    });
});

test('Upload video >50mb workflow', { annotation: { type: 'TC', description: 'UPLOAD-006' } }, async ({ page, request }) => {
    test.setTimeout(270_000);
    const videoName: string = Date.now().toString();

    await test.step('Create user and login', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const password = process.env.USER_PASSWORD!;

        const user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password, user.username);
    });

    await test.step('Upload large video and verify on studio page', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/Video_more50mb.mp4', 'Video_more50mb');
        await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfullyForBigVideo();
        await uploadVideoFlow.selectVisibility('unlisted');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Unlisted');
    });
});
