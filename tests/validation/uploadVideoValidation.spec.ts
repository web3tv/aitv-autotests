import { test } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { UploadVideoFlow } from '../../src/flows/UploadVideoFlow';
import { UploadVideoPage } from '../../src/pages/components/UploadVideoPage';

test('Upload video — required fields validation', { annotation: { type: 'TC', description: 'UPLOAD-009' } }, async ({ page, request }) => {
    test.setTimeout(60_000);

    await test.step('Create user, login and open upload form', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const password = process.env.USER_PASSWORD!;

        const user = await authApi.createUserFast();
        await authFlow.loginSuccess(user.email, password, user.username);

        const uploadVideoFlow = new UploadVideoFlow(page);
        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
    });

    const uploadVideoPage = new UploadVideoPage(page);

    await test.step('Empty form — Next button is disabled', async () => {
        await uploadVideoPage.assertNextBtnDisabled();
    });

    await test.step('Title only — Next button is disabled', async () => {
        await uploadVideoPage.fillVideoTitle('Test Title');
        await uploadVideoPage.assertNextBtnDisabled();
    });

    await test.step('Clear title — error "Video name is required"', async () => {
        await uploadVideoPage.clearVideoTitle();
        await uploadVideoPage.blur();
        await uploadVideoPage.assertError('Video name is required');
        await uploadVideoPage.assertNextBtnDisabled();
    });

    await test.step('Title + description, no category — Next button is disabled', async () => {
        await uploadVideoPage.fillVideoTitle('Test Title');
        await uploadVideoPage.fillVideoDescription('Test Description');
        await uploadVideoPage.assertNextBtnDisabled();
    });

    await test.step('Clear description — error "Content must include visible text"', async () => {
        await uploadVideoPage.clearVideoDescription();
        await uploadVideoPage.blur();
        await uploadVideoPage.assertError('Content must include visible text');
        await uploadVideoPage.assertNextBtnDisabled();
    });
});
