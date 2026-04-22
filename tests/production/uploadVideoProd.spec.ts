import { test } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { UploadVideoFlow } from '../../src/flows/UploadVideoFlow';
import { uploadWithChunkCheck } from '../../src/utils/studioTestHelpers';

test('Upload private video', { annotation: { type: 'TC', description: 'PROD-003' } }, async ({ page }) => {
  test.setTimeout(120_000);

  const authFlow = new AuthFlow(page);
  const uploadVideoFlow = new UploadVideoFlow(page);
  const email = process.env.PROD_TEST_EMAIL;
  const password = process.env.PROD_TEST_PASSWORD;
  const username = process.env.PROD_TEST_USERNAME;
  if (!email || !password || !username) throw new Error('PROD_TEST_* env vars not set. Run setup.spec.ts first.');
  const videoName = `prod-smoke-${Date.now()}`;

  await test.step('Login with pre-created user', async () => {
    await authFlow.loginSuccess(email, password, username);
  });

  await test.step('Upload video file', async () => {
    await uploadWithChunkCheck(page, async () => {
      await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', videoName);
    });
  });

  await test.step('Fill required fields and select private visibility', async () => {
    await uploadVideoFlow.fillInReqFileds(videoName);
    await uploadVideoFlow.selectVisibility('private');
  });

  await test.step('Wait for processing and publish', async () => {
    await uploadVideoFlow.waitStatusSuccessfully();
    await uploadVideoFlow.clickPublishBtn();
  });

  await test.step('Confirm video uploaded as Private', async () => {
    await uploadVideoFlow.confirmVideoUploading('Private');
  });
});
