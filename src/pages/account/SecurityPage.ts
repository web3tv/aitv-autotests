import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { STATIC_OTP_CODE } from '../../api/AuthApi';
import { formatPhoneInternational } from '../../utils/phoneFormat';

/** Social providers that can be linked to an account from the Connected accounts block. */
export type SocialProvider = 'google' | 'apple' | 'telegram';
export const SOCIAL_PROVIDERS: SocialProvider[] = ['google', 'apple', 'telegram'];

/**
 * Security tab of the redesigned /account page: email / password / phone / wallet,
 * connected accounts, plus 2FA.
 */
export class SecurityPage {

    readonly page: Page;

    // Security tab — row entries
    readonly emailValue: Locator;
    readonly changeEmailBtn: Locator;
    readonly passwordRow: Locator;
    readonly noPasswordRow: Locator;    // account without a password: "No password set / Create password"
    readonly addEmailRow: Locator;      // wallet-only account: "Add Email"
    readonly noWalletRow: Locator;      // email account: "No wallet added"
    readonly walletValue: Locator;      // wallet account: connected address
    readonly addPhoneRow: Locator;      // account without a phone: "Add Phone"
    readonly phoneValue: Locator;       // account with a phone: the saved number
    readonly changePhoneBtn: Locator;

    // Change-email modal (aitv-email-modal)
    readonly emailModal: Locator;
    readonly emailCurrentValue: Locator;
    readonly newEmailInput: Locator;
    readonly emailPasswordInput: Locator;
    readonly emailContinueBtn: Locator;
    readonly emailSentStep: Locator;
    readonly emailCloseBtn: Locator;

    // "Email changed" success modal (aitv-email-changed-modal) — shown once the FE polling sees
    // the new email on the profile; both Sign In and closing it log the user out (redirect to /login)
    readonly emailChangedModal: Locator;
    readonly emailSignInBtn: Locator;

    // Change-password modal (aitv-password-modal)
    readonly passwordModal: Locator;
    readonly currentPasswordInput: Locator;
    readonly newPasswordInput: Locator;
    readonly repeatPasswordInput: Locator;
    readonly passwordConfirmBtn: Locator;
    readonly passwordSentStep: Locator;
    readonly passwordCloseBtn: Locator;

    // Add/change-phone modal (aitv-phone-flow) — form step, OTP step, success step
    readonly phoneModal: Locator;
    readonly phoneCountrySelect: Locator;
    readonly phoneInput: Locator;
    readonly phonePasswordInput: Locator;
    readonly phoneContinueBtn: Locator;
    readonly phoneCloseBtn: Locator;
    readonly phoneFormStep: Locator;
    readonly phoneOtpInputs: Locator;
    readonly phoneOtpEditBtn: Locator;
    readonly phoneSuccessStep: Locator;
    readonly phoneFinishBtn: Locator;

    // Wallet

    // Negative
    readonly emailAlreadyExistsError: Locator;

    // 2FA (pre-redesign — see note on the 2FA methods below)
    readonly setUpBtn: Locator;
    readonly passwordMessage: Locator;
    readonly twoFaPasswordInput: Locator;
    readonly twoFaCheckbox: Locator;
    readonly twoFaSubmitBtn: Locator;
    readonly twoFaSuccessToast: Locator;

