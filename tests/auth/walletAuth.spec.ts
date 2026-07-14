import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { createMailHelper, createMailFlows } from '../../src/utils/mailHelper';
import { AccountPage } from '../../src/pages/account/AccountPage';
import { AuthApi } from '../../src/api/AuthApi';
import { injectEthereumMock, WALLET_PROVIDERS, type EvmWalletType, type WalletInfo } from '../../src/utils/walletMock';


test.describe.configure({ mode: 'parallel' });

test.describe('Wallet auth tests', () => {

  test('Register user via wallet (MetaMask) -> Success', { tag: '@critical', annotation: { type: 'TC', description: 'AUTH-012' } }, async ({ page }) => {
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

  test('Add wallet to email account', { annotation: { type: 'TC', description: 'ACCOUNT-005' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    let wallet: WalletInfo;

    await test.step('Create user via API, inject wallet mock and login', async () => {
      const user = await authApi.createUserFast();
      wallet = await injectEthereumMock(page);
      await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Add wallet from account page and verify it is linked', async () => {
      await authFlow.addWalletFromAccountSuccess({ wallet, skipInjection: true });
    });
  });

  // BLOCKED by W3-2730: email verification link / mail delivery — the 2nd added email's
  // "Your verification link" message is not delivered to the new address (misrouted), so the
  // "Add second email" step times out waiting for it. Same root cause as ACCOUNT-008.
  // https://stretch-com.atlassian.net/browse/W3-2730
  test.fixme('Add email to wallet account twice without verification', { annotation: { type: 'TC', description: 'AUTH-016' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const accountPage = new AccountPage(page);
    let firstVerificationUrl: string;
    let secondVerificationUrl: string;

    await test.step('Register via wallet', async () => {
      await authFlow.walletRegisterSuccess();
    });

    await test.step('Add first email and save verification URL', async () => {
      const mailHelper1 = createMailHelper(request);
      const mailFlows1 = createMailFlows(request);
      const firstEmail = await mailHelper1.generateEmail();
      const firstToken = await mailHelper1.getToken(firstEmail);

      await page.goto('/account', { waitUntil: 'domcontentloaded' });
      await accountPage.clickAddEmailBtn();
      const addEmailInput = page.getByRole('textbox', { name: 'Enter email' });
      await expect(addEmailInput, 'Add email input is not visible').toBeVisible();
      await addEmailInput.fill(firstEmail);
      await accountPage.clickSubmitBtn();

      firstVerificationUrl = await mailFlows1.emailChangeUrl(firstToken);
    });

    await test.step('Add second email and save verification URL', async () => {
      const mailHelper2 = createMailHelper(request);
      const mailFlows2 = createMailFlows(request);
      const secondEmail = await mailHelper2.generateEmail();
      const secondToken = await mailHelper2.getToken(secondEmail);

      await accountPage.clickAddEmailBtn();
      const addEmailInput = page.getByRole('textbox', { name: 'Enter email' });
      await expect(addEmailInput, 'Add email input is not visible').toBeVisible();
      await addEmailInput.fill(secondEmail);
      await accountPage.clickSubmitBtn();

      secondVerificationUrl = await mailFlows2.emailChangeUrl(secondToken);
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
    const mailHelper = createMailHelper(request);
    let email: string;
    let mailToken: string;

    await test.step('Create disposable email', async () => {
      email = await mailHelper.generateEmail();
      await mailHelper.createMailbox();
      mailToken = await mailHelper.getToken(email);
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

    await test.step('Verify email via Gmail', async () => {
      const verificationUrl = await createMailFlows(request).emailChangeUrl(mailToken);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({ timeout: 40_000 });
    });
  });
})


test.describe('Check all wallets login',()=>{

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