import { test, expect } from '@playwright/test';
import { AuthFlow } from '../src/flows/AuthFlow';
import { AuthApi } from '../src/api/AuthApi';
import { SideBarPage } from '../src/pages/components/SideBarPage';
import { StudioProfilePage } from '../src/pages/studio/StudioProfilePage';
import { UploadVideoFlow } from '../src/flows/UploadVideoFlow';

test('Recon: check studio content row structure', async ({ page, request }) => {
  test.setTimeout(300_000);
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const studioProfilePage = new StudioProfilePage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createAndVerifyUser();

  await authFlow.loginSuccess(user.email, password, user.username);
  await sideBarPage.clickStudioProfileChannel();
  await studioProfilePage.changePrivacyToPublic();

  const uploadVideoFlow = new UploadVideoFlow(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
  await uploadVideoFlow.waitStatusSuccessfully();
  await uploadVideoFlow.fillInReqFileds(Date.now().toString());
  await uploadVideoFlow.selectVisibility('public');
  await uploadVideoFlow.clickPublishBtn();

  await sideBarPage.clickStudioContent();
  await page.waitForTimeout(5000);

  // Find parent of [data-id="video"] element
  const parentInfo = await page.evaluate(() => {
    const videoEl = document.querySelector('[data-id="video"]');
    if (!videoEl) return 'video element not found';
    const parent = videoEl.parentElement;
    if (!parent) return 'no parent';
    const grandparent = parent.parentElement;
    return {
      parent: {
        tag: parent.tagName,
        className: parent.className,
        dataId: parent.getAttribute('data-id'),
        id: parent.id,
        childCount: parent.children.length,
      },
      grandparent: grandparent ? {
        tag: grandparent.tagName,
        className: grandparent.className,
        dataId: grandparent.getAttribute('data-id'),
        id: grandparent.id,
      } : null,
      siblings: Array.from(parent.children).map(c => ({
        tag: c.tagName,
        dataId: c.getAttribute('data-id'),
        className: c.className?.substring(0, 60),
      })),
    };
  });
  console.log('Parent structure:', JSON.stringify(parentInfo, null, 2));
});
