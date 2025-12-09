import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { HeaderPage } from '../src/pages/HeaderPage';
import { UploadVideoPage } from '../src/pages/UploadVideoPagel';
import { AuthFlow } from '../src/flows/AuthFlow';
import { UploadVideoFlow } from '../src/flows/UploadVideoFlow';


test.describe('Uploading tests', () => {
    test('Upload video to channel and check this video in studio', async ({ page }) => {
        const login = process.env.USER_LOGIN!;
        const password = process.env.USER_PASSWORD!;
    
        const authFlow = new AuthFlow(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        await authFlow.loginSuccess(login,password);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/10secVideo.mp4');
        await uploadVideoFlow.fillInReqFileds('First video');
        await uploadVideoFlow.confirmUploading();
    });

});
