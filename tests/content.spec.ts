import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { HeaderPage } from '../src/pages/HeaderPage';
import { UploadVideoPage } from '../src/pages/UploadVideoPagel';
import { AuthFlow } from '../src/flows/AuthFlow';
import { UploadVideoFlow } from '../src/flows/UploadVideoFlow';

test('Upload video to channel and check this video in studio', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    const loginPage = new LoginPage(page);
    const uploadVideoPage = new UploadVideoPage(page)
    const login = process.env.USER_LOGIN!;
    const password = process.env.USER_PASSWORD!;
   
    const authFlow = new AuthFlow(loginPage);
    const uploadVideoFlow = new UploadVideoFlow(uploadVideoPage, headerPage);
    await authFlow.loginSuccess(login,password);

    await uploadVideoFlow.uploadVideo('test-data/fixtures/video/10secVideo.mp4');
    await uploadVideoFlow.fillInReqFileds('First video');
    await uploadVideoFlow.confirmUploading();
});

