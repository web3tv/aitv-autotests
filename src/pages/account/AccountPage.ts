import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class AccountPage {

    readonly page: Page;

    // Edit buttons
    readonly editPasswordBtn: Locator;
    readonly editEmailBtn: Locator;

    // Password inputs
    readonly oldPasswordInput: Locator;
    readonly newPasswordInput: Locator;
    readonly confirmPasswordInput: Locator;

    // Email inputs
    readonly newEmailInput: Locator;
    readonly emailPasswordInput: Locator;

    // Buttons
    readonly submitBtn: Locator;

    // Messages
    readonly emailConfirmationAlert: Locator;

    constructor(page: Page) {
        this.page = page;

        // Edit buttons
        this.editPasswordBtn = page.getByRole('button', { name: 'Edit' }).nth(1);
        this.editEmailBtn = page.getByRole('button', { name: 'Edit' }).first();

        // Password input fields
        this.oldPasswordInput = page.locator('input[name="oldPassword"]');
        this.newPasswordInput = page.locator('input[name="newPassword"]');
        this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');

        // Email input fields
        this.newEmailInput = page.locator('input[name="newEmail"]');
        this.emailPasswordInput = page.getByRole('textbox', { name: 'Enter password' });

        // Submit button
        this.submitBtn = page.getByRole('button', { name: 'Submit' });

        // Alert messages
        this.emailConfirmationAlert = page.getByRole('alert').filter({ hasText: 'Please check your email for' });
    }



    // CHANGE PASSWORD METHODS
    async clickEditPasswordBtn(): Promise<void> {
        await expect(this.editPasswordBtn).toBeEnabled();
        await this.editPasswordBtn.click();
    }

    async fillOldPassword(password: string): Promise<void> {
        await expect(this.oldPasswordInput).toBeEditable();
        await this.oldPasswordInput.click();
        await this.oldPasswordInput.fill(password);
    }

    async fillNewPassword(password: string): Promise<void> {
        await expect(this.newPasswordInput).toBeEditable();
        await this.newPasswordInput.click();
        await this.newPasswordInput.fill(password);
    }

    async fillConfirmPassword(password: string): Promise<void> {
        await expect(this.confirmPasswordInput).toBeEditable();
        await this.confirmPasswordInput.click();
        await this.confirmPasswordInput.fill(password);
    }

    async clickSubmitBtn(): Promise<void> {
        await expect(this.submitBtn).toBeEnabled();
        await this.submitBtn.click();
    }

    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        await this.clickEditPasswordBtn();
        await this.fillOldPassword(oldPassword);
        await this.fillNewPassword(newPassword);
        await this.fillConfirmPassword(newPassword);
        await this.clickSubmitBtn();
        await expect(this.page.getByLabel('Edit Password')).toContainText('You are almost there!We\'ve sent you an email. Please confirm password change.');
        await this.page.getByRole('button').click();
    }



    // CHANGE EMAIL METHODS
    async clickEditEmailBtn(): Promise<void> {
        await expect(this.editEmailBtn).toBeEnabled();
        await this.editEmailBtn.click();
    }

    async fillNewEmail(email: string): Promise<void> {
        await expect(this.newEmailInput).toBeEditable();
        await this.newEmailInput.click();
        await this.newEmailInput.fill(email);
    }

    async fillEmailPassword(password: string): Promise<void> {
        await expect(this.emailPasswordInput).toBeEditable();
        await this.emailPasswordInput.click();
        await this.emailPasswordInput.fill(password);
    }

    async verifyEmailConfirmationAlert(): Promise<void> {
        await expect(this.emailConfirmationAlert).toBeVisible();
    }

    async changeEmail(newEmail: string, password: string): Promise<void> {
        await this.clickEditEmailBtn();
        await this.fillNewEmail(newEmail);
        await this.fillEmailPassword(password);
        await this.clickSubmitBtn();
        await this.verifyEmailConfirmationAlert();
    }



}