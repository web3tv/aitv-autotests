import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AuthApi } from '../../../src/api/AuthApi';
import { VideoApi } from '../../../src/api/VideoApi';
import { SideBarPage } from '../../../src/pages/components/SideBarPage';
import { StudioProfilePage } from '../../../src/pages/studio/StudioProfilePage';
import { StudioMembershipPage } from '../../../src/pages/studio/StudioMembershipPage';
import { UploadVideoFlow } from '../../../src/flows/UploadVideoFlow';
import { ChannelMainPage } from '../../../src/pages/channel/ChannelMainPage';
import { NotificationsPage } from '../../../src/pages/account/NotificationsPage';


test('Verify default notification states and toggle settings', { annotation: { type: 'TC', description: 'NOTIF-001' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const notificationsPage = new NotificationsPage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createAndVerifyUser();

  await test.step('Login and navigate to /notifications', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await sideBarPage.clickSettingsNotifications();
  });

  await test.step('Verify default toggle states — all ON', async () => {
    await notificationsPage.assertAllDefaultStates();
  });

  await test.step('Toggle Subscriptions OFF and verify API response', async () => {
    await notificationsPage.toggleAndVerifyResponse(
      notificationsPage.subscriptionsToggle, 'subscriptions', false
    );
  });

  await test.step('Toggle Paid Subscriptions OFF and verify API response', async () => {
    await notificationsPage.toggleAndVerifyResponse(
      notificationsPage.paidSubscriptionsToggle, 'paidSubscriptions', false
    );
  });

  await test.step('Toggle Comment Mentions OFF and verify API response', async () => {
    await notificationsPage.toggleAndVerifyResponse(
      notificationsPage.commentMentionsToggle, 'commentMentions', false
    );
  });

  await test.step('Reload and verify all toggles persisted as OFF', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await notificationsPage.assertToggleState(notificationsPage.subscriptionsToggle, false, 'Subscriptions');
    await notificationsPage.assertToggleState(notificationsPage.paidSubscriptionsToggle, false, 'Paid Subscriptions');
    await notificationsPage.assertToggleState(notificationsPage.commentMentionsToggle, false, 'Comment Mentions');
  });

  await test.step('Toggle all back ON and verify API response', async () => {
    await notificationsPage.toggleAndVerifyResponse(
      notificationsPage.subscriptionsToggle, 'subscriptions', true
    );
    await notificationsPage.toggleAndVerifyResponse(
      notificationsPage.paidSubscriptionsToggle, 'paidSubscriptions', true
    );
    await notificationsPage.toggleAndVerifyResponse(
      notificationsPage.commentMentionsToggle, 'commentMentions', true
    );
  });

  await test.step('Reload and verify all toggles persisted as ON', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await notificationsPage.assertAllDefaultStates();
  });
});

test('Notification received on channel subscription', { annotation: { type: 'TC', description: 'NOTIF-002' } }, async ({ page, request }) => {
  test.setTimeout(360_000);
  const authApi = new AuthApi(request);
  const videoApi = new VideoApi(request);
  const authFlow = new AuthFlow(page);
  const notificationsPage = new NotificationsPage(page);
  const password = process.env.USER_PASSWORD!;

  const userB = await authApi.createAndVerifyUser();
  const userA = await authApi.createAndVerifyUser();

  await test.step('Make User B channel public via API', async () => {
    const tokenB = await authApi.getUserToken(userB.email, password);
    const channelId = await videoApi.getChannelId(tokenB);
    await videoApi.setChannelPublic(tokenB, channelId, userB.username);
  });

  await test.step('User A subscribes to User B channel via UI', async () => {
    await authFlow.loginSuccess(userA.email, password, userA.username);
    await page.goto(`/@${userB.username}`, { waitUntil: 'domcontentloaded' });

    const subscribeBtn = page.getByRole('button', { name: /subscribe/i }).first();
    await expect(subscribeBtn, 'Subscribe button is not visible').toBeVisible();
    await expect(subscribeBtn, 'Subscribe button is not enabled').toBeEnabled();

    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/subscriptions/create') && res.status() === 200,
      { timeout: 30000 }
    );
    await subscribeBtn.click();
    await responsePromise;
    await authFlow.logout();
  });

  await test.step('User B receives channel_subscription notification in bell', async () => {
    await authFlow.loginSuccess(userB.email, password, userB.username);

    const pattern = new RegExp(`${userA.username} has subscribed to your channel ${userB.username}!`, 'i');
    await notificationsPage.assertNotificationInBell(pattern, { maxAttempts: 24, intervalMs: 5000 });
  });
});

