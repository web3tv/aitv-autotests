import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { user1 } from '../test-data/users';
import { HeaderPage } from '../src/pages/HeaderPage';
import { UploadVideoPage } from '../src/pages/UploadVideoPagel';
import { AuthFlow } from '../src/flows/AuthFlow';
import { UploadVideoFlow } from '../src/flows/UploadVideoFlow';

test('upload video to channel', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    const loginPage = new LoginPage(page);
    const uploadVideoPage = new UploadVideoPage(page)
   
    const authFlow = new AuthFlow(loginPage);
    const uploadVideoFlow = new UploadVideoFlow(uploadVideoPage, headerPage);
    await authFlow.loginSuccess(user1.login,user1.password);

    await uploadVideoFlow.uploadVideo('test-data/fixtures/video/10secVideo.mp4');
    await uploadVideoFlow.fillInReqFileds('First video');
    await uploadVideoFlow.confirmUploading();
});

