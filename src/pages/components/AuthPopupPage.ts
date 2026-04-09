import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class AuthPopupPage {
    readonly page: Page;

    readonly dialog: Locator;
    readonly createAccountBtn: Locator;
    readonly loginBtn: Locator;
    readonly closeBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dialog = page.getByRole('dialog');
        this.createAccountBtn = this.dialog.getByRole('button', { name: /Create account/i });
        this.loginBtn = this.dialog.getByRole('button', { name: /Login/i });
        this.closeBtn = this.dialog.locator('svg').first();
    }

    async assertPopupVisible(): Promise<void> {
        await expect(this.dialog, 'Auth popup is not visible').toBeVisible({ timeout: 10_000 });
        await expect(this.dialog, 'Auth popup does not contain "Almost there!" title').toContainText('Almost there!');
    }

    async clickCreateAccount(): Promise<void> {
        await expect(this.createAccountBtn, 'Create account button is not visible').toBeVisible();
        await expect(this.createAccountBtn, 'Create account button is not enabled').toBeEnabled();
        await this.createAccountBtn.click();
    }

    async clickLogin(): Promise<void> {
        await expect(this.loginBtn, 'Login button is not visible').toBeVisible();
        await expect(this.loginBtn, 'Login button is not enabled').toBeEnabled();
        await this.loginBtn.click();
    }

    async closePopup(): Promise<void> {
        await expect(this.closeBtn, 'Close button is not visible').toBeVisible();
        await expect(this.closeBtn, 'Close button is not enabled').toBeEnabled();
        await this.closeBtn.click();
        await expect(this.dialog, 'Auth popup should be hidden after close').toBeHidden({ timeout: 5_000 });
    }
}