    constructor(page: Page) {
        this.page = page;

        // Security tab rows
        this.emailValue = page.getByTestId('aitv-security-email-value');
        this.changeEmailBtn = page.getByTestId('aitv-security-email-change-btn');
        this.passwordRow = page.getByTestId('aitv-security-password-row');
        this.noPasswordRow = page.getByTestId('aitv-security-no-password-row');
        this.addEmailRow = page.getByTestId('aitv-security-add-email-row');
        this.noWalletRow = page.getByTestId('aitv-security-no-wallet-row');
        this.walletValue = page.getByTestId('aitv-security-wallet-value');

        // Phone row: the "Add Phone" row when no number is set, label + value + Change once it is
        this.addPhoneRow = page.getByTestId('aitv-security-add-phone-row');
        this.phoneValue = page.getByTestId('aitv-security-phone-value');
        this.changePhoneBtn = page.getByTestId('aitv-security-phone-change-btn');

        // Change-email modal
        this.emailModal = page.getByTestId('aitv-email-modal');
        this.emailCurrentValue = page.getByTestId('aitv-email-current-value');
        this.newEmailInput = page.getByTestId('aitv-email-new-input');
        this.emailPasswordInput = page.getByTestId('aitv-email-password-input');
        this.emailContinueBtn = page.getByTestId('aitv-email-continue-btn');
        this.emailSentStep = page.getByTestId('aitv-email-sent-step');
        this.emailCloseBtn = page.getByTestId('aitv-email-close-btn');
        this.emailChangedModal = page.getByTestId('aitv-email-changed-modal');
        this.emailSignInBtn = page.getByTestId('aitv-email-signin-btn');

        // Change-password modal
        this.passwordModal = page.getByTestId('aitv-password-modal');
        this.currentPasswordInput = page.getByTestId('aitv-password-current-input');
        this.newPasswordInput = page.getByTestId('aitv-password-new-input');
        this.repeatPasswordInput = page.getByTestId('aitv-password-repeat-input');
        this.passwordConfirmBtn = page.getByTestId('aitv-password-confirm-btn');
        this.passwordSentStep = page.getByTestId('aitv-password-sent-step');
        this.passwordCloseBtn = page.getByTestId('aitv-password-close-btn');

        // Add/change-phone modal
        this.phoneModal = page.getByTestId('aitv-phone-flow');
        this.phoneCountrySelect = page.getByTestId('aitv-auth-phone-country');
        this.phoneInput = page.getByTestId('aitv-phone-input');
        this.phonePasswordInput = page.getByTestId('aitv-phone-password-input');
        this.phoneContinueBtn = page.getByTestId('aitv-phone-continue-btn');
        this.phoneCloseBtn = page.getByTestId('aitv-phone-close-btn');
        this.phoneFormStep = page.getByTestId('aitv-phone-form-step');
        // the OTP step reuses the shared auth code input (4 boxes) — scoped to this modal
        this.phoneOtpInputs = this.phoneModal.locator('[data-testid^="aitv-auth-otp-input-"]');
        this.phoneOtpEditBtn = page.getByTestId('aitv-auth-otp-edit');
        this.phoneSuccessStep = page.getByTestId('aitv-phone-success-step');
        this.phoneFinishBtn = page.getByTestId('aitv-phone-finish-btn');

        this.emailAlreadyExistsError = page.getByText(/account already exists for this email/i);

        // 2FA (pre-redesign locators — not yet re-verified against the new UI)
        this.setUpBtn = page.getByRole('button', { name: 'Set Up' });
        this.passwordMessage = page.locator('#check-password-2fa');
        this.twoFaPasswordInput = page.getByRole('textbox', { name: 'Enter password' });
        this.twoFaCheckbox = page.getByRole('checkbox');
        this.twoFaSubmitBtn = page.getByRole('button', { name: 'Submit' });
        this.twoFaSuccessToast = page.getByText('Setting updated!');
    }

    // DISPLAY ASSERTIONS
    async assertDisplayedEmail(email: string): Promise<void> {
        await expect(this.emailValue, 'Email address is not displayed correctly').toHaveText(email);
    }

    async assertDisplayedWalletAddress(address: string): Promise<void> {
        await expect(this.walletValue, 'Wallet address is not visible').toBeVisible();
        await expect(this.walletValue, 'Wallet address is not displayed correctly').toHaveText(address);
    }

    // PHONE METHODS (aitv-phone-flow: form step -> OTP step -> success step)

    /** Opens the modal from the "Add Phone" row (account without a number). */
    async clickAddPhoneRow(): Promise<void> {
        await expect(this.addPhoneRow, 'Add phone row is not visible').toBeVisible();
        await expect(this.addPhoneRow, 'Add phone row is not enabled').toBeEnabled();
        await this.addPhoneRow.click();
        await expect(this.phoneFormStep, 'Phone form step is not visible').toBeVisible();
    }

