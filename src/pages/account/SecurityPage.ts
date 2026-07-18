import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Security tab of the redesigned /account page: email / password / wallet, plus 2FA.
 */
export class SecurityPage {

    readonly page: Page;

    // Security tab — row entries
    readonly emailValue: Locator;
    readonly changeEmailBtn: Locator;
    readonly passwordRow: Locator;
    readonly addEmailRow: Locator;      // wallet-only account: "Add Email"
    readonly noWalletRow: Locator;      // email account: "No wallet added"
    readonly walletValue: Locator;      // wallet account: connected address

    // Change-email modal (aitv-email-modal)
    readonly emailModal: Locator;
    readonly emailCurrentValue: Locator;
    readonly newEmailInput: Locator;
    readonly emailPasswordInput: Locator;
    readonly emailContinueBtn: Locator;
    readonly emailSentStep: Locator;
    readonly emailCloseBtn: Locator;

    // Change-password modal (aitv-password-modal)
    readonly passwordModal: Locator;
    readonly currentPasswordInput: Locator;
    readonly newPasswordInput: Locator;
    readonly repeatPasswordInput: Locator;
    readonly passwordConfirmBtn: Locator;
    readonly passwordSentStep: Locator;
    readonly passwordCloseBtn: Locator;

    // Wallet
    readonly walletAddedToast: Locator;

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
        this.addEmailRow = page.getByTestId('aitv-security-add-email-row');
        this.noWalletRow = page.getByTestId('aitv-security-no-wallet-row');
        this.walletValue = page.getByTestId('aitv-security-wallet-value');

        // Change-email modal
        this.emailModal = page.getByTestId('aitv-email-modal');
        this.emailCurrentValue = page.getByTestId('aitv-email-current-value');
        this.newEmailInput = page.getByTestId('aitv-email-new-input');
        this.emailPasswordInput = page.getByTestId('aitv-email-password-input');
        this.emailContinueBtn = page.getByTestId('aitv-email-continue-btn');
        this.emailSentStep = page.getByTestId('aitv-email-sent-step');
        this.emailCloseBtn = page.getByTestId('aitv-email-close-btn');

        // Change-password modal
        this.passwordModal = page.getByTestId('aitv-password-modal');
        this.currentPasswordInput = page.getByTestId('aitv-password-current-input');
        this.newPasswordInput = page.getByTestId('aitv-password-new-input');
        this.repeatPasswordInput = page.getByTestId('aitv-password-repeat-input');
        this.passwordConfirmBtn = page.getByTestId('aitv-password-confirm-btn');
        this.passwordSentStep = page.getByTestId('aitv-password-sent-step');
        this.passwordCloseBtn = page.getByTestId('aitv-password-close-btn');

        // Wallet
        this.walletAddedToast = page.getByText('Wallet successfully added!');

        // Negative
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

    // ADD WALLET (email-only user) — opens the wallet selector (wallet-selector-<rdns>)
    async clickAddWalletBtn(): Promise<void> {
        await expect(this.noWalletRow, 'Add wallet row is not visible').toBeVisible();
        await expect(this.noWalletRow, 'Add wallet row is not enabled').toBeEnabled();
        await this.noWalletRow.click();
    }

    async assertWalletAddedToast(): Promise<void> {
        await expect(this.walletAddedToast, 'Wallet added confirmation toast is not visible').toBeVisible({ timeout: 15_000 });
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
