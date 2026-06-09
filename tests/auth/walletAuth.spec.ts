import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { MailTmHelper } from '../../src/utils/mailTmHelper';
import { AccountPage } from '../../src/pages/account/AccountPage';
import { AuthApi } from '../../src/api/AuthApi';
import { HeaderPage } from '../../src/pages/components/HeaderPage';
import { LoginPage } from '../../src/pages/auth/LoginPage';
import { injectEthereumMock, WALLET_PROVIDERS, type EvmWalletType, type WalletInfo } from '../../src/utils/walletMock';


test.describe.configure({ mode: 'parallel' });

test.describe('Wallet auth tests', () => {

  test('Register user via wallet (MetaMask) -> Success', { annotation: { type: 'TC', description: 'AUTH-012' } }, async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.walletRegisterSuccess();
  });

  test('Login as existing wallet -> Success login', { annotation: { type: 'TC', description: 'AUTH-013' } }, async ({ page }) => {
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

});

test.describe('Wallet and email tests',()=>{

  //There is no 'Add Wallet' button in header
  test.skip('Add wallet to email account', { annotation: { type: 'TC', description: 'ACCOUNT-005' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const headerPage = new HeaderPage(page);
    const loginPage = new LoginPage(page);

    await test.step('Create user via API and login', async () => {
      const user = await authApi.createUserFast();
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

  test('Add email to wallet account twice without verification', { annotation: { type: 'TC', description: 'AUTH-016' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const accountPage = new AccountPage(page);
    let firstVerificationUrl: string;
    let secondVerificationUrl: string;

    await test.step('Register via wallet', async () => {
      await authFlow.walletRegisterSuccess();
    });

    await test.step('Add first email and save verification URL', async () => {
      const mailHelper1 = new MailTmHelper(request);
      const firstEmail = await mailHelper1.generateEmail();
      await mailHelper1.createMailbox();
      const firstToken = await mailHelper1.getToken(firstEmail, mailHelper1['password']);

      await page.goto('/account', { waitUntil: 'domcontentloaded' });
      await accountPage.clickAddEmailBtn();
      const addEmailInput = page.getByRole('textbox', { name: 'Enter email' });
      await expect(addEmailInput, 'Add email input is not visible').toBeVisible();
      await addEmailInput.fill(firstEmail);
      await accountPage.clickSubmitBtn();

      const messageId = await mailHelper1.waitForMessage(firstToken, 'Email Verification');
      firstVerificationUrl = await mailHelper1.extractVerificationUrl(messageId, firstToken);
    });

    await test.step('Add second email and save verification URL', async () => {
      const mailHelper2 = new MailTmHelper(request);
      const secondEmail = await mailHelper2.generateEmail();
      await mailHelper2.createMailbox();
      const secondToken = await mailHelper2.getToken(secondEmail, mailHelper2['password']);

      await accountPage.clickAddEmailBtn();
      const addEmailInput = page.getByRole('textbox', { name: 'Enter email' });
      await expect(addEmailInput, 'Add email input is not visible').toBeVisible();
      await addEmailInput.fill(secondEmail);
      await accountPage.clickSubmitBtn();

      const messageId = await mailHelper2.waitForMessage(secondToken, 'Email Verification');
      secondVerificationUrl = await mailHelper2.extractVerificationUrl(messageId, secondToken);
    });

    await test.step('Verify second email — expect success', async () => {
      await page.goto(secondVerificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({ timeout: 40_000 });
    });

    await test.step('Visit first verification link — expect expired error', async () => {
      await page.goto(firstVerificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/This verification link has expired or is no longer valid/i)).toBeVisible({ timeout: 10_000 });
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

    await test.step('Register via wallet', async () => {
      await authFlow.walletRegisterSuccess();
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
})


test.describe.skip('Check all wallets login',()=>{

  const wallets = (Object.keys(WALLET_PROVIDERS) as EvmWalletType[]).map(type => ({
    type,
    label: WALLET_PROVIDERS[type].name,
  }));

  for (const w of wallets) {
    test(`Register and login via ${w.label}`, { annotation: { type: 'TC', description: `SMOKE-WALLET-${w.type}` } }, async ({ page }) => {
      const authFlow = new AuthFlow(page);
      let wallet: WalletInfo;

      await test.step('Register wallet account', async () => {
        const result = await authFlow.walletRegisterSuccess({ walletType: w.type });
        wallet = result.wallet;
      });

      await test.step('Logout', async () => {
        await authFlow.logout();
      });

      await test.step('Login with registered wallet — verify siwe-login returns 200', async () => {
        await authFlow.walletLoginSuccess({ walletType: w.type, wallet, skipInjection: true, skipModalCheck: true });
      });
    });
  }

});