    /** Opens the modal from the Change button (account that already has a number). */
    async clickChangePhoneBtn(): Promise<void> {
        await expect(this.changePhoneBtn, 'Change phone button is not visible').toBeVisible();
        await expect(this.changePhoneBtn, 'Change phone button is not enabled').toBeEnabled();
        await this.changePhoneBtn.click();
        await expect(this.phoneFormStep, 'Phone form step is not visible').toBeVisible();
    }

    /**
     * Fills the number. The field holds the national part only — the country code comes from
     * the selector, which defaults to US — so a `+1…` E.164 number is stripped of its prefix.
     */
    async fillPhoneNumber(phone: string): Promise<void> {
        await expect(this.phoneInput, 'Phone input is not visible').toBeVisible();
        await expect(this.phoneInput, 'Phone input is not editable').toBeEditable();
        await this.phoneInput.fill(phone.startsWith('+1') ? phone.slice(2) : phone);
    }

    async fillPhonePassword(password: string): Promise<void> {
        await expect(this.phonePasswordInput, 'Phone current-password input is not visible').toBeVisible();
        await expect(this.phonePasswordInput, 'Phone current-password input is not editable').toBeEditable();
        await this.phonePasswordInput.fill(password);
    }

    /** Submits the form step and returns the POST /api/account/phone response. */
    async submitPhoneFormAndGetResponse(): Promise<import('@playwright/test').Response> {
        await expect(this.phoneContinueBtn, 'Phone continue button is not visible').toBeVisible();
        await expect(this.phoneContinueBtn, 'Phone continue button is not enabled').toBeEnabled();
        const responsePromise = this.page.waitForResponse(
            res => res.url().includes('/api/account/phone')
                && !res.url().includes('/verify')
                && res.request().method() === 'POST',
            { timeout: 30_000 }
        );
        await this.phoneContinueBtn.click();
        return await responsePromise;
    }

    /**
     * Types the 4-digit code and returns the POST /api/account/phone/verify response.
     * The boxes keep the previous code after a failed attempt (W3-2808 comment #3), and an
     * unchanged value fires no request — so they are cleared before every attempt.
     */
    async fillPhoneCodeAndGetResponse(code: string): Promise<import('@playwright/test').Response> {
        await expect(this.phoneOtpInputs.first(), 'Phone OTP input is not visible').toBeVisible();
        for (let i = code.length - 1; i >= 0; i--) {
            await this.phoneOtpInputs.nth(i).fill('');
        }
        const responsePromise = this.page.waitForResponse(
            res => res.url().includes('/api/account/phone/verify') && res.request().method() === 'POST',
            { timeout: 30_000 }
        );
        for (let i = 0; i < code.length; i++) {
            await this.phoneOtpInputs.nth(i).fill(code[i]);
        }
        return await responsePromise;
    }

    /** Full add/change journey: form step -> OTP step -> success step (modal left open). */
    async submitPhone(phone: string, currentPassword: string, code = STATIC_OTP_CODE): Promise<void> {
        await this.fillPhoneNumber(phone);
        await this.fillPhonePassword(currentPassword);
        const startResponse = await this.submitPhoneFormAndGetResponse();
        expect(startResponse.status(), 'Phone start request should succeed').toBe(200);
        const verifyResponse = await this.fillPhoneCodeAndGetResponse(code);
        expect(verifyResponse.status(), 'Phone verify request should succeed').toBe(204);
        await expect(this.phoneSuccessStep, 'Phone success step is not visible').toBeVisible();
    }

    async clickPhoneFinishBtn(): Promise<void> {
        await expect(this.phoneFinishBtn, 'Phone finish button is not visible').toBeVisible();
        await expect(this.phoneFinishBtn, 'Phone finish button is not enabled').toBeEnabled();
        await this.phoneFinishBtn.click();
        await expect(this.phoneModal, 'Phone modal did not close').toBeHidden();
    }

