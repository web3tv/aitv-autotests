import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';


export class LoginPage {
  // private username: string = '';

  readonly page: Page;

  // LOGIN 
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginBtn: Locator;
  

  // REGISTRATION
  readonly usernameInput: Locator;
  readonly emailInputRegistration: Locator;
  readonly errorMessage: Locator;
  readonly checkbox: Locator;
  readonly firstPassword: Locator;
  readonly secondPassword: Locator;
  readonly createAccountBtn: Locator;


  readonly registerWalletBtn: Locator;
  readonly registerEmailBtn: Locator;
  readonly telegramLoginBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // LOGIN PAGE
    this.emailInput = page.getByRole('textbox', { name: 'Enter email or username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Enter password' });
    this.loginBtn = page.getByRole('button', { name: 'Login' });

    // REGISTRATION PAGE
    this.usernameInput = page.getByRole('textbox', { name: 'Enter username' });
    this.errorMessage = page.getByText(/handle|username/i);
    this.checkbox = page.getByRole('checkbox');
    this.registerEmailBtn = page.getByRole('button', { name: 'Continue with email' });
    this.emailInputRegistration = page.getByRole('textbox', { name: 'Enter email' });
    this.firstPassword = page.getByRole('textbox', { name: 'Enter password' });
    this.secondPassword = page.getByRole('textbox', { name: 'Retype Password' });
    this.createAccountBtn = page.getByRole('button', { name: 'Create Account' });

    this.registerWalletBtn = page.locator('[data-id="register-wallet"]');
    this.registerEmailBtn = page.locator('[data-id="register-email"]');
    this.telegramLoginBtn = page.locator('[data-id="telegram-login"]');
  }

  async visitLoginPage() {
    await this.page.goto('/login');
  }

  async fillEmailInput(email:string){
    await expect(this.emailInput).toBeEditable({ timeout: 15000 });
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
    await expect(this.registerEmailBtn).toBeEnabled();
    await this.registerEmailBtn.click();
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

  async blur() {
    await this.page.click('body');
  }

  async setUsernameAndBlur(value: string) {
    await this.usernameInput.fill(value);
    await this.blur();
  }

  async assertError(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
    //await expect(this.page.getByText(text)).toBeVisible();
  }

  async assertLowercased(expected: string) {
    await expect(this.usernameInput).toHaveValue(expected);
  }

  async assertButtonsDisabled() {
    await expect(this.registerWalletBtn).toBeDisabled();
    await expect(this.registerEmailBtn).toBeDisabled();
    await expect(this.telegramLoginBtn).toBeDisabled();
  }

}