test('Notification received on paid subscription purchase', { annotation: { type: 'TC', description: 'NOTIF-003' } }, async ({ page, request }) => {
  test.setTimeout(180_000);
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const studioProfilePage = new StudioProfilePage(page);
  const notificationsPage = new NotificationsPage(page);
  const password = process.env.USER_PASSWORD!;

  let videoUrl: string;

  const userB = await authApi.createAndVerifyUser();
  const userA = await authApi.createAndVerifyUser();

  await test.step('User B: make channel public', async () => {
    await authFlow.loginSuccess(userB.email, password, userB.username);
    await sideBarPage.clickStudioProfileChannel();
    await studioProfilePage.changePrivacyToPublic();
  });

  await test.step('User B: create membership plan', async () => {
    const studioMembershipPage = new StudioMembershipPage(page);
    await sideBarPage.clickStudioMemberships();
    await studioMembershipPage.addMembershipPlan('Subscription #1', 'Test Description');
    await studioMembershipPage.checkAddedPlan('Subscription #1', 'Test Description');
  });

  await test.step('User B: upload paid video', async () => {
    const uploadVideoFlow = new UploadVideoFlow(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
    await uploadVideoFlow.waitStatusSuccessfully();
    await uploadVideoFlow.fillInReqFileds(Date.now().toString());
    await uploadVideoFlow.selectVisibility('paid');
    await uploadVideoFlow.clickPublishBtn();

    await sideBarPage.clickStudioContent();
    const videoLink = page.locator('a[href*="/video/"]').first();
    await expect(videoLink, 'Video link is not visible on studio content page').toBeVisible({ timeout: 15000 });
    const href = await videoLink.getAttribute('href');
    if (!href) throw new Error('Video URL was not found');
    videoUrl = href;
    await authFlow.logout();
  });

  await test.step('User A: purchase paid subscription via mock payment', async () => {
    await authFlow.loginSuccess(userA.email, password, userA.username);
    await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-id="sub-card"]'), 'Subscription card is not visible').toBeVisible();

    const channelMainPage = new ChannelMainPage(page);
    await channelMainPage.purhcaseMembershipFromMembershipPageMockPayment();
    await authFlow.logout();
  });

  await test.step('User B receives paid subscription notification in bell', async () => {
    await authFlow.loginSuccess(userB.email, password, userB.username);
    const pattern = new RegExp(`${userA.username} has purchased a paid subscription to your channel ${userB.username}!`, 'i');
    await notificationsPage.assertNotificationInBell(pattern, { maxAttempts: 24, intervalMs: 5000 });
  });
});

test.fixme('Notification received when subscribed channel uploads video', { annotation: { type: 'TC', description: 'NOTIF-004' } }, async ({ page, request }) => {
  test.setTimeout(180_000);
  const authApi = new AuthApi(request);
  const videoApi = new VideoApi(request);
  const authFlow = new AuthFlow(page);
  const notificationsPage = new NotificationsPage(page);
  const password = process.env.USER_PASSWORD!;

  const userB = await authApi.createAndVerifyUser();
  const userA = await authApi.createAndVerifyUser();

  await test.step('Make User B channel public via API', async () => {
    const tokenB = await authApi.getUserToken(userB.email, password);
    const channelId = await videoApi.getChannelId(tokenB);
    await videoApi.setChannelPublic(tokenB, channelId, userB.username);
  });

  await test.step('User A subscribes to User B channel', async () => {
    await authFlow.loginSuccess(userA.email, password, userA.username);
    await page.goto(`/@${userB.username}`, { waitUntil: 'domcontentloaded' });

    const subscribeBtn = page.getByRole('button', { name: /subscribe/i }).first();
    await expect(subscribeBtn, 'Subscribe button is not visible').toBeVisible();
    await expect(subscribeBtn, 'Subscribe button is not enabled').toBeEnabled();

    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/subscriptions/create') && res.status() === 200,
      { timeout: 30000 }
    );
    await subscribeBtn.click();
    await responsePromise;
    await authFlow.logout();
  });

  let videoTitle: string;

  await test.step('User B uploads public video via API', async () => {
    videoTitle = Date.now().toString();
    const tokenB = await authApi.getUserToken(userB.email, password);
    await videoApi.uploadVideo(tokenB, 'test-data/fixtures/video/5secVideo.mp4', {
      title: videoTitle,
      privacySetting: 'public',
      waitForProcessing: true,
    });
  });

  await test.step('User A receives video upload notification in bell', async () => {
    await authFlow.loginSuccess(userA.email, password, userA.username);
    const pattern = new RegExp(`${userB.username}\\s+Uploaded a new video:\\s+${videoTitle}`, 'i');
    await notificationsPage.assertNotificationInBell(pattern, { maxAttempts: 24, intervalMs: 5000 });
  });
});

