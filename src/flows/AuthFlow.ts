import { HeaderPage } from "../pages/components/HeaderPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { UserDropdownPage } from "../pages/components/UserDropdownPage";
import { expect } from '@playwright/test';
import { Page } from '@playwright/test';
import { MailTmHelper } from "../utils/mailTmHelper";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { injectEthereumMock, type WalletInfo, type EvmWalletType } from "../utils/walletMock";


export class AuthFlow {

  readonly loginPage: LoginPage;
  readonly resetPasswordPage: ResetPasswordPage;
  readonly headerPage: HeaderPage;
  readonly userDropdownPage: UserDropdownPage;
  readonly forgotPasswordPage: ForgotPasswordPage;

  constructor(public page: Page) {
    this.loginPage = new LoginPage(page);
    this.resetPasswordPage = new ResetPasswordPage(page);
    this.headerPage = new HeaderPage(page);
    this.userDropdownPage = new UserDropdownPage(page);
    this.forgotPasswordPage = new ForgotPasswordPage(page);
  }

  async loginSuccess (email:string,password:string,username:string,device?: 'mobile' | 'desktop') {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await this.loginPage.page.waitForURL('/')
    await this.loginPage.page.waitForResponse('/api/users/whoami',{timeout:40_000})
    if (device === 'mobile') {
      await expect(this.loginPage.page.locator('[data-id="user-avatar"]')).toBeVisible();
    }
    else{
      await this.assertLoggedInAs(username);
    }
  }

  async loginFailed (email:string,password:string,device?: 'mobile' | 'desktop') {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await this.page.waitForResponse((response) =>
            response.url().includes('/api/auth/login') &&
            response.status() === 400,
            { timeout: 40000 }
        );
    await expect(this.page.locator('form')).toContainText('Invalid password. Please re-enter another password.');
  }

