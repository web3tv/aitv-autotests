import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { DatabaseHelper } from '../../src/api/DatabaseHelper';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { StudioMembershipPage } from '../../src/pages/studio/StudioMembershipPage';
import { UploadVideoFlow } from '../../src/flows/UploadVideoFlow';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';
import { StudioProfilePage } from '../../src/pages/studio/StudioProfilePage';
import { ChannelMainPage } from '../../src/pages/channel/ChannelMainPage';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { MyPaidSubsPage } from '../../src/pages/account/MyPaidSubsPage';
import { setupVideoViaApi, VideoSetupResult } from '../../src/utils/studioTestHelpers';

test('Paid video suite', { annotation: [{ type: 'TC', description: 'PAID-001' }, { type: 'TC', description: 'PAID-002' }, { type: 'TC', description: 'PAID-003' }] }, async ({ page, request }) => {
    test.setTimeout(180_000);
    let user: { email: string, username: string };
    let videoUrl: string | null;
    const videoName: string = Date.now().toString();
    const membershipName = 'Subscription #1';
    const membershipDescription = 'Description for card #1';
    const password = process.env.USER_PASSWORD!;

    await test.step('Create user and fix channel privacy to public', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioProfilePage = new StudioProfilePage(page);
        const sideBar = new SideBarPage(page);

        user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password, user.username);
        await sideBar.clickStudioEditChannel();
        await studioProfilePage.changePrivacyToPublic();
    });

    await test.step('Create subscription plan', async () => {
        const sideBar = new SideBarPage(page);
        const studioMembershipPage = new StudioMembershipPage(page);

        await sideBar.clickStudioSubscriptions();
        await studioMembershipPage.addMembershipPlan(membershipName, membershipDescription);
        await studioMembershipPage.checkAddedPlan(membershipName, membershipDescription);
    });

    await test.step('Upload paid video', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        await page.goto('/');
        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.selectVisibility('paid');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Paid');
        videoUrl = await studioContentPage.getFirstVideoUrl();
        if (!videoUrl) {
            throw new Error('Video URL was not found');
        }
    });

    await test.step('Open paid video as anonymous -> Video is not available', async () => {
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);

        await authFlow.logout();
        await page.goto(videoUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.infinite-scroll-component')).toBeVisible();
        await expect(page.locator('[data-id="sub-card"]')).toBeVisible();
        await channelMainPage.checkRegisterLoginBtn();
    });

    await test.step('Open paid video as logged in user -> Purchase membership -> Video is available', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);

        const user2 = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user2.email, password, user2.username);

        await page.goto(videoUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.infinite-scroll-component')).toBeVisible();
        await expect(page.locator('[data-id="sub-card"]')).toBeVisible();
        await channelMainPage.purhcaseMembershipFromMembershipPageTestNet();
        await channelMainPage.assertSubscriptionStatus('Active');

        const videoPlayer = new VideoPlayerPage(page);
        await page.goto(videoUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: videoName })).toBeVisible({ timeout: 10_000 });
        await videoPlayer.assertPlayerVisible();
    });
});

test('Subscription expiry revokes access, re-purchase restores it', {
    annotation: [{ type: 'TC', description: 'PAID-005' }],
}, async ({ page, request }) => {
    test.setTimeout(240_000);

    let setup: VideoSetupResult;
    let buyerUser: { id: string; email: string; username: string };
    const password = process.env.USER_PASSWORD!;

    await test.step('Setup owner with public channel, paid plan and video via API', async () => {
        setup = await setupVideoViaApi(request, { privacySetting: 'paid' });
    });

    await test.step('Create buyer, login and purchase subscription', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);

        buyerUser = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);

        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.assertSubscriptionCardVisible(setup.membershipName!, setup.membershipDescription!);
        await channelMainPage.purhcaseMembershipFromMembershipPageTestNet();
        await channelMainPage.assertSubscriptionStatus('Active');
    });

    await test.step('Verify paid video is accessible after purchase', async () => {
        const videoPlayer = new VideoPlayerPage(page);

        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: setup.videoName })).toBeVisible({ timeout: 10_000 });
        await videoPlayer.assertPlayerVisible();
    });

    await test.step('Expire subscription in DB', async () => {
        const db = new DatabaseHelper();

        await db.connect();
        await db.expireSubscription(buyerUser.email);
        await db.disconnect();
    });

    await test.step('Verify paid video is no longer accessible (paywall shown)', async () => {
        const channelMainPage = new ChannelMainPage(page);

        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.assertSubscriptionCardVisible(setup.membershipName!, setup.membershipDescription!);
        await channelMainPage.checkButtonSubscribeNow();
    });

    await test.step('Re-purchase subscription via mock payment', async () => {
        const channelMainPage = new ChannelMainPage(page);

        await channelMainPage.purhcaseMembershipFromMembershipPageTestNet();
        await channelMainPage.assertSubscriptionStatus('Active');
    });

    await test.step('Verify subscription status is Active on /my-paid-subs', async () => {
        const myPaidSubsPage = new MyPaidSubsPage(page);

        await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
        await myPaidSubsPage.assertPageLoaded();
        await myPaidSubsPage.assertSubscriptionVisible();
        await myPaidSubsPage.assertStatus('Active');
    });

    await test.step('Verify paid video is accessible again after re-purchase', async () => {
        const videoPlayer = new VideoPlayerPage(page);

        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: setup.videoName })).toBeVisible({ timeout: 10_000 });
        await videoPlayer.assertPlayerVisible();
    });
});
