import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
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
        await expect(page.locator('[data-id="sub-card"]'), 'Subscription card is not visible').toBeVisible();
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
        await expect(page.locator('[data-id="sub-card"]'), 'Subscription card is not visible').toBeVisible();
        await channelMainPage.clickButtonSubscribeNow();
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

test('PAID-007: Expired subscription displayed on /my-paid-subs (mock)', {
    annotation: [
        { type: 'TC', description: 'PAID-007' },
        { type: 'note', description: '@needs-db-api — update when DB API access is available' },
    ],
}, async ({ page, request }) => {
    test.setTimeout(120_000);

    let setup: VideoSetupResult;
    const password = process.env.USER_PASSWORD!;

    await test.step('Setup owner with public channel, paid plan and video via API', async () => {
        setup = await setupVideoViaApi(request, { privacySetting: 'paid' });
    });

    await test.step('Create buyer, login and purchase subscription', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);

        const buyerUser = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);

        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('[data-id="sub-card"]'), 'Subscription card is not visible').toBeVisible();
        await channelMainPage.purhcaseMembershipFromMembershipPageMockPayment();
    });

    await test.step('Mock API response with Expired status and verify', async () => {
        const myPaidSubsPage = new MyPaidSubsPage(page);

        await page.route(
            (url) => url.toString().includes('/api/paid-subscriptions/my'),
            async (route) => {
                const response = await route.fetch();
                const json = await response.json();

                if (json.data?.items && Array.isArray(json.data.items)) {
                    json.data.items = json.data.items.map((sub: Record<string, unknown>) => ({
                        ...sub,
                        status: 'expired',
                        isActive: false,
                    }));
                }

                await route.fulfill({ response, json });
            },
        );

        await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
        await myPaidSubsPage.assertPageLoaded();
        await myPaidSubsPage.assertSubscriptionVisible();
        await myPaidSubsPage.assertStatus('Expired');
    });
});

test('PAID-009: Expired payment status on /my-paid-subs (mock)', {
    annotation: [
        { type: 'TC', description: 'PAID-009' },
        { type: 'note', description: '@needs-db-api — update when DB API access is available' },
    ],
}, async ({ page, request }) => {
    test.setTimeout(120_000);

    let setup: VideoSetupResult;
    const password = process.env.USER_PASSWORD!;

    await test.step('Setup owner with public channel, paid plan and video via API', async () => {
        setup = await setupVideoViaApi(request, { privacySetting: 'paid' });
    });

    await test.step('Create buyer, login and purchase subscription', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);

        const buyerUser = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(buyerUser.email, password, buyerUser.username);

        await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('[data-id="sub-card"]'), 'Subscription card is not visible').toBeVisible();
        await channelMainPage.purhcaseMembershipFromMembershipPageMockPayment();
    });

    await test.step('Mock API response with Expired payment status and verify', async () => {
        const myPaidSubsPage = new MyPaidSubsPage(page);

        await page.route(
            (url) => url.toString().includes('/api/paid-subscriptions/my'),
            async (route) => {
                const response = await route.fetch();
                const json = await response.json();

                if (json.data?.items && Array.isArray(json.data.items)) {
                    json.data.items = json.data.items.map((sub: Record<string, unknown>) => ({
                        ...sub,
                        status: 'Expired payment',
                        isActive: false,
                    }));
                }

                await route.fulfill({ response, json });
            },
        );

        await page.goto('/my-paid-subs', { waitUntil: 'domcontentloaded' });
        await myPaidSubsPage.assertPageLoaded();
        await myPaidSubsPage.assertSubscriptionVisible();
        await myPaidSubsPage.assertStatus('Expired payment');
    });
});