test('Notification received when paid channel uploads paid video', { annotation: { type: 'TC', description: 'NOTIF-005' } }, async ({ page, request }) => {
  test.setTimeout(360_000);
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const studioProfilePage = new StudioProfilePage(page);
  const notificationsPage = new NotificationsPage(page);
  const password = process.env.USER_PASSWORD!;

  let videoUrl: string;
  let secondVideoTitle: string;

  const userB = await authApi.createAndVerifyUser();
  const userA = await authApi.createAndVerifyUser();

  await test.step('User B: make channel public + create membership plan', async () => {
    await authFlow.loginSuccess(userB.email, password, userB.username);
    await sideBarPage.clickStudioProfileChannel();
    await studioProfilePage.changePrivacyToPublic();

    const studioMembershipPage = new StudioMembershipPage(page);
    await sideBarPage.clickStudioMemberships();
    await studioMembershipPage.addMembershipPlan('Subscription #1', 'Test Description');
    await studioMembershipPage.checkAddedPlan('Subscription #1', 'Test Description');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  await test.step('User B: upload first paid video for purchase', async () => {
    const uploadVideoFlow = new UploadVideoFlow(page);
    await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
    await uploadVideoFlow.waitStatusSuccessfully();
    await uploadVideoFlow.fillInReqFileds(Date.now().toString());
    await uploadVideoFlow.selectVisibility('paid');
    await uploadVideoFlow.clickPublishBtn();

    await sideBarPage.clickStudioContent();
    const videoLink = page.locator('a[href*="/video/"]').first();
    await expect(videoLink, 'Video link is not visible').toBeVisible({ timeout: 15000 });
    const href = await videoLink.getAttribute('href');
    if (!href) throw new Error('Video URL was not found');
    videoUrl = href;
    await authFlow.logout();
  });

  await test.step('User A: purchase paid subscription', async () => {
    await authFlow.loginSuccess(userA.email, password, userA.username);
    await page.goto(videoUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-id="sub-card"]'), 'Subscription card is not visible').toBeVisible();

    const channelMainPage = new ChannelMainPage(page);
    await channelMainPage.purhcaseMembershipFromMembershipPageMockPayment();
    await authFlow.logout();
  });

  await test.step('User B: upload second paid video', async () => {
    await authFlow.loginSuccess(userB.email, password, userB.username);
    const uploadVideoFlow = new UploadVideoFlow(page);
    await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
    await uploadVideoFlow.waitStatusSuccessfully();
    secondVideoTitle = Date.now().toString();
    await uploadVideoFlow.fillInReqFileds(secondVideoTitle);
    await uploadVideoFlow.selectVisibility('paid');
    await uploadVideoFlow.clickPublishBtn();
    await authFlow.logout();
  });

  await test.step('User A receives paid video notification in bell', async () => {
    await authFlow.loginSuccess(userA.email, password, userA.username);
    const pattern = new RegExp(`${userB.username}\\s+Uploaded a new video:\\s+${secondVideoTitle}`, 'i');
    await notificationsPage.assertNotificationInBell(pattern, { maxAttempts: 24, intervalMs: 5000 });
  });
});