    async closePhoneModal(): Promise<void> {
        await expect(this.phoneCloseBtn, 'Phone close button is not visible').toBeVisible();
        await expect(this.phoneCloseBtn, 'Phone close button is not enabled').toBeEnabled();
        await this.phoneCloseBtn.click();
        await expect(this.phoneModal, 'Phone modal did not close').toBeHidden();
    }

    async clickPhoneOtpEditBtn(): Promise<void> {
        await expect(this.phoneOtpEditBtn, 'OTP edit button is not visible').toBeVisible();
        await expect(this.phoneOtpEditBtn, 'OTP edit button is not enabled').toBeEnabled();
        await this.phoneOtpEditBtn.click();
        await expect(this.phoneFormStep, 'Phone form step is not visible after Edit').toBeVisible();
    }

    /** The row renders the number in international format, e.g. +1 201 555 0123. */
    async assertDisplayedPhone(phone: string): Promise<void> {
        await expect(this.phoneValue, 'Phone number is not visible').toBeVisible();
        await expect(this.phoneValue, 'Phone number is not displayed correctly').toHaveText(formatPhoneInternational(phone));
    }

    async assertPhoneModalError(message: string | RegExp): Promise<void> {
        await expect(this.phoneModal.getByText(message), `Phone modal should show the error "${message}"`).toBeVisible();
    }

    async assertPhoneModalErrorAbsent(message: string | RegExp): Promise<void> {
        await expect(this.phoneModal.getByText(message), `Phone modal should not show the error "${message}"`).toBeHidden();
    }

    // CONNECTED ACCOUNTS (Google / Apple / Telegram) — locators are parameterized by provider

    connectedAccountRow(provider: SocialProvider): Locator {
        return this.page.getByTestId(`aitv-security-connected-row-${provider}`);
    }

    connectAccountBtn(provider: SocialProvider): Locator {
        return this.page.getByTestId(`aitv-security-connect-btn-${provider}`);
    }

    connectedAccountChip(provider: SocialProvider): Locator {
        return this.page.getByTestId(`aitv-security-connected-chip-${provider}`);
    }

    disconnectAccountBtn(provider: SocialProvider): Locator {
        return this.page.getByTestId(`aitv-security-disconnect-btn-${provider}`);
    }

    /** The provider is offered but not linked: a Connect button, no chip and no Disconnect. */
    async assertSocialNotConnected(provider: SocialProvider): Promise<void> {
        await expect(this.connectedAccountRow(provider), `${provider} row is not visible`).toBeVisible();
        await expect(this.connectAccountBtn(provider), `${provider} Connect button is not visible`).toBeVisible();
        await expect(this.connectAccountBtn(provider), `${provider} Connect button is not enabled`).toBeEnabled();
        await expect(this.connectedAccountChip(provider), `${provider} must not be shown as connected`).toBeHidden();
        await expect(this.disconnectAccountBtn(provider), `${provider} must not offer Disconnect`).toBeHidden();
    }

    async assertNoSocialConnected(providers: SocialProvider[] = SOCIAL_PROVIDERS): Promise<void> {
        for (const provider of providers) {
            await this.assertSocialNotConnected(provider);
        }
    }

    // ADD WALLET (email-only user) — opens the wallet selector (wallet-selector-<rdns>)
    async clickAddWalletBtn(): Promise<void> {
        await expect(this.noWalletRow, 'Add wallet row is not visible').toBeVisible();
        await expect(this.noWalletRow, 'Add wallet row is not enabled').toBeEnabled();
        await this.noWalletRow.click();
    }

    // CHANGE PASSWORD METHODS
    async clickEditPasswordBtn(): Promise<void> {
        await expect(this.passwordRow, 'Change password row is not enabled').toBeEnabled();
        await this.passwordRow.click();
        await expect(this.passwordModal, 'Change password modal is not visible').toBeVisible();
    }

    async fillOldPassword(password: string): Promise<void> {
        await expect(this.currentPasswordInput, 'Current password input is not editable').toBeEditable();
        await this.currentPasswordInput.click();
        await this.currentPasswordInput.fill(password);
    }

