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
        await this.setUpBtn.click();
        await expect(this.passwordMessage).toContainText(`After enabling two-factor authorization you have to confirm every authorization using ${email}`);
        await this.passwordInput.click();
        await this.passwordInput.fill('Admin1@@');
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
        await this.submitBtn.click();
        await setResponse;
        await expect(this.successToast).toBeVisible();
    }
}