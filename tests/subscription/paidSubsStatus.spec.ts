import { test } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { DatabaseHelper } from '../../src/api/DatabaseHelper';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { ChannelMainPage } from '../../src/pages/channel/ChannelMainPage';
import { HeroPayPage } from '../../src/pages/heroPay/HeroPayPage';
import { MyPaidSubsPage } from '../../src/pages/account/MyPaidSubsPage';
import { setupVideoViaApi, VideoSetupResult } from '../../src/utils/studioTestHelpers';

test('PAID-006: Active subscription displayed on /my-paid-subs', {
    annotation: [{ type: 'TC', description: 'PAID-006' }],
}, async ({ page, request }) => {
    test.setTimeout(180_000);

    let setup: VideoSetupResult;
    const password = process.env.USER_PASSWORD!;

    await test.step('Setup owner with public channel, paid plan and video via API', async () => {
        setup = await setupVideoViaApi(request, { privacySetting: 'paid' });
    });

    await test.step('Create buyer user and login', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const buyerUser = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);
    });

    await test.step('Navigate to paid video and purchase membership via mock payment', async () => {
        const channelMainPage = new ChannelMainPage(page);

        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.assertSubscriptionCardVisible();
        await channelMainPage.purhcaseMembershipFromMembershipPageMockPayment();
    });

    await test.step('Navigate to /my-paid-subs and verify Active status', async () => {
        const sideBar = new SideBarPage(page);
        const myPaidSubsPage = new MyPaidSubsPage(page);

        await sideBar.clickSettingsPaidSubscriptions();
        await myPaidSubsPage.assertPageLoaded();
        await myPaidSubsPage.assertSubscriptionVisible();
        await myPaidSubsPage.assertStatus('Active');
        await myPaidSubsPage.assertChannelName(setup.user.username);
        await myPaidSubsPage.assertSubscriptionName(setup.membershipName!);
    });
});

test('PAID-008: Pending payment status on /my-paid-subs', {
    annotation: [{ type: 'TC', description: 'PAID-008' }],
}, async ({ page, request }) => {
    test.setTimeout(180_000);

    let setup: VideoSetupResult;
    const password = process.env.USER_PASSWORD!;

    await test.step('Setup owner with public channel, paid plan and video via API', async () => {
        setup = await setupVideoViaApi(request, { privacySetting: 'paid' });
    });

    await test.step('Create buyer user and login', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const buyerUser = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);
    });

    await test.step('Navigate to paid video and initiate payment without confirmation', async () => {
        const channelMainPage = new ChannelMainPage(page);
        const heroPayPage = new HeroPayPage(page);

        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.assertSubscriptionCardVisible();
        await channelMainPage.clickButtonSubscribeNow();
        await channelMainPage.clickPayWith();
        await heroPayPage.initiateMockPaymentWithoutConfirmation();
    });

    await test.step('Navigate to /my-paid-subs and verify Pending payment status', async () => {
        const myPaidSubsPage = new MyPaidSubsPage(page);

        await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
        await myPaidSubsPage.assertPageLoaded();
        await myPaidSubsPage.assertSubscriptionVisible();
        await myPaidSubsPage.assertStatus('Pending payment');
    });
});

test('PAID-007: Expired subscription displayed on /my-paid-subs', {
    annotation: [{ type: 'TC', description: 'PAID-007' }],
}, async ({ page, request }) => {
    test.setTimeout(180_000);

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
        await channelMainPage.assertSubscriptionCardVisible();
        await channelMainPage.purhcaseMembershipFromMembershipPageMockPayment();
    });

    await test.step('Expire subscription in DB and verify Expired status on UI', async () => {
        const db = new DatabaseHelper();
        const myPaidSubsPage = new MyPaidSubsPage(page);

        await db.connect();
        await db.expireSubscription(buyerUser.email);
        await db.disconnect();

        await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
        await myPaidSubsPage.assertPageLoaded();
        await myPaidSubsPage.assertSubscriptionVisible();
        await myPaidSubsPage.assertStatus('Expired');
    });
});

test('PAID-009: Payment expired status on /my-paid-subs', {
    annotation: [{ type: 'TC', description: 'PAID-009' }],
}, async ({ page, request }) => {
    test.setTimeout(180_000);

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
        await channelMainPage.assertSubscriptionCardVisible();
        await channelMainPage.purhcaseMembershipFromMembershipPageMockPayment();
    });

    await test.step('Expire transaction in DB and verify Payment expired status on UI', async () => {
        const db = new DatabaseHelper();
        const myPaidSubsPage = new MyPaidSubsPage(page);

        await db.connect();
        await db.expireTransaction(buyerUser.email);
        await db.disconnect();

        await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
        await myPaidSubsPage.assertPageLoaded();
        await myPaidSubsPage.assertSubscriptionVisible();
        await myPaidSubsPage.assertStatus('Payment expired');
    });
});