    async fillNewPassword(password: string): Promise<void> {
        await expect(this.newPasswordInput, 'New password input is not editable').toBeEditable();
        await this.newPasswordInput.click();
        await this.newPasswordInput.fill(password);
    }

    async fillConfirmPassword(password: string): Promise<void> {
        await expect(this.repeatPasswordInput, 'Repeat password input is not editable').toBeEditable();
        await this.repeatPasswordInput.click();
        await this.repeatPasswordInput.fill(password);
    }

    async clickPasswordConfirmBtn(): Promise<void> {
        await expect(this.passwordConfirmBtn, 'Confirm button is not enabled').toBeEnabled();
        await this.passwordConfirmBtn.click();
    }

    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        await this.clickEditPasswordBtn();
        await this.fillOldPassword(oldPassword);
        await this.fillNewPassword(newPassword);
        await this.fillConfirmPassword(newPassword);
        await this.clickPasswordConfirmBtn();
        // The change is confirmed via an email link; the modal advances to a "sent" step.
        await expect(this.passwordSentStep, 'Password change sent-step is not visible').toBeVisible();
        await this.closePasswordModal();
    }

    /**
     * SET PASSWORD (account without one, e.g. wallet-registered with attached email).
     * The "No password set" row opens the same aitv-password-modal but in a create
     * step WITHOUT the current-password field; the creation is confirmed via an
     * email link (the modal advances to the "sent" step).
     */
    async setPassword(newPassword: string): Promise<void> {
        await expect(this.noPasswordRow, 'Create password row is not visible').toBeVisible();
        await expect(this.noPasswordRow, 'Create password row is not enabled').toBeEnabled();
        await this.noPasswordRow.click();
        await expect(this.passwordModal, 'Create password modal is not visible').toBeVisible();
        await this.fillNewPassword(newPassword);
        await this.fillConfirmPassword(newPassword);
        await this.clickPasswordConfirmBtn();
        await expect(this.passwordSentStep, 'Password creation sent-step is not visible').toBeVisible({ timeout: 15_000 });
        await this.closePasswordModal();
    }

    async closePasswordModal(): Promise<void> {
        await expect(this.passwordCloseBtn, 'Password modal close button is not visible').toBeVisible();
        await this.passwordCloseBtn.click();
        await expect(this.passwordModal, 'Password modal did not close').toBeHidden();
    }

    // ADD EMAIL (wallet-only user) — opens the same aitv-email-modal ("Add Email", no password field)
    async clickAddEmailBtn(): Promise<void> {
        await expect(this.addEmailRow, 'Add email row is not visible').toBeVisible();
        await expect(this.addEmailRow, 'Add email row is not enabled').toBeEnabled();
        await this.addEmailRow.click();
        await expect(this.emailModal, 'Add email modal is not visible').toBeVisible();
    }

    async fillAndSubmitAddEmail(newEmail: string): Promise<void> {
        await this.fillNewEmail(newEmail);
        await this.clickEmailContinueBtn();
    }

    // CHANGE EMAIL METHODS
    async clickEditEmailBtn(): Promise<void> {
        await expect(this.changeEmailBtn, 'Change email button is not enabled').toBeEnabled();
        await this.changeEmailBtn.click();
        await expect(this.emailModal, 'Change email modal is not visible').toBeVisible();
    }

    async fillNewEmail(email: string): Promise<void> {
        await expect(this.newEmailInput, 'New email input is not editable').toBeEditable();
        await this.newEmailInput.click();
        await this.newEmailInput.fill(email);
    }

    async fillEmailPassword(password: string): Promise<void> {
        await expect(this.emailPasswordInput, 'Email password input is not editable').toBeEditable();
        await this.emailPasswordInput.click();
        await this.emailPasswordInput.fill(password);
    }

    async clickEmailContinueBtn(): Promise<void> {
        await expect(this.emailContinueBtn, 'Continue button is not enabled').toBeEnabled();
        await this.emailContinueBtn.click();
    }

    // The modal pops up on its own: the FE polls the profile and shows it as soon as the new
    // email is applied (for a wallet-only account the backend applies it right after PUT).
    async waitForEmailChangedModal(): Promise<void> {
        await expect(this.emailChangedModal, 'Email changed modal did not appear').toBeVisible({ timeout: 30_000 });
    }

    async clickEmailChangedSignIn(): Promise<void> {
        await expect(this.emailSignInBtn, 'Sign In button is not visible').toBeVisible();
        await expect(this.emailSignInBtn, 'Sign In button is not enabled').toBeEnabled();
        await this.emailSignInBtn.click();
    }

    async verifyEmailConfirmationAlert(): Promise<void> {
        // The old toast is gone — the modal advances to an in-modal "sent" step instead.
        await expect(this.emailSentStep, 'Email change sent-step is not visible').toBeVisible();
    }

    async fillAndSubmitEmailChange(email: string, newEmail: string, password: string): Promise<void> {
        await this.assertDisplayedEmail(email);
        await this.clickEditEmailBtn();
        await this.fillNewEmail(newEmail);
        await this.fillEmailPassword(password);
        await this.clickEmailContinueBtn();
    }

    async changeEmail(email: string, newEmail: string, password: string): Promise<void> {
        await this.fillAndSubmitEmailChange(email, newEmail, password);
        await this.verifyEmailConfirmationAlert();
        await this.closeEmailModal();
    }

    async closeEmailModal(): Promise<void> {
        await expect(this.emailCloseBtn, 'Email modal close button is not visible').toBeVisible();
        await this.emailCloseBtn.click();
        await expect(this.emailModal, 'Email modal did not close').toBeHidden();
    }

    // Negative: attempting to switch to an address that already belongs to another account.
    async assertEmailAlreadyRegisteredError(): Promise<void> {
        await expect(this.emailAlreadyExistsError, 'Duplicate-email error message is not shown').toBeVisible({ timeout: 10_000 });
        await expect(this.emailAlreadyExistsError, 'Duplicate-email error text is incorrect')
            .toHaveText('An account already exists for this email.');
        await expect(this.emailSentStep, 'Success sent-step must not appear for a taken email').toBeHidden();
    }

    // 2FA METHODS
    // NOTE: pre-redesign, currently unused. The locators above were written for the OLD
    // Security page and have NOT been re-verified against the redesigned /account UI — check
    // them before enabling any 2FA test.
    async setup2FA(email: string): Promise<void> {
        await this.toggleTwoFA(email, true);
    }

    async disable2FA(email: string): Promise<void> {
        await this.toggleTwoFA(email, false);
    }

    private async toggleTwoFA(email: string, enable: boolean): Promise<void> {
        await expect(this.setUpBtn, 'Set Up button is not visible').toBeVisible();
        await expect(this.setUpBtn, 'Set Up button is not enabled').toBeEnabled();
        await this.setUpBtn.click();
        await expect(this.passwordMessage, '2FA description is not shown').toContainText('two-factor authorization');
        await expect(this.passwordMessage, 'User email is not shown in the 2FA description').toContainText(email);
        await expect(this.twoFaPasswordInput, 'Password input is not visible').toBeVisible();
        await expect(this.twoFaPasswordInput, 'Password input is not editable').toBeEditable();
        await this.twoFaPasswordInput.click();
        await this.twoFaPasswordInput.fill(process.env.USER_PASSWORD!);
        await expect(this.twoFaCheckbox, '2FA checkbox is not visible').toBeVisible();
        await expect(this.twoFaCheckbox, '2FA checkbox is not enabled').toBeEnabled();
        if (enable) {
            await this.twoFaCheckbox.check();
        } else {
            await this.twoFaCheckbox.uncheck();
        }
        const setResponse = this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/set') &&
            res.status() === 200,
            { timeout: 15000 }
        );
        await expect(this.twoFaSubmitBtn, 'Submit button is not visible').toBeVisible();
        await expect(this.twoFaSubmitBtn, 'Submit button is not enabled').toBeEnabled();
        await this.twoFaSubmitBtn.click();
        await setResponse;
        await expect(this.twoFaSuccessToast, 'Success toast is not visible').toBeVisible();
    }
}
