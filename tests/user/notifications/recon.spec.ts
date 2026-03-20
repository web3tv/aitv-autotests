import { test } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AuthApi } from '../../../src/api/AuthApi';
import { SideBarPage } from '../../../src/pages/components/SideBarPage';
import { StudioProfilePage } from '../../../src/pages/studio/StudioProfilePage';
import { UploadVideoFlow } from '../../../src/flows/UploadVideoFlow';

test('Recon: bell UI notification', async ({ page, request }) => {
  test.setTimeout(240_000);
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const password = process.env.USER_PASSWORD!;

  const userB = await authApi.createAndVerifyUser();
  const userA = await authApi.createAndVerifyUser();
  console.log('User A:', userA.username, 'User B:', userB.username);

  // User B: public channel
  await authFlow.loginSuccess(userB.email, password, userB.username);
  await sideBarPage.clickStudioProfileChannel();
  await new StudioProfilePage(page).changePrivacyToPublic();
  await authFlow.logout();

  // User A: subscribe
  await authFlow.loginSuccess(userA.email, password, userA.username);
  await page.goto(`/@${userB.username}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /subscribe/i }).first().click();
  await page.waitForResponse(res => res.url().includes('/api/subscriptions/create') && res.status() === 200, { timeout: 30000 });
  await authFlow.logout();

  // User B: upload video
  await authFlow.loginSuccess(userB.email, password, userB.username);
  const uploadVideoFlow = new UploadVideoFlow(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
  await uploadVideoFlow.waitStatusSuccessfully();
  await uploadVideoFlow.fillInReqFileds(Date.now().toString());
  await uploadVideoFlow.selectVisibility('public');
  await uploadVideoFlow.clickPublishBtn();
  await authFlow.logout();

  // User A: login, go to home, wait for notification, click bell
  await authFlow.loginSuccess(userA.email, password, userA.username);
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait for bell to show notification indicator (red dot / badge)
  // Try finding it by polling bell area
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(5000);
    // Check for red badge/dot near bell
    const bellArea = page.locator('[data-id="header"]');
    const badges = await bellArea.locator('[class*="badge"], [class*="Badge"], [class*="dot"], [class*="indicator"]').all();
    if (badges.length > 0) {
      console.log(`Found badge/indicator after ${(i + 1) * 5}s`);
      break;
    }
    // Also try reloading periodically
    if (i > 0 && i % 4 === 0) {
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }

  // Screenshot before bell click
  await page.screenshot({ path: 'recon-before-bell.png', fullPage: true });

  // Try clicking each header button to find the bell
  const headerBtns = await page.locator('[data-id="header"] > div:last-child button, [data-id="header"] button').all();
  console.log(`\nHeader buttons: ${headerBtns.length}`);

  for (let i = 0; i < headerBtns.length; i++) {
    const html = await headerBtns[i].innerHTML();
    if (html.includes('contentWrapper') || html.includes('Avatar') || html.includes('menu-mode')) continue;
    if (html.includes('mic') || html.includes('search') || html.includes('Clear') || html.includes('Open')) continue;

    await headerBtns[i].click();
    await page.waitForTimeout(1500);

    // Check what opened
    const presentations = await page.locator('[role="presentation"]').all();
    for (const pres of presentations) {
      const text = await pres.textContent().catch(() => '');
      if (text && (text.includes('Notification') || text.includes('Uploaded') || text.includes(userB.username))) {
        console.log(`\nBELL FOUND at button index ${i}`);
        console.log(`Panel text: "${text.slice(0, 500)}"`);
        await page.screenshot({ path: 'recon-bell-open.png', fullPage: true });

        // Dump the panel structure
        const panelHtml = await pres.innerHTML();
        console.log(`\nPanel HTML (first 2000 chars): ${panelHtml.slice(0, 2000)}`);
        return;
      }
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  console.log('Bell not found among header buttons');
  await page.screenshot({ path: 'recon-no-bell.png', fullPage: true });
});
