import { test, expect } from '@playwright/test';
import { AuthFlow } from '../src/flows/AuthFlow';
import { AuthApi } from "../src/api/AuthApi";
import { SideBarPage } from '../src/pages/components/SideBarPage';
import { StudioMembershipPage } from '../src/pages/studio/StudioMembershipPage';
import { UploadVideoFlow } from '../src/flows/UploadVideoFlow';
import { StudioContentPage } from '../src/pages/studio/StudioContentPage';
import { StudioProfilePage } from '../src/pages/studio/StudioProfilePage';
import { ChannelMainPage } from '../src/pages/channel/ChannelMainPage';
import { assertVideoIsPlaying } from '../src/utils/videoPlayerHelper';

test.describe.serial('Paid video suite', () => {
    let user: { email: string };
    let videoUrl;
    let videoName: string = Date.now().toString();
    const membershipName = 'Subscription #1';
    const membershipDescription = 'Description for card #1';

    test('Create user and fix channel privacy to public', async ({ page, request }) => {
      const authApi = new AuthApi(request);
      const authFlow = new AuthFlow(page);
      const studioProfilePage = new StudioProfilePage(page);
      const sideBar = new SideBarPage(page);
      const password = process.env.USER_PASSWORD!;

      user = await authApi.createAndVerifyUser();
      await authFlow.loginSuccess(user.email, password);
      await sideBar.clickStudioProfileChannel();
      await studioProfilePage.changePrivacyToPublic();
    });

    test('Create subscription plan', async ({ page }) => {
      const authFlow = new AuthFlow(page);
      const sideBar = new SideBarPage(page);
      const studioMembershipPage = new StudioMembershipPage(page);
      const password = process.env.USER_PASSWORD!;

      await authFlow.loginSuccess(user.email, password);
      await sideBar.clickStudioMemberships();
      await studioMembershipPage.addMembershipPlan(membershipName, membershipDescription);
      await studioMembershipPage.checkAddedPlan(membershipName, membershipDescription);
    });

    test('Upload paid video', async ({ page}) => {
      const authFlow = new AuthFlow(page);
      const uploadVideoFlow = new UploadVideoFlow(page);
      const studioContentPage = new StudioContentPage(page);
      const password = process.env.USER_PASSWORD!;

      await authFlow.loginSuccess(user.email, password);
      await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4','5secVideo');
      await uploadVideoFlow.waitStatusSuccessfully();
      await uploadVideoFlow.fillInReqFileds(videoName);
      await uploadVideoFlow.selectVisibility('paid');
      await uploadVideoFlow.clickPublishBtn();
      await uploadVideoFlow.confirmVideoUploading('Paid');
      videoUrl = await studioContentPage.getFirstVideoUrl();
      console.log('Video URL:', videoUrl);
    });

    test('Open paid video as anonymous -> Video is not available', async ({ page }) => {
      const anonymousVideoUrl = videoUrl!;
      const channelMainPage = new ChannelMainPage(page);

      await page.goto(anonymousVideoUrl);
      await expect(page.locator('.infinite-scroll-component')).toBeVisible();
      await expect(page.locator('[data-id="sub-card"]')).toBeVisible();
      await channelMainPage.checkRegisterLoginBtn();
    });

    test('Open paid video as logged in user -> Purchase membership -> Video is available', async ({ page ,request}) => {
      const authApi = new AuthApi(request);
      const authFlow = new AuthFlow(page);
      const channelMainPage = new ChannelMainPage(page);
      const password = process.env.USER_PASSWORD!;

      const user2 = await authApi.createAndVerifyUser();
      await authFlow.loginSuccess(user2.email, password);

      await page.goto(videoUrl!, {waitUntil: 'networkidle'});
      await expect(page.locator('.infinite-scroll-component')).toBeVisible();
      await expect(page.locator('[data-id="sub-card"]')).toBeVisible();
      await channelMainPage.purhcaseMembershipFromMembershipPage();

      await page.goto(videoUrl!, {waitUntil: 'networkidle'});
      await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
      await assertVideoIsPlaying(page);

    });

});