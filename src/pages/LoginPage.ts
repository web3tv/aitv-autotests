import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';


export class LoginPage {
  // private username: string = '';

  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginBtn: Locator;
  readonly usernameInput: Locator;
  readonly checkbox: Locator;
  readonly emailBtn: Locator;
  readonly emailInputRegistration: Locator;
  readonly firstPassword: Locator;
  readonly secondPassword: Locator;
  readonly createAccountBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByRole('textbox', { name: 'Enter email or username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Enter password' });
    this.loginBtn = page.getByRole('button', { name: 'Login' });

    // REGISTRATION PAGE
    this.usernameInput = page.getByRole('textbox', { name: 'Enter username' });
    this.checkbox = page.getByRole('checkbox');
    this.emailBtn = page.getByRole('button', { name: 'Continue with email' });
    this.emailInputRegistration = page.getByRole('textbox', { name: 'Enter email' });
    this.firstPassword = page.getByRole('textbox', { name: 'Enter password' });
    this.secondPassword = page.getByRole('textbox', { name: 'Retype Password' });
    this.createAccountBtn = page.getByRole('button', { name: 'Create Account' });
  }

  async visitLoginPage() {
    await this.page.goto('/login');
  }

  async fillEmailInput(email:string){
    await this.emailInput.fill(email);
  }

  async fillPasswordInput(password:string){
    await this.passwordInput.fill(password);
  }

  async clickLoginBtn(){
     await this.loginBtn.click();
  }

  async removeFocusFromElement(){
     await this.page.click('body');
  }
  
  async fillUsernameInput(username?: string) {
    const finalUsername = username ?? `autotest_${Date.now()}`;

    await expect(this.usernameInput).toBeEditable();
    await this.usernameInput.fill(finalUsername);
    await expect(this.usernameInput).toHaveValue(finalUsername)
    // await this.page.waitForResponse((response) =>
    //     response.url().startsWith('https://api.web3tv.dev/handles/check') &&
    //     response.status() === 200,
    //     { timeout: 15_000 }
    // );
  }

  async clickCheckbox() {
    await expect(this.checkbox).toBeVisible();
    await this.checkbox.check();  
  }

  async clickContinueWithEmail() {
    await expect(this.emailBtn).toBeEnabled();
    await this.emailBtn.click();
    await expect(this.page.getByText('Enter your email address')).toBeVisible();
    // await expect(this.page.getByText('Enter your email address,')).toBeVisible();
  }

  async fillEmailRegistrationInput(email: any) {
    await expect(this.emailInputRegistration).toBeEditable();
    await this.emailInputRegistration.fill(email);
  }

  async fillFirstPassword(firstPassword:any) {
    await expect(this.firstPassword).toBeEditable();
    await this.firstPassword.fill(firstPassword);
  }
  
  async fillSecondPassword(secondPassword:any) {
    await expect(this.secondPassword).toBeEditable();
    await this.secondPassword.fill(secondPassword);
  }
  
  async clickCreateAccountBtn(email: any) {
    await expect(this.createAccountBtn).toBeEnabled();
    await this.createAccountBtn.click();
    await expect(this.page.locator('body')).toContainText('Please check your email for the verification link sent to:');
    await expect(this.page.locator('body')).toContainText(email);
  }
}
