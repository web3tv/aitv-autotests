import { test, expect } from '@playwright/test';
import { ChannelMainPage } from '../../src/pages/channel/ChannelMainPage';
import { AuthPopupPage } from '../../src/pages/components/AuthPopupPage';
import { setupVideoViaApi, VideoSetupResult } from '../../src/utils/studioTestHelpers';

test.describe('Authorization popup on paid subscription', () => {
    let setup: VideoSetupResult;

    test.beforeAll(async ({ request }) => {
        setup = await setupVideoViaApi(request, { privacySetting: 'paid' });
    });

    test('Anonymous user sees Subscribe Now button on membership page', {
        annotation: { type: 'TC', description: 'AUTH-POP-007' },
    }, async ({ page }) => {
        const channelMainPage = new ChannelMainPage(page);

        await test.step('Open paid video page as anonymous', async () => {
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
        });

        await test.step('Verify subscription card is visible with correct details', async () => {
            await channelMainPage.assertSubscriptionCardVisible(setup.membershipName!, setup.membershipDescription!);
        });

        await test.step('Verify Subscribe Now button is visible for anonymous user', async () => {
            await channelMainPage.checkButtonSubscribeNow();
        });
    });

    test('Anonymous user clicking Subscribe Now sees auth popup with Create account and Login', {
        annotation: { type: 'TC', description: 'AUTH-POP-008' },
    }, async ({ page }) => {
        const channelMainPage = new ChannelMainPage(page);
        const authPopup = new AuthPopupPage(page);

        await test.step('Open paid video page as anonymous', async () => {
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
        });

        await test.step('Click Subscribe Now button', async () => {
            await channelMainPage.clickButtonSubscribeNow();
        });

        await test.step('Verify auth popup appears with correct content', async () => {
            await authPopup.assertPopupVisible();
        });

        await test.step('Verify Create account button is visible', async () => {
            await expect(authPopup.createAccountBtn, 'Create account button is not visible').toBeVisible();
        });

        await test.step('Verify Login button is visible', async () => {
            await expect(authPopup.loginBtn, 'Login button is not visible').toBeVisible();
        });
    });

    test.fixme('Auth popup Create account button navigates to register page', {
        annotation: { type: 'TC', description: 'AUTH-POP-009' },
    }, async ({ page }) => {
        const channelMainPage = new ChannelMainPage(page);
        const authPopup = new AuthPopupPage(page);

        await test.step('Open paid video page and click Subscribe Now', async () => {
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.clickButtonSubscribeNow();
        });

        await test.step('Click Create account and verify navigation to register', async () => {
            await authPopup.assertPopupVisible();
            await authPopup.clickCreateAccount();
            await expect(page, 'Page should navigate to /register').toHaveURL(/\/register/, { timeout: 10_000 });
        });
    });

    test.fixme('Auth popup Login button navigates to login page', {
        annotation: { type: 'TC', description: 'AUTH-POP-010' },
    }, async ({ page }) => {
        const channelMainPage = new ChannelMainPage(page);
        const authPopup = new AuthPopupPage(page);

        await test.step('Open paid video page and click Subscribe Now', async () => {
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.clickButtonSubscribeNow();
        });

        await test.step('Click Login and verify navigation to login page', async () => {
            await authPopup.assertPopupVisible();
            await authPopup.clickLogin();
            await expect(page, 'Page should navigate to /login').toHaveURL(/\/login/, { timeout: 10_000 });
        });
    });

    test.fixme('Auth popup closes when clicking close button', {
        annotation: { type: 'TC', description: 'AUTH-POP-011' },
    }, async ({ page }) => {
        const channelMainPage = new ChannelMainPage(page);
        const authPopup = new AuthPopupPage(page);

        await test.step('Open paid video page and click Subscribe Now', async () => {
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await channelMainPage.waitForMembershipPage();
            await channelMainPage.clickButtonSubscribeNow();
        });

        await test.step('Verify popup is open', async () => {
            await authPopup.assertPopupVisible();
        });

        await test.step('Close popup and verify it disappears', async () => {
            await authPopup.closePopup();
        });

        await test.step('Verify user stays on the same page', async () => {
            await expect(page, 'Page URL should contain channel username after popup close').toHaveURL(
                new RegExp(setup.user.username), { timeout: 5_000 }
            );
        });
    });
});

test.describe('Authorization popup on free subscription', () => {
    test('Anonymous user clicking Subscribe on channel sees auth popup', {
        annotation: { type: 'TC', description: 'AUTH-POP-012' },
    }, async ({ page, request }) => {
        const setup = await setupVideoViaApi(request, { privacySetting: 'public' });
        const channelMainPage = new ChannelMainPage(page);
        const authPopup = new AuthPopupPage(page);

        await test.step('Open public channel page as anonymous', async () => {
            await page.goto(setup.channelUrl, { waitUntil: 'domcontentloaded' });
        });

        await test.step('Click free Subscribe button', async () => {
            await expect(channelMainPage.channelSubscribeBtn, 'Subscribe button is not visible').toBeVisible();
            await expect(channelMainPage.channelSubscribeBtn, 'Subscribe button is not enabled').toBeEnabled();
            await channelMainPage.channelSubscribeBtn.click();
        });

        await test.step('Verify auth popup appears', async () => {
            await authPopup.assertPopupVisible();
        });
    });
});
