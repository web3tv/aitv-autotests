import { Page, Locator, expect } from "@playwright/test";

export class ForgotPasswordPage {
  readonly page: Page;

  readonly forgotPasswordLink: Locator;
  readonly titleText: Locator;
  readonly emailInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password?' });
    this.titleText = page.getByText('Enter your Ai.tv username');
    this.emailInput = page.getByRole('textbox', { name: 'Enter email address' });
    this.submitBtn = page.getByRole('button', { name: 'Submit' });
  }

  async openForm() {
    await expect(this.forgotPasswordLink, 'Forgot password link is not visible').toBeVisible({ timeout: 15000 });
    await this.forgotPasswordLink.click();
    await expect(this.titleText, 'Title text is not visible').toBeVisible({ timeout: 15000 });
  }

  async fillEmail(email: string) {
    await expect(this.emailInput, 'Email input is not editable').toBeEditable({ timeout: 15000 });
    await this.emailInput.click();
    await this.emailInput.fill(email);
    await expect(this.emailInput, 'Email input has wrong value').toHaveValue(email);
  }

  async submitRequest() {
    await expect(this.submitBtn, 'Submit button is not enabled').toBeEnabled({ timeout: 15000 });
    await this.submitBtn.click();
  }
}
