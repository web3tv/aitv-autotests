import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class LoginPopupPage {
    readonly page: Page;

    // Step 1: Auth method selection
    readonly emailEntryBtn: Locator;
    readonly googleEntryBtn: Locator;
    readonly appleEntryBtn: Locator;
    readonly telegramEntryBtn: Locator;
    readonly walletEntryBtn: Locator;
    readonly entrySwitchIntentBtn: Locator;
    readonly backBtn: Locator;

    // Step 2: Email / phone input
    readonly emailUsernameeInput: Locator;
    readonly continueBtn: Locator;
    readonly switchToPhoneBtn: Locator;
    readonly emailSwitchIntentBtn: Locator;
    readonly noAccountError: Locator;

    // Step 2 (phone): Phone input
    readonly phoneInput: Locator;
    readonly phoneContinueBtn: Locator;
    readonly phoneSwitchIntentBtn: Locator;

    // Step 3a: Password (existing user, login intent)
    readonly passwordInput: Locator;
    readonly passwordToggleBtn: Locator;
    readonly loginBtn: Locator;
    readonly resetPasswordBtn: Locator;
    readonly loginChangeBtn: Locator;
    readonly loginSwitchSignupBtn: Locator;
    readonly continueBtn2: Locator;
    readonly continueBtn3: Locator;

    // Step 3c: Reset password
    readonly forgotContinueBtn: Locator;

    // Step 3b: Code verification (new user / password reset) — 4 separate OTP inputs
    readonly otpInputs: Locator;

    // Step 4: Create password (new user / password reset)
    readonly createPasswordInput: Locator;
    readonly repeatPasswordInput: Locator;
    readonly setNewPasswordBtn: Locator;
    readonly createResetPasswordInput: Locator;
    readonly repeatResetPasswordInput: Locator;
    readonly resetFinishBtn: Locator;
    


    readonly dialog: Locator;
    readonly closeBtn: Locator;

    // Step 5: Choose handle (new user)
    readonly chooseHandleInput: Locator;
    readonly finishBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dialog = page.getByRole('dialog');
        this.closeBtn = page.getByTestId('aitv-auth-close');

        this.emailEntryBtn    = page.getByTestId('aitv-auth-entry-email');
        this.googleEntryBtn   = page.getByTestId('aitv-auth-entry-google');
        this.appleEntryBtn    = page.getByTestId('aitv-auth-entry-apple');
        this.telegramEntryBtn = page.getByTestId('aitv-auth-entry-telegram');
        this.walletEntryBtn   = page.getByTestId('aitv-auth-entry-wallet');
        this.entrySwitchIntentBtn = page.getByTestId('aitv-auth-entry-switch-intent');
        this.backBtn          = page.getByTestId('aitv-auth-back');
        this.switchToPhoneBtn = page.getByTestId('aitv-auth-email-switch-phone');
        this.emailSwitchIntentBtn = page.getByTestId('aitv-auth-email-switch-intent');

        this.phoneInput       = page.getByTestId('aitv-auth-phone-input');
        this.phoneContinueBtn = page.getByTestId('aitv-auth-phone-continue');
        this.phoneSwitchIntentBtn = page.getByTestId('aitv-auth-phone-switch-intent');

        this.emailUsernameeInput  = page.getByTestId('aitv-auth-email-input');
        this.continueBtn      = page.getByTestId('aitv-auth-email-continue')
        this.noAccountError   = this.dialog.getByText('No account found for this email');
        this.continueBtn2      = page.getByTestId('aitv-auth-login-continue')

        this.passwordInput    = page.getByTestId('aitv-auth-login-password');
        this.passwordToggleBtn = page.getByTestId('aitv-auth-login-password-toggle');
        this.loginBtn         = page.getByTestId('login');
        this.resetPasswordBtn = page.getByTestId('aitv-auth-login-forgot');
        this.loginChangeBtn   = page.getByTestId('aitv-auth-login-change');
        this.loginSwitchSignupBtn = page.getByTestId('aitv-auth-login-switch-signup');
        this.forgotContinueBtn = page.getByRole('dialog').getByRole('button', { name: 'Continue' });

        this.otpInputs        = page.locator('[data-testid^="aitv-auth-otp-input-"]');

        this.createPasswordInput = page.getByTestId('aitv-auth-create-password');
        this.repeatPasswordInput = page.getByTestId('aitv-auth-create-repeat-password');

        this.createResetPasswordInput = page.getByTestId('aitv-auth-reset-password');
        this.repeatResetPasswordInput = page.getByTestId('aitv-auth-reset-repeat-password');
        this.resetFinishBtn = page.getByTestId('aitv-auth-reset-finish');
       

        this.continueBtn3 = page.getByTestId('aitv-auth-create-continue');
        this.setNewPasswordBtn   = page.getByTestId('setNewPassword');

        this.chooseHandleInput = page.getByTestId('aitv-auth-handle-input');
        this.finishBtn         = page.getByTestId('aitv-auth-handle-finish');
    }

    async assertPopupVisible(): Promise<void> {
        await expect(this.emailEntryBtn, 'Login popup is not visible (email entry button not found)').toBeVisible({ timeout: 10_000 });
    }

    async assertAuthModalVisible(): Promise<void> {
        await expect(this.closeBtn, 'Auth modal close button is not visible').toBeVisible({ timeout: 10_000 });
        await expect(this.emailEntryBtn, 'Auth modal email entry button is not visible').toBeVisible();
        await expect(this.googleEntryBtn, 'Auth modal Google entry button is not visible').toBeVisible();
        await expect(this.appleEntryBtn, 'Auth modal Apple entry button is not visible').toBeVisible();
        await expect(this.telegramEntryBtn, 'Auth modal Telegram entry button is not visible').toBeVisible();
        await expect(this.walletEntryBtn, 'Auth modal Wallet entry button is not visible').toBeVisible();
    }

    async clickTelegramEntry(): Promise<void> {
        await expect(this.telegramEntryBtn, 'Telegram entry button is not visible').toBeVisible();
        await expect(this.telegramEntryBtn, 'Telegram entry button is not enabled').toBeEnabled();
        await this.telegramEntryBtn.click();
    }

    async clickWalletEntry(): Promise<void> {
        await expect(this.walletEntryBtn, 'Wallet entry button is not visible').toBeVisible();
        await expect(this.walletEntryBtn, 'Wallet entry button is not enabled').toBeEnabled();
        await this.walletEntryBtn.click();
    }

    async clickEmailEntry(): Promise<void> {
        await expect(this.emailEntryBtn, 'Email entry button is not visible').toBeVisible();
        await expect(this.emailEntryBtn, 'Email entry button is not enabled').toBeEnabled();
        await this.emailEntryBtn.click();
    }

    async fillEmailOrUsername(value: string): Promise<void> {
        await expect(this.emailUsernameeInput, 'Email/username input is not visible').toBeVisible();
        await this.emailUsernameeInput.fill(value);
    }

    async clickContinue(): Promise<void> {
        await expect(this.continueBtn, 'Continue button is not visible').toBeVisible();
        await expect(this.continueBtn, 'Continue button is not enabled').toBeEnabled();
        await this.continueBtn.click();
    }

    // After entering the identifier, an unknown/unverified email is rejected at this step
    // with an inline error and never advances to the password step.
    async assertNoAccountFound(): Promise<void> {
        await expect(this.noAccountError, 'No-account-found error is not visible').toBeVisible({ timeout: 10_000 });
        await expect(this.passwordInput, 'Password step should not appear for a non-existent account').toBeHidden();
    }

    async fillPassword(password: string): Promise<void> {
        await expect(this.passwordInput, 'Password input is not visible').toBeVisible();
        await this.passwordInput.fill(password);
    }

    async clickContinue2(): Promise<void> {
        await expect(this.continueBtn2, 'Login button is not visible').toBeVisible();
        await expect(this.continueBtn2, 'Login button is not enabled').toBeEnabled();
        await this.continueBtn2.click();
    }

    async clickResetPassword(): Promise<void> {
        await expect(this.resetPasswordBtn, 'Reset password button is not visible').toBeVisible();
        await expect(this.resetPasswordBtn, 'Reset password button is not enabled').toBeEnabled();
        await this.resetPasswordBtn.click();
    }

    async clickForgotContinue(): Promise<void> {
        await expect(this.forgotContinueBtn, 'Continue button on Reset Password screen is not visible').toBeVisible();
        await expect(this.forgotContinueBtn, 'Continue button on Reset Password screen is not enabled').toBeEnabled();
        await this.forgotContinueBtn.click();
    }

    async fillCode(code: string): Promise<void> {
        await expect(this.otpInputs.first(), 'OTP code input is not visible').toBeVisible();
        for (let i = 0; i < code.length; i++) {
            await this.otpInputs.nth(i).fill(code[i]);
        }
    }

    async fillCreatePassword(password: string): Promise<void> {
        await expect(this.createPasswordInput, 'Create password input is not visible').toBeVisible();
        await this.createPasswordInput.fill(password);
        await expect(this.repeatPasswordInput, 'Repeat password input is not visible').toBeVisible();
        await this.repeatPasswordInput.fill(password);
    }

    async fillResetPassword(password: string): Promise<void> {
        await expect(this.createResetPasswordInput, 'Reset password input is not visible').toBeVisible();
        await expect(this.createResetPasswordInput, 'Reset password input is not editable').toBeEditable();
        await this.createResetPasswordInput.fill(password);
        await expect(this.repeatResetPasswordInput, 'Repeat reset password input is not visible').toBeVisible();
        await expect(this.repeatResetPasswordInput, 'Repeat reset password input is not editable').toBeEditable();
        await this.repeatResetPasswordInput.fill(password);
    }

    async clickResetFinish(): Promise<void> {
        await expect(this.resetFinishBtn, 'Finish button on reset password page is not visible').toBeVisible();
        await expect(this.resetFinishBtn, 'Finish button on reset password page is not enabled').toBeEnabled();
        await this.resetFinishBtn.click();
    }

    async clickSetNewPassword(): Promise<void> {
        await expect(this.continueBtn3, 'Continue button is not visible').toBeVisible();
        await expect(this.continueBtn3, 'Continue password button is not enabled').toBeEnabled();
        await this.continueBtn3.click();
    }

    async fillChooseHandle(handle: string): Promise<void> {
        await expect(this.chooseHandleInput, 'Choose handle input is not visible').toBeVisible();
        await this.chooseHandleInput.fill(handle);
    }

    async clickFinish(): Promise<void> {
        await expect(this.finishBtn, 'Finish button is not visible').toBeVisible();
        await expect(this.finishBtn, 'Finish button is not enabled').toBeEnabled();
        await this.finishBtn.click();
    }

    async clickSwitchToPhone(): Promise<void> {
        await expect(this.switchToPhoneBtn, 'Switch to phone button is not visible').toBeVisible();
        await expect(this.switchToPhoneBtn, 'Switch to phone button is not enabled').toBeEnabled();
        await this.switchToPhoneBtn.click();
    }

    async fillPhone(phone: string): Promise<void> {
        await expect(this.phoneInput, 'Phone input is not visible').toBeVisible();
        await this.phoneInput.fill(phone);
    }

    async clickPhoneContinue(): Promise<void> {
        await expect(this.phoneContinueBtn, 'Phone continue button is not visible').toBeVisible();
        await expect(this.phoneContinueBtn, 'Phone continue button is not enabled').toBeEnabled();
        await this.phoneContinueBtn.click();
    }
}
