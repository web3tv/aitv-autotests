import { HeaderPage } from "../pages/components/HeaderPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { UserDropdownPage } from "../pages/components/UserDropdownPage";
import { expect } from '@playwright/test';
import { Page } from '@playwright/test';
import { createMailFlows } from "../utils/mailHelper";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { injectEthereumMock, type WalletInfo, type EvmWalletType } from "../utils/walletMock";
import { SecurityPage } from "../pages/account/SecurityPage";
import { TestPopupsPage } from "../pages/testPopups/TestPopupsPage";
import { LoginPopupPage } from "../pages/testPopups/LoginPopupPage";
import { DataGenerator } from "../utils/dataGenerator";


export class AuthFlow {

  readonly loginPage: LoginPage;
  readonly headerPage: HeaderPage;
  readonly userDropdownPage: UserDropdownPage;
  readonly forgotPasswordPage: ForgotPasswordPage;
  readonly testPopupsPage: TestPopupsPage;
  readonly loginPopupPage: LoginPopupPage;

  constructor(public page: Page) {
    this.loginPage = new LoginPage(page);
    this.headerPage = new HeaderPage(page);
    this.userDropdownPage = new UserDropdownPage(page);
    this.forgotPasswordPage = new ForgotPasswordPage(page);
    this.testPopupsPage = new TestPopupsPage(page);
    this.loginPopupPage = new LoginPopupPage(page);
  }

  /**
   * Open the auth modal and land on the email login step. Desktop still has a Login
   * button in the header; on mobile (W3-2782 item 7) it was removed, so login is reached
   * via Sign Up → "Email or Phone Number" → "Already have an account? Log In".
   */
  private async openLoginEmailForm(isMobile: boolean): Promise<void> {
    if (isMobile) {
      await this.headerPage.clickSignup();
      await this.loginPopupPage.assertPopupVisible();
      await this.loginPopupPage.clickEmailEntry();
      await this.loginPopupPage.clickSwitchToLoginIntent();
    } else {
      await this.headerPage.clickLogin();
      await this.loginPopupPage.assertPopupVisible();
      await this.loginPopupPage.clickEmailEntry();
    }
  }

  async loginSuccess(credentials: string | { phone: string }, password: string, username: string, isMobile = false) {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.openLoginEmailForm(isMobile);
    if (typeof credentials === 'object') {
      await this.loginPopupPage.clickSwitchToPhone();
      await this.loginPopupPage.fillPhone(credentials.phone);
      await this.loginPopupPage.revealLoginPasswordStep('phone');
    } else {
      await this.loginPopupPage.fillEmailOrUsername(credentials);
      await this.loginPopupPage.revealLoginPasswordStep('email');
    }
    await this.loginPopupPage.fillPassword(password);
    // W3-2725: the password step submits to /api/auth/legacy-login (/api/auth/login is the identifier step)
    const loginResponse = this.page.waitForResponse(
      async r => r.url().includes('/api/auth/legacy-login') && (await r.json().catch(() => null))?.message === 'Login successfull',
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
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.revealLoginPasswordStep('email');
    // Legacy two-step form: an unregistered email is rejected at the identifier step
    // ("No account found." — no password step), while a known account advances to the
    // password step and fails there ("Invalid password."). The redesigned single-screen
    // form (W3-2782) always shows the password field and returns a single generic
    // "Invalid email or password" for both cases.
    await expect(
      this.loginPopupPage.noAccountError.or(this.loginPopupPage.passwordInput),
      'Neither the no-account error nor the password step appeared after entering the email'
    ).toBeVisible({ timeout: 15_000 });
    if (await this.loginPopupPage.noAccountError.isVisible()) {
      return;
    }
    await this.loginPopupPage.fillPassword(password);
    const failResponse = this.page.waitForResponse(
      r => r.url().includes('/api/auth/legacy-login') && r.status() === 400,
      { timeout: 40_000 }
    );
    await this.loginPopupPage.clickContinue2();
    await failResponse;
    await expect(this.page.locator('body'), 'Login-failure error is not shown')
      .toContainText(/Invalid password\. Please re-enter another password\.|Invalid email or password/);
  }

  // A non-existent / unverified email is rejected: on the legacy two-step form at the
  // identifier step ("No account found for this email." — no password step); on the
  // redesigned single-screen form (W3-2782) only after submitting email + password, as
  // the generic "Invalid email or password".
  async loginNoAccountFound(email: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    if (await this.loginPopupPage.passwordInput.isVisible().catch(() => false)) {
      await this.loginPopupPage.fillPassword(process.env.USER_PASSWORD ?? 'Admin1@@');
      await this.loginPopupPage.clickContinue2();
      await expect(this.page.locator('body'), 'Account-not-found error is not shown')
        .toContainText(/No account found for this email\.|Invalid email or password/, { timeout: 10_000 });
    } else {
      await this.loginPopupPage.clickContinue();
      await this.loginPopupPage.assertNoAccountFound();
    }
  }

  async loginWith2FaFailed(email:string,password:string){
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.revealLoginPasswordStep('email');
    await this.loginPopupPage.fillPassword(password);
    await this.loginPopupPage.clickContinue2();
    await expect(this.page.locator('body'), '2FA code prompt is not shown').toContainText('sent a verification code');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill('2');
    const checkResponse = this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/check') &&
            res.status() === 403,
            { timeout: 15000 }
        );
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill('2');
    await checkResponse;
    await expect(this.page.locator('body'), 'Wrong-2FA-code error is not shown').toContainText('Error code. Check your code on email and try again.');
  }

