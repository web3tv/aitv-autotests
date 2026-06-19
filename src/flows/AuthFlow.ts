import { HeaderPage } from "../pages/components/HeaderPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { UserDropdownPage } from "../pages/components/UserDropdownPage";
import { expect } from '@playwright/test';
import { Page } from '@playwright/test';
import { MailTmHelper } from "../utils/mailTmHelper";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { injectEthereumMock, type WalletInfo, type EvmWalletType } from "../utils/walletMock";
import { TestPopupsPage } from "../pages/testPopups/TestPopupsPage";
import { LoginPopupPage } from "../pages/testPopups/LoginPopupPage";
import { DataGenerator } from "../utils/dataGenerator";


export class AuthFlow {

  readonly loginPage: LoginPage;
  readonly resetPasswordPage: ResetPasswordPage;
  readonly headerPage: HeaderPage;
  readonly userDropdownPage: UserDropdownPage;
  readonly forgotPasswordPage: ForgotPasswordPage;
  readonly testPopupsPage: TestPopupsPage;
  readonly loginPopupPage: LoginPopupPage;

  constructor(public page: Page) {
    this.loginPage = new LoginPage(page);
    this.resetPasswordPage = new ResetPasswordPage(page);
    this.headerPage = new HeaderPage(page);
    this.userDropdownPage = new UserDropdownPage(page);
    this.forgotPasswordPage = new ForgotPasswordPage(page);
    this.testPopupsPage = new TestPopupsPage(page);
    this.loginPopupPage = new LoginPopupPage(page);
  }

  async loginSuccess(credentials: string | { phone: string }, password: string, username: string, isMobile = false) {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    if (typeof credentials === 'object') {
      await this.loginPopupPage.clickSwitchToPhone();
      await this.loginPopupPage.fillPhone(credentials.phone);
      await this.loginPopupPage.clickPhoneContinue();
    } else {
      await this.loginPopupPage.fillEmailOrUsername(credentials);
      await this.loginPopupPage.clickContinue();
    }
    await this.loginPopupPage.fillPassword(password);
    const loginResponse = this.page.waitForResponse(
      async r => r.url().includes('/api/auth/login') && (await r.json().catch(() => null))?.message === 'Login successfull',
      { timeout: 40_000 }
    );
    await this.loginPopupPage.clickContinue2();
    await loginResponse;
    if (isMobile) {
      await this.assertLoggedInAsMobile(username);
    } else {
      await this.assertLoggedInAs(username);
    }
  }

  async loginFailed(email: string, password: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.clickContinue();
    await this.loginPopupPage.fillPassword(password);
    const failResponse = this.page.waitForResponse(
      r => r.url().includes('/api/auth/login') && r.status() === 400,
      { timeout: 40_000 }
    );
    await this.loginPopupPage.clickContinue2();
    await failResponse;
    await expect(this.page.locator('body')).toContainText('Invalid password. Please re-enter another password.');
  }

  async loginWith2FaFailed(email:string,password:string){
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.clickContinue();
    await this.loginPopupPage.fillPassword(password);
    await this.loginPopupPage.clickContinue2();
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
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.clickContinue();
    const requestedAt = Date.now();
    await this.loginPopupPage.fillPassword(password);
    await this.loginPopupPage.clickContinue2();
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

  async usernameError (email:string) {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.clickContinue();
    await expect(this.page.locator('body')).toContainText('Username not found. Try another one.');
  }

  async walletLoginSuccess(options?: { wallet?: WalletInfo; skipInjection?: boolean; skipModalCheck?: boolean; walletType?: EvmWalletType }): Promise<WalletInfo> {
    const walletType = options?.walletType ?? 'metamask';
    // Inject mock BEFORE navigating to the login page (skip if already injected in this page context)
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickWalletEntry();

    const authStartResponse = this.page.waitForResponse(
      r => r.url().includes('/api/auth/start'),
      { timeout: 15_000 }
    );
    await this.loginPage.clickWalletOption(walletType);
    const authStartRes = await authStartResponse;
    expect(authStartRes.status(), `auth/start returned ${authStartRes.status()}`).toBe(200);

    await this.page.waitForURL((url) => url.pathname === '/');
    // await this.page.waitForResponse(
    //   (res) => res.url().includes('/api/users/whoami') && res.status() === 200,
    //   { timeout: 40_000 }
    // );

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

  async walletRegisterSuccess(options?: { wallet?: WalletInfo; skipInjection?: boolean; walletType?: EvmWalletType }): Promise<{ wallet: WalletInfo; username: string }> {
    const walletType = options?.walletType ?? 'metamask';
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickWalletEntry();

    const authStartPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/auth/start'),
      { timeout: 15_000 }
    );
    await this.loginPage.clickWalletOption(walletType);
    await authStartPromise;

    const username = DataGenerator.generateUsername();
    await this.loginPopupPage.fillChooseHandle(username);
    await this.loginPopupPage.clickFinish();

    const whoamiPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/users/whoami') && res.status() === 200,
      { timeout: 40_000 }
    );
    await this.page.waitForURL((url) => url.pathname === '/');
    await whoamiPromise;

    await this.assertLoggedInAs(username);

    return { wallet, username };
  }

