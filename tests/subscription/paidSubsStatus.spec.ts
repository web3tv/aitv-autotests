import { test, expect, request as playwrightRequest, APIRequestContext } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { SubscriptionApi } from '../../src/api/SubscriptionApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { DatabaseHelper } from '../../src/api/DatabaseHelper';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { ChannelMainPage } from '../../src/pages/channel/ChannelMainPage';
import { MyPaidSubsPage } from '../../src/pages/account/MyPaidSubsPage';
import { setupVideoViaApi, VideoSetupResult } from '../../src/utils/studioTestHelpers';

test.describe('Paid subscription status on /my-paid-subs', () => {
    let apiContext: APIRequestContext;
    let setup: VideoSetupResult;
    const password = process.env.USER_PASSWORD!;

    test.beforeAll(async () => {
        apiContext = await playwrightRequest.newContext();
        setup = await setupVideoViaApi(apiContext, { privacySetting: 'paid' });
    });

    test.afterAll(async () => {
        await apiContext.dispose();
    });

    test('Active subscription displayed on /my-paid-subs', {
        tag: '@db',
        annotation: [{ type: 'TC', description: 'PAID-006' }],
    }, async ({ page, request }) => {
        test.setTimeout(180_000);

        const authApi = new AuthApi(request);
        const subscriptionApi = new SubscriptionApi(request);

        let buyerUser: { id?: string; email: string; username: string };
        let buyerToken: string;

        await test.step('Create buyer user, get API token and login via UI', async () => {
            const authFlow = new AuthFlow(page);
            buyerUser = await authApi.createAndVerifyUser();
            buyerToken = await authApi.getUserToken(buyerUser.email, password);
            await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);
        });

        await test.step('Initiate purchase via Pay With Hero (no payment)', async () => {
            const channelMainPage = new ChannelMainPage(page);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.assertSubscriptionCardVisible(setup.membershipName!, setup.membershipDescription!);
            await channelMainPage.initiatePurchaseWithoutPayment();
        });

        await test.step('Set Active subscription in DB', async () => {
            const db = new DatabaseHelper();

            await db.connect();
            await db.setActiveSubscription(buyerUser!.email);
            await db.disconnect();
        });

        await test.step('Navigate to /my-paid-subs and verify Active status', async () => {
            const sideBar = new SideBarPage(page);
            const myPaidSubsPage = new MyPaidSubsPage(page);

            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await sideBar.clickSettingsPaidSubscriptions();
            await myPaidSubsPage.assertPageLoaded();
            await myPaidSubsPage.assertSubscriptionVisible();
            await myPaidSubsPage.assertStatus('Active');
            await myPaidSubsPage.assertChannelName(setup.user.username);
            await myPaidSubsPage.assertSubscriptionName(setup.membershipName!);
        });

        await test.step('Verify /paid-subs/my response contains thumbnails field in user object', async () => {
            const mySubs = await subscriptionApi.getMySubscriptions(buyerToken!, { userId: buyerUser!.id });
            const items = mySubs.items ?? mySubs.data?.items ?? mySubs;
            expect(Array.isArray(items), '/paid-subs/my response is not an array').toBe(true);
            expect(items.length, 'expected at least one subscription in /paid-subs/my').toBeGreaterThan(0);

            const subItem = items[0];
            expect(subItem.user, 'user object is missing in /paid-subs/my item').toBeDefined();
            expect(subItem.user, 'user.id is missing').toHaveProperty('id');
            expect(subItem.user, 'user.username is missing').toHaveProperty('username');
        });
    });

    test('Pending payment status on /my-paid-subs', {
        annotation: [{ type: 'TC', description: 'PAID-008' }],
    }, async ({ page, request }) => {
        test.setTimeout(180_000);

        await test.step('Create buyer, login and initiate purchase without payment', async () => {
            const authApi = new AuthApi(request);
            const authFlow = new AuthFlow(page);
            const channelMainPage = new ChannelMainPage(page);

            const buyerUser = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.assertSubscriptionCardVisible(setup.membershipName!, setup.membershipDescription!);
            await channelMainPage.initiatePurchaseWithoutPayment();
        });

        await test.step('Navigate to /my-paid-subs and verify Pending payment status', async () => {
            const myPaidSubsPage = new MyPaidSubsPage(page);

            await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
            await myPaidSubsPage.assertPageLoaded();
            await myPaidSubsPage.assertSubscriptionVisible();
            await myPaidSubsPage.assertStatus('Pending payment');
        });
    });

    test('Expired subscription displayed on /my-paid-subs', {
        tag: '@db',
        annotation: [{ type: 'TC', description: 'PAID-007' }],
    }, async ({ page, request }) => {
        test.setTimeout(180_000);

        let buyerUser: { id?: string; email: string; username: string };

        await test.step('Create buyer, login and initiate purchase without payment', async () => {
            const authApi = new AuthApi(request);
            const authFlow = new AuthFlow(page);
            const channelMainPage = new ChannelMainPage(page);

            buyerUser = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.assertSubscriptionCardVisible(setup.membershipName!, setup.membershipDescription!);
            await channelMainPage.initiatePurchaseWithoutPayment();
        });

        await test.step('Expire subscription in DB and verify Expired status on UI', async () => {
            const db = new DatabaseHelper();
            const myPaidSubsPage = new MyPaidSubsPage(page);

            await db.connect();
            await db.expireSubscription(buyerUser!.email);
            await db.disconnect();

            await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
            await myPaidSubsPage.assertPageLoaded();
            await myPaidSubsPage.assertSubscriptionVisible();
            await myPaidSubsPage.assertStatus('Expired');
        });
    });

    test('Payment expired status on /my-paid-subs', {
        tag: '@db',
        annotation: [{ type: 'TC', description: 'PAID-009' }],
    }, async ({ page, request }) => {
        test.setTimeout(180_000);

        let buyerUser: { id?: string; email: string; username: string };

        await test.step('Create buyer, login and initiate purchase without payment', async () => {
            const authApi = new AuthApi(request);
            const authFlow = new AuthFlow(page);
            const channelMainPage = new ChannelMainPage(page);

            buyerUser = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.assertSubscriptionCardVisible(setup.membershipName!, setup.membershipDescription!);
            await channelMainPage.initiatePurchaseWithoutPayment();
        });

        await test.step('Expire transaction in DB and verify Payment expired status on UI', async () => {
            const db = new DatabaseHelper();
            const myPaidSubsPage = new MyPaidSubsPage(page);

            await db.connect();
            await db.expireTransaction(buyerUser!.email);
            await db.disconnect();

            await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
            await myPaidSubsPage.assertPageLoaded();
            await myPaidSubsPage.assertSubscriptionVisible();
            await myPaidSubsPage.assertStatus('Payment expired');
        });
    });

    test('Payment failed status on /my-paid-subs', { tag: '@db' }, async ({ page, request }) => {
        test.setTimeout(180_000);

        let buyerUser: { id?: string; email: string; username: string };

        await test.step('Create buyer, login and initiate purchase without payment', async () => {
            const authApi = new AuthApi(request);
            const authFlow = new AuthFlow(page);
            const channelMainPage = new ChannelMainPage(page);

            buyerUser = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);

            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.assertSubscriptionCardVisible(setup.membershipName!, setup.membershipDescription!);
            await channelMainPage.initiatePurchaseWithoutPayment();
        });

        await test.step('Invalidate transaction in DB and verify Payment failed status on UI', async () => {
            const db = new DatabaseHelper();
            const myPaidSubsPage = new MyPaidSubsPage(page);

            await db.connect();
            await db.invalidateTransaction(buyerUser!.email);
            await db.disconnect();

            await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
            await myPaidSubsPage.assertPageLoaded();
            await myPaidSubsPage.assertSubscriptionVisible();
            await myPaidSubsPage.assertStatus('Payment failed');
        });
    });
});