  async loginWith2FaSuccess(email:string,password:string,token:string,username:string){
    const mailFlows = createMailFlows(this.page.request);
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.revealLoginPasswordStep('email');
    const requestedAt = Date.now();
    await this.loginPopupPage.fillPassword(password);
    await this.loginPopupPage.clickContinue2();
    await expect(this.page.locator('body'), '2FA code prompt is not shown').toContainText('sent a verification code');
    const [d1, d2, d3, d4] = await mailFlows.authCode(token, { since: requestedAt });
    console.log(`Extracted 2FA code: ${d1}${d2}${d3}${d4}`);
    // 500ms pauses between OTP characters: the input auto-advances focus and swallows
    // keystrokes typed too fast. Re-evaluate when the skipped 2FA suite is revived.
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill(d1);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill(d2);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill(d3);
    await this.page.waitForTimeout(500);
    const checkResponse = this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/check') &&
            res.status() === 200,
            { timeout: 15000 }
        );
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill(d4);
    await checkResponse;
    await this.assertLoggedInAs(username);
  }

  /** Submits a nonexistent username/email in the Login modal and asserts the not-found error. */
  async usernameError(identifier: string) {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(identifier);
    // Legacy two-step form rejects an unknown handle at the identifier step with a
    // dedicated message; the single-screen form (W3-2782) surfaces it only after
    // submitting identifier + password, as the generic "Invalid email or password".
    if (await this.loginPopupPage.passwordInput.isVisible().catch(() => false)) {
      await this.loginPopupPage.fillPassword(process.env.USER_PASSWORD ?? 'Admin1@@');
      await this.loginPopupPage.clickContinue2();
      await expect(this.page.locator('body'), 'Account-not-found error is not shown')
        .toContainText(/We couldn't find an account for that handle\.|Invalid email or password/, { timeout: 10_000 });
    } else {
      await this.loginPopupPage.clickContinue();
      await expect(this.page.locator('body'), 'Account-not-found error is not shown')
        .toContainText('We couldn\'t find an account for that handle.', { timeout: 10_000 });
    }
  }

  async walletLoginSuccess(options?: { wallet?: WalletInfo; skipInjection?: boolean; skipModalCheck?: boolean; walletType?: EvmWalletType }): Promise<WalletInfo> {
    const walletType = options?.walletType ?? 'metamask';
    // Inject mock BEFORE navigating to the login page (skip if already injected in this page context)
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickWalletEntry();

    // W3-2725: the wallet login submits to /api/auth/login (was /api/auth/start)
    const authLoginResponse = this.page.waitForResponse(
      r => r.url().includes('/api/auth/login'),
      { timeout: 15_000 }
    );
    await this.loginPage.clickWalletOption(walletType);
    const authLoginRes = await authLoginResponse;
    expect(authLoginRes.status(), `auth/login returned ${authLoginRes.status()}`).toBe(200);

    await this.page.waitForURL((url) => url.pathname === '/');
    // await this.page.waitForResponse(
    //   (res) => res.url().includes('/api/users/whoami') && res.status() === 200,
    //   { timeout: 40_000 }
    // );

    if (!options?.skipModalCheck) {
      // Assert the "set up alternative login method" modal (only appears on first wallet login)
      const addEmailModal = this.page.locator('[data-id="add-email-modal"]');
      await expect(addEmailModal, 'Add email modal is not visible after wallet login').toBeVisible({ timeout: 10_000 });
      await expect(addEmailModal, 'Add email modal text is incorrect').toContainText('alternative login method');
      await expect(this.page.getByRole('button', { name: 'Cancel' }), 'Cancel button is not visible').toBeVisible();
      await expect(this.page.locator('[data-id="open-settings"]'), 'Open Settings button is not visible').toBeVisible();

      // Dismiss modal
      await this.page.getByRole('button', { name: 'Cancel' }).click();
    }

    await expect(this.headerPage.userIcon, 'Profile button is not visible').toBeVisible();

    return wallet;
  }

  async addWalletFromAccountSuccess(options?: { wallet?: WalletInfo; skipInjection?: boolean; walletType?: EvmWalletType }): Promise<WalletInfo> {
    const walletType = options?.walletType ?? 'metamask';
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    const securityPage = new SecurityPage(this.page);
    await this.page.goto('/account', { waitUntil: 'domcontentloaded' });
    await securityPage.clickAddWalletBtn();

    const addWalletResponse = this.page.waitForResponse(
      r => r.url().includes('/api/auth/add-wallet'),
      { timeout: 15_000 }
    );
    await this.loginPage.clickWalletOption(walletType);
    const res = await addWalletResponse;
    expect(res.status(), `auth/add-wallet returned ${res.status()}`).toBe(200);

    await securityPage.assertWalletAddedToast();
    await securityPage.assertDisplayedWalletAddress(wallet.address);

    return wallet;
  }

  async walletRegisterSuccess(options?: { wallet?: WalletInfo; skipInjection?: boolean; walletType?: EvmWalletType }): Promise<{ wallet: WalletInfo; username: string }> {
    const walletType = options?.walletType ?? 'metamask';
    const wallet = options?.skipInjection && options.wallet
      ? options.wallet
      : await injectEthereumMock(this.page, options?.wallet, walletType);

    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickSignup();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickWalletEntry();

    // W3-2725: the wallet registration submits to /api/auth/signup (was /api/auth/start)
    const authSignupPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/auth/signup'),
      { timeout: 15_000 }
    );
    await this.loginPage.clickWalletOption(walletType);
    await authSignupPromise;

    const username = DataGenerator.generateUsername();
    await this.loginPopupPage.fillChooseHandle(username);

    const whoamiPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/users/whoami') && res.status() === 200,
      { timeout: 40_000 }
    );
    await this.loginPopupPage.clickFinish();
    await this.page.waitForURL((url) => url.pathname === '/');
    await whoamiPromise;

    await this.assertLoggedInAs(username);

    return { wallet, username };
  }

  async assertLoggedInAsMobile(username: string) {
    await expect(this.headerPage.userIcon, 'Profile button is not visible').toBeVisible();
    await this.headerPage.clickUserIcon();
    await expect(
      this.headerPage.mobileProfileMenu,
      'Mobile profile menu is not visible'
    ).toBeVisible();
    await expect(
      this.headerPage.mobileProfileMenu,
      `Expected @${username} in profile menu`
    ).toContainText(`@${username}`);
    await this.page.keyboard.press('Escape');
  }

  async assertLoggedInAs(username: string) {
    // The profile dropdown header shows the user's default-channel NAME (which equals the
    // account handle) on the first line and the CHANNEL handle (with "@") on the second.
    // The channel handle can differ from the account handle — for wallet-created default
    // channels the backend derives it as "w" + handle.slice(2) (e.g. "zgscx8420" →
    // "@wscx8420") — so we match the display NAME (== account handle), not "@handle".
    const isWallet = username.startsWith('0x');
    const displayValue = isWallet
      ? `${username.slice(0, 4)}...${username.slice(-4)}`
      : username;
    await expect(this.headerPage.userIcon, 'Profile button is not visible').toBeVisible();
    await this.headerPage.clickUserIcon();
    await expect(this.userDropdownPage.dropdown, 'Profile dropdown is not visible').toBeVisible();
    await expect(this.userDropdownPage.dropdown, `Expected ${displayValue} in profile dropdown`).toContainText(displayValue);
    // Close dropdown to avoid blocking subsequent interactions
    await this.page.keyboard.press('Escape');
    await expect(this.userDropdownPage.dropdown, 'Profile dropdown should be hidden').toBeHidden();
  }

  async telegramLoginSuccess(user: { email: string; username: string }): Promise<void> {
    const baseUrl = process.env.BASE_URL!;

    // A realistic (but unsigned) Telegram auth payload. The backend hash check can't be
    // forged, so we mock the /api/auth/start response below — the token content is only
    // here so the callback page has a well-formed tgAuthResult to forward.
    const tgAuthResult = Buffer.from(
      JSON.stringify({
        id: 665563338,
        first_name: 'Test',
        username: user.username,
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'mock_hash',
      }),
    ).toString('base64');

    // Mock: intercept Telegram OAuth redirect → return page that redirects to the app's
    // /oauth/callback with the tgAuthResult in the hash (Telegram redirect-mode contract).
    await this.page.route('**/oauth.telegram.org/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><script>window.location.href = "${baseUrl}/oauth/callback#tgAuthResult=${tgAuthResult}";</script></html>`,
      });
    });

    // Flag to enable whoami mock only after social login succeeds
    let authenticated = false;

    // Mock: intercept the social-login call. The frontend posts the Telegram token to
    // POST /api/auth/start with { method: 'social', provider: 'telegram', token }.
    // Return the same success shape the real backend does ({ success, state: 'tokens', user }).
    await this.page.route('**/api/auth/start', async route => {
      const request = route.request();
      let body: { method?: string; provider?: string } = {};
      try {
        body = request.postDataJSON() ?? {};
      } catch {
        // non-JSON body — let it through untouched
      }

      if (request.method() === 'POST' && body.method === 'social' && body.provider === 'telegram') {
        authenticated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            state: 'tokens',
            user: {
              id: 'mock-tg-user-id',
              handle: user.username,
              username: user.username,
              email: user.email,
            },
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
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickTelegramEntry();

    // Wait for the mock redirect chain: Telegram → callback → socialAuth → router.push('/')
    await this.page.waitForURL((url) => url.pathname === '/', { timeout: 30_000 });
    await expect(this.headerPage.userIcon, 'Profile button is not visible after Telegram login').toBeVisible({ timeout: 15_000 });
  }

  /** Opens the profile dropdown and navigates to Account Settings (/account). */
  async openAccountSettings(){
    await this.headerPage.clickUserIcon();
    await expect(this.userDropdownPage.dropdown, 'Profile dropdown is not visible').toBeVisible();
    await this.userDropdownPage.clickAccountLink();
  }

  async logout(){
    await this.headerPage.clickUserIcon();
    await this.userDropdownPage.clickLogoutBtn();
    await expect(this.page, 'Did not navigate to home page after logout').toHaveURL('/');
    await expect(this.headerPage.loginBtn, 'Login button should be visible after logout').toBeVisible();
  }

  async enterWrongCodeMaxAttemptsViaPopup(email: string): Promise<void> {
    // Registration OTP scenario — a fresh email only gets a code in the Sign Up intent
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickSignup();
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
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    if (typeof credentials === 'object') {
      await this.loginPopupPage.clickSwitchToPhone();
      await this.loginPopupPage.fillPhone(credentials.phone);
      await this.loginPopupPage.revealLoginPasswordStep('phone');
    } else {
      await this.loginPopupPage.fillEmailOrUsername(credentials);
      await this.loginPopupPage.revealLoginPasswordStep('email');
    }
    await this.loginPopupPage.fillPassword(password);
    await this.loginPopupPage.clickContinue2();
    await expect(
      this.page.locator('body'),
      'Error message not visible in popup'
    ).toContainText(/Invalid password\. Please re-enter another password\.|Invalid email or password/, { timeout: 10_000 });
  }

  async emailNotFoundViaPopup(email: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    // Legacy two-step form rejects an unknown email at the identifier step; the
    // single-screen form (W3-2782) surfaces it only after submitting email + password,
    // as the generic "Invalid email or password".
    if (await this.loginPopupPage.passwordInput.isVisible().catch(() => false)) {
      await this.loginPopupPage.fillPassword(process.env.USER_PASSWORD ?? 'Admin1@@');
      await this.loginPopupPage.clickContinue2();
      await expect(
        this.page.locator('body'),
        'Error message not visible in popup'
      ).toContainText(/No account found for this email\.|Invalid email or password/, { timeout: 10_000 });
    } else {
      await this.loginPopupPage.clickContinue();
      await expect(
        this.page.locator('body'),
        'Error message not visible in popup'
      ).toContainText('No account found for this email.', { timeout: 10_000 });
    }
  }

  async submitForgotPasswordViaPopup(email: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickLogin();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    // Legacy two-step form hides "Forgot password?" behind the password step (reached
    // by entering the identifier + Continue); the single-screen form (W3-2782) shows it
    // immediately. Advance only when the link isn't visible yet.
    if (!(await this.loginPopupPage.resetPasswordBtn.isVisible().catch(() => false))) {
      await this.loginPopupPage.fillEmailOrUsername(email);
      await this.loginPopupPage.clickContinue();
    }
    await this.loginPopupPage.clickResetPassword();
    // The Reset Password screen has its own email field — fill it, then submit.
    await this.loginPopupPage.fillResetRequestEmail(email);
    await this.loginPopupPage.clickForgotContinue();
  }

  async completeResetPasswordViaPopup(code: string, newPassword: string): Promise<void> {
    await this.loginPopupPage.fillCode(code);
    await this.loginPopupPage.fillCreatePassword(newPassword);
    await this.loginPopupPage.clickSetNewPassword();
  }

  /** Завершает сброс пароля на странице, открытой по ссылке из письма. */
  async submitNewPasswordViaResetLink(newPassword: string): Promise<void> {
    await this.loginPopupPage.fillResetPassword(newPassword);
    await this.loginPopupPage.clickResetFinish();
  }

}