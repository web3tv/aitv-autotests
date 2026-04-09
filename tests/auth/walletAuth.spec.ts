import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { MailTmHelper } from '../../src/utils/mailTmHelper';
import { AccountPage } from '../../src/pages/account/AccountPage';
import { AuthApi } from '../../src/api/AuthApi';
import { HeaderPage } from '../../src/pages/components/HeaderPage';
import { LoginPage } from '../../src/pages/auth/LoginPage';
import { injectEthereumMock } from '../../src/utils/walletMock';


test.describe('Wallet auth tests', () => {

  test('Register user via Web3 wallet (MetaMask)', { annotation: { type: 'TC', description: 'AUTH-012' } }, async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.walletRegisterSuccess();
  });

  test('Register via wallet, then login with the same wallet', { annotation: { type: 'TC', description: 'AUTH-013' } }, async ({ page }) => {
    const authFlow = new AuthFlow(page);
    let wallet: import('../../src/utils/walletMock').WalletInfo;
    let username: string;

    await test.step('Register with a new wallet', async () => {
      const result = await authFlow.walletRegisterSuccess();
      wallet = result.wallet;
      username = result.username;
    });

    await test.step('Logout', async () => {
      await authFlow.logout();
    });

    await test.step('Login with the same wallet', async () => {
      await authFlow.walletLoginSuccess({ skipInjection: true, wallet, skipModalCheck: true });
    });

    await test.step('Verify logged in as the same user', async () => {
      await authFlow.assertLoggedInAs(username);
    });
  });

  test('Login via Web3 wallet (MetaMask)', { tag: '@critical', annotation: { type: 'TC', description: 'AUTH-009' } }, async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.walletLoginSuccess();
  });

  test('Display wallet address on account page', { annotation: { type: 'TC', description: 'ACCOUNT-003' } }, async ({ page }) => {
    const authFlow = new AuthFlow(page);
    const accountPage = new AccountPage(page);
    let walletAddress: string;

    await test.step('Register via wallet', async () => {
      const result = await authFlow.walletRegisterSuccess();
      walletAddress = result.wallet.address;
    });

    await test.step('Navigate to account page and verify wallet address', async () => {
      await page.goto('/account', { waitUntil: 'domcontentloaded' });
      await accountPage.assertDisplayedWalletAddress(walletAddress);
    });
  });

  test('Add wallet to email account', { annotation: { type: 'TC', description: 'ACCOUNT-005' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const headerPage = new HeaderPage(page);
    const loginPage = new LoginPage(page);

    await test.step('Create user via API and login', async () => {
      const user = await authApi.createAndVerifyUser();
      await injectEthereumMock(page);
      await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Verify Add wallet button is visible in header', async () => {
      await expect(headerPage.addWalletBtn, 'Add wallet button is not visible in header').toBeVisible();
    });

    await test.step('Click Add wallet and connect MetaMask', async () => {
      await headerPage.addWalletBtn.click();
      await expect(loginPage.metamaskOption, 'MetaMask option is not visible in wallet modal').toBeVisible();
      await loginPage.metamaskOption.click();
    });

    await test.step('Verify wallet connected — Add wallet button disappears', async () => {
      await expect(headerPage.addWalletBtn, 'Add wallet button should disappear after connecting').toBeHidden({ timeout: 10_000 });
    });
  });

  test.fixme('Add email to wallet account twice without verification', { annotation: { type: 'TC', description: 'AUTH-016' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const accountPage = new AccountPage(page);

    await test.step('Login via wallet', async () => {
      await authFlow.walletLoginSuccess();
    });

    await test.step('Add first email without verification', async () => {
      const mailTmHelper = new MailTmHelper(request);
      const firstEmail = await mailTmHelper.generateEmail();
      await mailTmHelper.createMailbox();

      await page.goto('/account', { waitUntil: 'domcontentloaded' });
      await accountPage.clickAddEmailBtn();
      const addEmailInput = page.getByRole('textbox', { name: 'Enter email' });
      await expect(addEmailInput, 'Add email input is not visible').toBeVisible();
      await addEmailInput.fill(firstEmail);
      await accountPage.clickSubmitBtn();
    });

    await test.step('Add second email immediately without verifying first', async () => {
      const mailTmHelper2 = new MailTmHelper(request);
      const secondEmail = await mailTmHelper2.generateEmail();
      await mailTmHelper2.createMailbox();

      await accountPage.clickAddEmailBtn();
      const addEmailInput = page.getByRole('textbox', { name: 'Enter email' });
      await expect(addEmailInput, 'Add email input is not visible').toBeVisible();
      await addEmailInput.fill(secondEmail);
      await accountPage.clickSubmitBtn();
    });

    await test.step('Verify second email and confirm it is active', async () => {
      const mailTmHelper2 = new MailTmHelper(request);
      const secondEmail = await mailTmHelper2.generateEmail();
      await mailTmHelper2.createMailbox();
      const mailToken = await mailTmHelper2.getToken(secondEmail, mailTmHelper2['password']);

      const messageId = await mailTmHelper2.waitForMessage(mailToken, 'Email Verification');
      const verificationUrl = await mailTmHelper2.extractVerificationUrl(messageId, mailToken);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({ timeout: 40_000 });
    });
  });

  test('Add email to wallet account', { annotation: { type: 'TC', description: 'AUTH-011' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const accountPage = new AccountPage(page);
    const mailTmHelper = new MailTmHelper(request);
    let email: string;
    let mailToken: string;

    await test.step('Create disposable email', async () => {
      email = await mailTmHelper.generateEmail();
      await mailTmHelper.createMailbox();
      mailToken = await mailTmHelper.getToken(email, mailTmHelper['password']);
    });

    await test.step('Login via wallet', async () => {
      await authFlow.walletLoginSuccess();
    });

    await test.step('Navigate to account settings and add email', async () => {
      await page.goto('/account', { waitUntil: 'domcontentloaded' });
      await accountPage.clickAddEmailBtn();
      const addEmailInput = page.getByRole('textbox', { name: 'Enter email' });
      await expect(addEmailInput, 'Add email input is not visible').toBeVisible();
      await addEmailInput.fill(email);
      await accountPage.clickSubmitBtn();
    });

    await test.step('Verify email via mail.tm', async () => {
      const messageId = await mailTmHelper.waitForMessage(mailToken, 'Email Verification');
      const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, mailToken);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({ timeout: 40_000 });
    });
  });

});
