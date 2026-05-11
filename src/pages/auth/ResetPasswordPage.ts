import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ResetPasswordPage {
  readonly page: Page;

  // Password fields
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  // Button
  readonly changePasswordBtn: Locator;

  // Messages
  readonly titleText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Password input fields
    this.passwordInput = page.locator('input[name="password"]');
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');

    // Change password button
    this.changePasswordBtn = page.getByRole('button', { name: 'Change Password' });

    
    this.titleText = page.getByText('Enter your Ai.tv username');
  }

  async fillPasswordInput(password: string): Promise<void> {
    await this.passwordInput.click();
    await this.passwordInput.pressSequentially(password);
  }

  async fillConfirmPasswordInput(password: string): Promise<void> {
    await this.confirmPasswordInput.click();
    await this.confirmPasswordInput.pressSequentially(password);
  }

  async clickChangePasswordBtn(): Promise<void> {
    await this.changePasswordBtn.click();
  }

  async verifyPasswordValue(password: string): Promise<void> {
    await expect(this.passwordInput).toHaveValue(password);
  }

  async verifyConfirmPasswordValue(password: string): Promise<void> {
    await expect(this.confirmPasswordInput).toHaveValue(password);
  }

  async verifyPasswordFieldsVisible(): Promise<void> {
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
  }

  async verifyPasswordFieldsEditable(): Promise<void> {
    await expect(this.passwordInput).toBeEditable();
    await expect(this.confirmPasswordInput).toBeEditable();
  }

  async verifyChangePasswordBtnEnabled(): Promise<void> {
    await expect(this.changePasswordBtn).toBeEnabled();
  }

  async verifyChangePasswordBtnDisabled(): Promise<void> {
    await expect(this.changePasswordBtn).toBeDisabled();
  }

  
  async resetPassword(newPassword: string): Promise<void> {
    await this.fillPasswordInput(newPassword);
    await this.fillConfirmPasswordInput(newPassword);
    await this.verifyPasswordValue(newPassword);
    await this.verifyConfirmPasswordValue(newPassword);
    await this.verifyChangePasswordBtnEnabled();
  }

  async fillPasswordsWithMismatch(password: string, confirmPassword: string): Promise<void> {
    await this.fillPasswordInput(password);
    await this.fillConfirmPasswordInput(confirmPassword);
  }
}
