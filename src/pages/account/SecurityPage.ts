import { expect, Locator, Page } from '@playwright/test';

export class SecurityPage {
    readonly page: Page;
    readonly profileAvatar: Locator;
    readonly setUpBtn: Locator;
    readonly passwordMessage: Locator;
    readonly passwordInput: Locator;
    readonly twoFaCheckbox: Locator;
    readonly submitBtn: Locator;
    readonly successToast: Locator;

    constructor(page: Page) {
        this.page = page;
        this.profileAvatar = page.getByTestId('edit-profile-form').locator('img');
        this.setUpBtn = page.getByRole('button', { name: 'Set Up' });
        this.passwordMessage = page.locator('#check-password-2fa');
        this.passwordInput = page.getByRole('textbox', { name: 'Enter password' });
        this.twoFaCheckbox = page.getByRole('checkbox');
        this.submitBtn = page.getByRole('button', { name: 'Submit' });
        this.successToast = page.getByText('Setting updated!');
    }

    async setup2FA(email: string) {
        await this.toggleTwoFA(email, true);
    }

    async disable2FA(email: string) {
        await this.toggleTwoFA(email, false);
    }

    private async toggleTwoFA(email: string, enable: boolean) {
        await expect(this.setUpBtn, 'Set Up button is not visible').toBeVisible();
        await expect(this.setUpBtn, 'Set Up button is not enabled').toBeEnabled();
        await this.setUpBtn.click();
        await expect(this.passwordMessage, '2FA description is not shown').toContainText('two-factor authorization');
        await expect(this.passwordMessage, 'User email is not shown in the 2FA description').toContainText(email);
        await expect(this.passwordInput, 'Password input is not visible').toBeVisible();
        await expect(this.passwordInput, 'Password input is not editable').toBeEditable();
        await this.passwordInput.click();
        await this.passwordInput.fill(process.env.USER_PASSWORD!);
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
        await expect(this.submitBtn, 'Submit button is not visible').toBeVisible();
        await expect(this.submitBtn, 'Submit button is not enabled').toBeEnabled();
        await this.submitBtn.click();
        await setResponse;
        await expect(this.successToast, 'Success toast is not visible').toBeVisible();
    }
}