  async loginWith2FaFailed(email:string,password:string){
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await expect(this.page.locator('body')).toContainText('To ensure your identity, we`ve sent a verification code to your email. Please enter the code below to proceed.');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill('2');
    await this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/check') &&
            res.status() === 403
        );
    await expect(this.page.locator('body')).toContainText('Error code. Check your code on email and try again.');
  }

  async loginWith2FaSuccess(email:string,password:string,token:string,username:string){
    const mailTmHelper = new MailTmHelper(this.page.request);
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    const requestedAt = Date.now();
    await this.loginPage.clickLoginBtn();
    await expect(this.page.locator('body')).toContainText('To ensure your identity, we`ve sent a verification code to your email. Please enter the code below to proceed.');
    const messageId = await mailTmHelper.waitForMessage(token, 'Authentication Code', 10, 3000, requestedAt);
    const [d1, d2, d3, d4] = await mailTmHelper.extract2FACode(messageId,token);
    console.log(`Extracted 2FA code: ${d1}${d2}${d3}${d4}`);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill(d1);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill(d2);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill(d3);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill(d4);
    await this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/check') &&
            res.status() === 200
        );
    await this.assertLoggedInAs(username);
  }

  async submitForgotPasswordRequest(email: string) {
    await this.loginPage.visitLoginPage();
    await this.forgotPasswordPage.openForm();
    await this.forgotPasswordPage.fillEmail(email);
    await this.forgotPasswordPage.submitRequest();
  }

  async prepareResetPasswordForm(resetUrl: string) {
    await this.page.goto(resetUrl, { waitUntil: 'networkidle' });
    await this.resetPasswordPage.verifyPasswordFieldsVisible();
    await this.resetPasswordPage.verifyPasswordFieldsEditable();
  }

  async completePasswordReset(newPassword: string) {
    await this.resetPasswordPage.resetPassword(newPassword);
    return this.waitForResetPasswordResponse();
  }

  private async waitForResetPasswordResponse() {
    const [response] = await Promise.all([
      this.page.waitForResponse(res =>
        res.url().includes('/api/auth/update-password') &&
        res.request().method() === 'POST'
      ),
      this.resetPasswordPage.clickChangePasswordBtn()
    ]);
    return response.status();
  }

  async fillResetPasswordWithMismatch(password: string, confirmPassword: string) {
    await this.resetPasswordPage.fillPasswordsWithMismatch(password, confirmPassword);
  }

  async assertResetPasswordMismatchState(password: string, confirmPassword: string) {
    await this.resetPasswordPage.verifyPasswordValue(password);
    await this.resetPasswordPage.verifyConfirmPasswordValue(confirmPassword);
    await this.resetPasswordPage.verifyChangePasswordBtnDisabled();
  }

  async passwordError (email:string,password:string) {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await expect(this.loginPage.page.locator('form')).toContainText('Invalid password. Please re-enter another password.');
    expect(this.loginPage.page.waitForURL('/login'));
  }

  async usernameError (email:string, password:string) {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.removeFocusFromElement();
    await expect(this.loginPage.page.locator('form')).toContainText('Username not found. Try another one.');
    expect(this.loginPage.page.waitForURL('/login'));
  }

  /**
   * Login via MetaMask wallet.
   * Injects a mock window.ethereum provider with real signing, then performs the wallet login flow.
   * Returns the wallet info (address, privateKey) for assertions or further use.
   */
  async walletLoginSuccess(options?: { wallet?: WalletInfo; skipInjection?: boolean; skipModalCheck?: boolean; walletType?: EvmWalletType }): Promise<WalletInfo> {
    const walletType = options?.walletType ?? 'metamask';
    // Inject mock BEFORE navigating to the login page (skip if already injected in this page context)
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    await this.loginPage.visitLoginPage();
    await this.loginPage.clickWalletLoginBtn();

    const siweResponse = this.page.waitForResponse(
      r => r.url().includes('/api/auth/siwe-login'),
      { timeout: 15_000 }
    );
    await this.loginPage.clickWalletOption(walletType);
    const siweRes = await siweResponse;
    expect(siweRes.status(), `SIWE login returned ${siweRes.status()}`).toBe(200);

    // Wait for wallet auth to complete — backend verifies signature and redirects
    // URL may include query params like ?showPopup=true
    await this.page.waitForURL((url) => url.pathname === '/');
    await this.page.waitForResponse(
      (res) => res.url().includes('/api/users/whoami') && res.status() === 200,
      { timeout: 40_000 }
    );

    if (!options?.skipModalCheck) {
      // Assert the "set up alternative login method" modal (only appears on first wallet login)
      const addEmailModal = this.page.locator('[data-id="add-email-modal"]');
      await expect(addEmailModal, 'Add email modal is not visible after wallet login').toBeVisible({ timeout: 10_000 });
      await expect(addEmailModal, 'Add email modal text is incorrect').toContainText(
        'To recover your profile and set up an alternative login method, you can add an email address and password in your account settings.'
      );
      await expect(this.page.getByRole('button', { name: 'Cancel' }), 'Cancel button is not visible').toBeVisible();
      await expect(this.page.locator('[data-id="open-settings"]'), 'Open Settings button is not visible').toBeVisible();

      // Dismiss modal
      await this.page.getByRole('button', { name: 'Cancel' }).click();
    }

    await expect(this.headerPage.userIcon, 'Profile button is not visible').toBeVisible();

    return wallet;
  }

  /**
   * Auto-register a new user via wallet on the LOGIN page.
   * Flow: siwe-login returns 400 (user not found) → frontend auto-calls siwe-register (201).
   * Returns the wallet info for assertions or further use.
   */
  async walletAutoRegisterOnLogin(options?: { wallet?: WalletInfo; skipInjection?: boolean; walletType?: EvmWalletType }): Promise<WalletInfo> {
    const walletType = options?.walletType ?? 'metamask';
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    await this.loginPage.visitLoginPage();
    await this.loginPage.clickWalletLoginBtn();

    // Register both promises BEFORE the click to avoid race conditions
    const siweLoginResponse = this.page.waitForResponse(
      r => r.url().includes('/api/auth/siwe-login'),
      { timeout: 15_000 }
    );
    const siweRegisterResponse = this.page.waitForResponse(
      r => r.url().includes('/api/auth/siwe-register'),
      { timeout: 15_000 }
    );

    await this.loginPage.clickWalletOption(walletType);

    const loginRes = await siweLoginResponse;
    expect(loginRes.status(), `Expected siwe-login to return 400 for unregistered wallet, got ${loginRes.status()}`).toBe(400);

    const registerRes = await siweRegisterResponse;
    expect(registerRes.status(), `siwe-register failed with ${registerRes.status()}`).toBe(201);

    await this.page.waitForURL((url) => url.pathname === '/');
    // await this.page.waitForResponse(
    //   (res) => res.url().includes('/api/users/whoami') && res.status() === 200,
    //   { timeout: 40_000 }
    // );

    await expect(this.headerPage.userIcon, 'Profile button is not visible after auto-register via login').toBeVisible();

    return wallet;
  }

  /**
   * Register a new user via MetaMask wallet.
   * Injects a mock window.ethereum provider, navigates to /register,
   * fills username + checkbox, then connects wallet via MetaMask.
   * Returns the wallet info and generated username.
   */
  async walletRegisterSuccess(options?: { wallet?: WalletInfo; skipInjection?: boolean; walletType?: EvmWalletType }): Promise<{ wallet: WalletInfo; username: string }> {
    const walletType = options?.walletType ?? 'metamask';
    // Inject mock BEFORE navigating to the register page (skip if already injected in this page context)
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');

    const username = await this.loginPage.fillUsernameInput();
    await this.loginPage.clickCheckbox();
    await this.loginPage.clickRegisterWalletBtn();
    await this.loginPage.clickWalletOption(walletType);

    // Wait for wallet auth to complete — backend verifies signature and redirects
    await this.page.waitForURL((url) => url.pathname === '/');
    // await this.page.waitForResponse(
    //   (res) => res.url().includes('/api/users/whoami') && res.status() === 200,
    //   { timeout: 40_000 }
    // );

    // Assert the "set up alternative login method" modal
    const addEmailModal = this.page.locator('[data-id="add-email-modal"]');
    await expect(addEmailModal, 'Add email modal is not visible after wallet registration').toBeVisible({ timeout: 10_000 });
    await expect(addEmailModal, 'Add email modal text is incorrect').toContainText(
      'To recover your profile and set up an alternative login method, you can add an email address and password in your account settings.'
    );
    await expect(this.page.getByRole('button', { name: 'Cancel' }), 'Cancel button is not visible').toBeVisible();
    await expect(this.page.locator('[data-id="open-settings"]'), 'Open Settings button is not visible').toBeVisible();

    // Dismiss modal
    await this.page.getByRole('button', { name: 'Cancel' }).click();

    await this.assertLoggedInAs(username);

    return { wallet, username };
  }

  /**
   * Assert the currently logged-in user by opening the profile dropdown
   * and verifying the @username displayed inside it.
   */
  async assertLoggedInAs(username: string) {
    await expect(this.headerPage.userIcon, 'Profile button is not visible').toBeVisible();
    await this.headerPage.clickUserIcon();
    await expect(this.userDropdownPage.dropdown, 'Profile dropdown is not visible').toBeVisible();
    await expect(this.userDropdownPage.dropdown, `Expected @${username} in profile dropdown`).toContainText(`@${username}`);
    // Close dropdown to avoid blocking subsequent interactions
    await this.page.keyboard.press('Escape');
    await expect(this.userDropdownPage.dropdown).toBeHidden();
  }

  /**
   * Login via Telegram with API-level mock.
   * Intercepts the Telegram OAuth redirect, social login API, and whoami
   * to simulate a successful Telegram login without real Telegram credentials.
   */
  async telegramLoginSuccess(user: { email: string; username: string }): Promise<void> {
    const baseUrl = process.env.BASE_URL!;

    // Mock: intercept Telegram OAuth redirect → return page that redirects to callback with mock token
    await this.page.route('**/oauth.telegram.org/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><script>window.location.href = "${baseUrl}/login#tgAuthResult=mock_tg_token";</script></html>`,
      });
    });

    // Flag to enable whoami mock only after social login succeeds
    let authenticated = false;

    // Mock: intercept social login API → return success and enable whoami mock
    await this.page.route('**/auth/login/social', async route => {
      if (route.request().method() === 'POST') {
        authenticated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { cookie: 'mock_session', requiredEmail2fa: false, success: true },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock: intercept whoami → return user data only after authentication
    await this.page.route('**/users/whoami', async route => {
      if (authenticated) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'mock-tg-user-id',
              username: user.username,
              email: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              profile: {
                biography: '',
                socials: { facebookUrl: '', twitterUsername: '', instagramUsername: '', tiktokUsername: '' },
              },
              thumbnails: null,
              isEmailAuthEnabled: false,
              state: 'verified',
              hasAccessKey: false,
              hasVerifiedEmail: true,
              roles: ['ROLE_USER_VERIFIED'],
              channel: { id: 'mock-channel-id', name: user.username, handleName: user.username },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await this.loginPage.visitLoginPage();
    await expect(this.loginPage.telegramLoginBtn, 'Telegram login button is not visible').toBeVisible();
    await expect(this.loginPage.telegramLoginBtn, 'Telegram login button is not enabled').toBeEnabled();
    await this.loginPage.telegramLoginBtn.click();

    // Wait for the mock redirect chain: Telegram → callback → socialAuth → router.push('/')
    await this.page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 });
    await expect(this.headerPage.userIcon, 'Profile button is not visible after Telegram login').toBeVisible({ timeout: 15_000 });
  }

  /**
   * Login via MetaMask wallet using the "Connect wallet" button in the header (main page).
   * Same as walletLoginSuccess but enters the flow from the header instead of /login page.
   */
  async walletLoginViaHeaderSuccess(options?: { wallet?: WalletInfo; skipInjection?: boolean; skipModalCheck?: boolean; walletType?: EvmWalletType }): Promise<WalletInfo> {
    const walletType = options?.walletType ?? 'metamask';
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(this.headerPage.connectWalletBtn, 'Connect wallet button is not visible in header').toBeVisible();
    await expect(this.headerPage.connectWalletBtn, 'Connect wallet button is not enabled in header').toBeEnabled();

    // Register waitForResponse BEFORE the action that triggers the request
    const whoamiPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/users/whoami') && res.status() === 200,
      { timeout: 40_000 }
    );
    await this.headerPage.connectWalletBtn.click();
    await this.loginPage.clickWalletOption(walletType);
    await whoamiPromise;

    if (!options?.skipModalCheck) {
      const addEmailModal = this.page.locator('[data-id="add-email-modal"]');
      await expect(addEmailModal, 'Add email modal is not visible after wallet login').toBeVisible({ timeout: 10_000 });
      await expect(addEmailModal, 'Add email modal text is incorrect').toContainText(
        'To recover your profile and set up an alternative login method, you can add an email address and password in your account settings.'
      );
      await expect(this.page.getByRole('button', { name: 'Cancel' }), 'Cancel button is not visible').toBeVisible();
      await expect(this.page.locator('[data-id="open-settings"]'), 'Open Settings button is not visible').toBeVisible();

      await this.page.getByRole('button', { name: 'Cancel' }).click();
    }

    await expect(this.headerPage.userIcon, 'Profile button is not visible').toBeVisible();

    return wallet;
  }

  async logout(){
    await this.headerPage.clickUserIcon();
    await this.userDropdownPage.clickLogoutBtn();
    await expect(this.page).toHaveURL('/');
    await expect(this.headerPage.joinBtn, 'Join button should be visible after logout').toBeVisible();
  }
}