  async assertLoggedInAsMobile(username: string) {
    await expect(this.headerPage.userIcon, 'Profile button is not visible').toBeVisible();
    await this.headerPage.clickUserIcon();
    await expect(
      this.headerPage.mobileProfileMenuChannelLink,
      'Profile menu channel link is not visible'
    ).toBeVisible();
    await expect(
      this.headerPage.mobileProfileMenuChannelLink,
      `Expected @${username} in profile menu`
    ).toContainText(`@${username}`);
    await this.page.keyboard.press('Escape');
  }

  async assertLoggedInAs(username: string) {
    const isWallet = username.startsWith('0x');
    const displayValue = isWallet
      ? `${username.slice(0, 4)}...${username.slice(-4)}`
      : `@${username}`;
    await expect(this.headerPage.userIcon, 'Profile button is not visible').toBeVisible();
    await this.headerPage.clickUserIcon();
    await expect(this.userDropdownPage.dropdown, 'Profile dropdown is not visible').toBeVisible();
    await expect(this.userDropdownPage.dropdown, `Expected ${displayValue} in profile dropdown`).toContainText(displayValue);
    // Close dropdown to avoid blocking subsequent interactions
    await this.page.keyboard.press('Escape');
    await expect(this.userDropdownPage.dropdown).toBeHidden();
  }

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

    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickTelegramEntry();

    // Wait for the mock redirect chain: Telegram → callback → socialAuth → router.push('/')
    await this.page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 });
    await expect(this.headerPage.userIcon, 'Profile button is not visible after Telegram login').toBeVisible({ timeout: 15_000 });
  }

  async logout(){
    await this.headerPage.clickUserIcon();
    await this.userDropdownPage.clickLogoutBtn();
    await expect(this.page).toHaveURL('/');
    await expect(this.headerPage.getStartedBtn, 'GetStarted button should be visible after logout').toBeVisible();
  }

  async enterWrongCodeMaxAttemptsViaPopup(email: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.clickContinue();
    await expect(this.loginPopupPage.otpInputs.first(), 'OTP input is not visible after entering email').toBeVisible({ timeout: 15_000 });

    const wrongCode = '9999';

    await this.loginPopupPage.fillCode(wrongCode);
    await expect(this.page.locator('body'), 'Expected 4 attempts left message').toContainText('Invalid code. Please try again. 4 attempts left', { timeout: 10_000 });

    await this.loginPopupPage.fillCode(wrongCode);
    await expect(this.page.locator('body'), 'Expected 3 attempts left message').toContainText('Invalid code. Please try again. 3 attempts left', { timeout: 10_000 });

    await this.loginPopupPage.fillCode(wrongCode);
    await expect(this.page.locator('body'), 'Expected 2 attempts left message').toContainText('Invalid code. Please try again. 2 attempts left', { timeout: 10_000 });

    await this.loginPopupPage.fillCode(wrongCode);
    await expect(this.page.locator('body'), 'Expected 1 attempt left message').toContainText('Invalid code. Please try again. 1 attempt left', { timeout: 10_000 });

    await this.loginPopupPage.fillCode(wrongCode);
    await expect(this.page.locator('body'), 'Expected too many attempts error').toContainText('Too many attempts. Please request a new code.', { timeout: 10_000 });
  }

  async passwordErrorViaPopup(credentials: string | { phone: string }, password: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    if (typeof credentials === 'object') {
      await this.loginPopupPage.clickSwitchToPhone();
      await this.loginPopupPage.fillPhone(credentials.phone);
      await this.loginPopupPage.clickPhoneContinue();
    } else {
      await this.loginPopupPage.fillEmailOrUsername(credentials);
      await this.loginPopupPage.clickContinue();
    }
    await this.loginPopupPage.fillPassword(password);
    await this.loginPopupPage.clickContinue2();
    await expect(
      this.page.locator('body'),
      'Error message not visible in popup'
    ).toContainText('Invalid password. Please re-enter another password.', { timeout: 10_000 });
  }

  async emailNotFoundViaPopup(email: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.clickContinue();
    await expect(
      this.page.locator('body'),
      'Error message not visible in popup'
    ).toContainText('not found', { timeout: 10_000 });
  }

  async submitForgotPasswordViaPopup(email: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.clickContinue();
    await this.loginPopupPage.clickResetPassword();
    await this.loginPopupPage.clickForgotContinue();
  }

  async completeResetPasswordViaPopup(code: string, newPassword: string): Promise<void> {
    await this.loginPopupPage.fillCode(code);
    await this.loginPopupPage.fillCreatePassword(newPassword);
    await this.loginPopupPage.clickSetNewPassword();
  }

}