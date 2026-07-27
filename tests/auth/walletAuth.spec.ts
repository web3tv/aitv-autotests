import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { createMailHelper, createMailFlows } from '../../src/utils/mailHelper';
import { SecurityPage } from '../../src/pages/account/SecurityPage';
import { HeaderPage } from '../../src/pages/components/HeaderPage';
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
    const securityPage = new SecurityPage(page);
    let walletAddress: string;

    await test.step('Register via wallet', async () => {
      const result = await authFlow.walletRegisterSuccess();
      walletAddress = result.wallet.address;
    });

    await test.step('Navigate to account page and verify wallet address', async () => {
      await page.goto('/account', { waitUntil: 'domcontentloaded' });
      await securityPage.assertDisplayedWalletAddress(walletAddress);
    });
  });

});

test.describe('Wallet and email tests',()=>{

  // BLOCKED by W3-2809: adding a wallet from /account fails with "Error verifying address" —
  // the wallet is never linked, so addWalletFromAccountSuccess times out on /api/auth/add-wallet.
  // https://stretch-com.atlassian.net/browse/W3-2809
  test.fixme('Add wallet to email account', { annotation: { type: 'TC', description: 'ACCOUNT-005' } }, async ({ page, request }) => {
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

  // BLOCKED by W3-2852: an email must NOT be attached before its verification link is clicked,
  // but the backend applies a wallet account's first email right away on PUT /api/account/email
  // (UserManager::updateEmail sets it immediately when the user has no email yet), so the FE
  // shows the "Email changed" modal with no link click and the address gets occupied without
  // proving mailbox ownership. The steps below codify that current (buggy) flow as observed on
  // dev2 27.07.2026 — kept green for reference; once W3-2852 is fixed, rework the test: after
  // submit the email must stay unassigned until the letter link is visited.
  // https://stretch-com.atlassian.net/browse/W3-2852
  test.fixme('Add email to wallet account applies immediately without verification', { annotation: { type: 'TC', description: 'AUTH-016' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const mailHelper = createMailHelper(request);
    const mailFlows = createMailFlows(request);
    let email: string;
    let mailToken: string;
    let verificationUrl: string;

    await test.step('Register via wallet', async () => {
      await authFlow.walletRegisterSuccess();
    });

    await test.step('Add email to the wallet account', async () => {
      email = mailHelper.generateEmail();
      mailToken = await mailHelper.getToken(email);

      await page.goto('/account', { waitUntil: 'domcontentloaded' });
      await securityPage.clickAddEmailBtn();
      await securityPage.fillAndSubmitAddEmail(email);
    });

    await test.step('"Email changed" modal appears on its own — email applied without a link click', async () => {
      await securityPage.waitForEmailChangedModal();
    });

    await test.step('No second add possible: email row is filled, controls are locked', async () => {
      await expect(securityPage.addEmailRow, 'Add email row must be gone once the email is applied').toBeHidden();
      await securityPage.assertDisplayedEmail(email);
      await expect(securityPage.changeEmailBtn, 'Change email must be locked until re-login').toBeDisabled();
    });

    await test.step('The verification letter still arrives — save its link', async () => {
      verificationUrl = await mailFlows.emailChangeUrl(mailToken);
    });

    await test.step('Sign In in the modal logs the user out', async () => {
      const headerPage = new HeaderPage(page);
      await securityPage.clickEmailChangedSignIn();
      // The deployed build redirects to the home page (not /login) with the session dropped.
      await expect(page, 'Did not leave the account page after Sign In').not.toHaveURL(/\/account/, { timeout: 15_000 });
      await expect(headerPage.loginBtn, 'User is not logged out after Sign In click').toBeVisible({ timeout: 15_000 });
    });

    await test.step('The letter link opens the "Email changed" window', async () => {
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email changed/i)).toBeVisible({ timeout: 40_000 });
    });
  });

  // Guards the EXPECTED behaviour behind W3-2852 (AUTH-016 above codifies the current buggy
  // flow): an email added to a wallet account must stay unattached and unoccupied until its
  // verification link is clicked — whoami keeps email=null, emails/check reports the address
  // as free and another user can still register with it. Un-fixme once W3-2852 is fixed
  // (and rework AUTH-016 at the same time).
  // https://stretch-com.atlassian.net/browse/W3-2852
  test.fixme('Unverified email added to wallet account is not attached and stays free', { annotation: { type: 'TC', description: 'AUTH-020' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const mailHelper = createMailHelper(request);
    let email: string;

    await test.step('Register via wallet', async () => {
      await authFlow.walletRegisterSuccess();
    });

    await test.step('Add email to the wallet account without confirming it', async () => {
      email = mailHelper.generateEmail();
      await page.goto('/account', { waitUntil: 'domcontentloaded' });
      await securityPage.clickAddEmailBtn();
      const putPromise = page.waitForResponse(
        r => r.url().includes('/api/account/email') && r.request().method() === 'PUT',
        { timeout: 15000 }
      );
      await securityPage.fillAndSubmitAddEmail(email);
      const putResponse = await putPromise;
      expect(putResponse.ok(), 'PUT /api/account/email should succeed').toBeTruthy();
    });

    await test.step('Email is NOT attached while unconfirmed', async () => {
      // The buggy flow attaches the email and pops the modal ~5 s after the PUT (FE profile
      // polling), so give it that window before asserting nothing happened.
      await page.waitForTimeout(8_000);
      await expect(securityPage.emailChangedModal, '"Email changed" modal must not appear before the link is clicked').toBeHidden();
      const whoami = await page.request.get('/api/users/whoami');
      expect(whoami.status(), 'whoami should return 200').toBe(200);
      const { data } = await whoami.json();
      expect(data.email, 'whoami must not return the email before verification').toBeNull();
    });

    await test.step('Address is not occupied while unconfirmed', async () => {
      const check = await page.request.get(`/api/emails/check?email=${encodeURIComponent(email)}`);
      expect(check.status(), 'emails/check should return 200').toBe(200);
      expect(await check.json(), 'Unconfirmed email must not be reported as existing').toMatchObject({ isExist: false });
    });

    await test.step('Another user can register with this email', async () => {
      const authApi = new AuthApi(request);
      const { username } = await authApi.createAndVerifyUser(email);
      expect(username, 'Registration with the unconfirmed email must succeed').toBeTruthy();
    });
  });

  test('Add email to wallet account', { annotation: { type: 'TC', description: 'AUTH-011' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
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
      await securityPage.clickAddEmailBtn();
      await securityPage.fillAndSubmitAddEmail(email);
    });

    await test.step('Verify email via Gmail', async () => {
      const verificationUrl = await createMailFlows(request).emailChangeUrl(mailToken);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email changed/i)).toBeVisible({ timeout: 40_000 });
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