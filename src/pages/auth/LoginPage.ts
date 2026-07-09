import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { type EvmWalletType, getWalletRdns } from '../../utils/walletMock';


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
  readonly enterEmailPrompt: Locator;
  readonly body: Locator;


  readonly registerWalletBtn: Locator;
  readonly registerEmailBtn: Locator;
  readonly telegramLoginBtn: Locator;

  // Login page wallet/telegram buttons
  readonly walletLoginBtn: Locator;

  // Wallet selection modal (Reown)
  readonly metamaskOption: Locator;
  readonly heroWalletOption: Locator;
  readonly binanceWalletOption: Locator;
  readonly trustWalletOption: Locator;
  readonly metamaskBrowserTab: Locator;

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
    this.emailInputRegistration = page.getByRole('textbox', { name: 'Enter email' });
    this.firstPassword = page.getByRole('textbox', { name: 'Enter password' });
    this.secondPassword = page.getByRole('textbox', { name: 'Retype Password' });
    this.createAccountBtn = page.getByRole('button', { name: 'Create Account' });
    this.enterEmailPrompt = page.getByText('Enter your email address');
    this.body = page.locator('body');

    this.registerWalletBtn = page.locator('[data-id="register-wallet"]');
    this.registerEmailBtn = page.locator('[data-id="register-email"]');
    this.telegramLoginBtn = page.locator('[data-id="telegram-login"]');

    // Login page — wallet login button
    this.walletLoginBtn = page.locator('[data-id="wallet-login"]');

    // Wallet options inside the Reown wallet selection modal (target injected/INSTALLED by testId)
    this.metamaskOption = page.getByTestId('wallet-selector-io.metamask');
    this.heroWalletOption = page.getByTestId('wallet-selector-app.aspect.herowallet');
    this.binanceWalletOption = page.getByTestId('wallet-selector-com.binance.w3w');
    this.trustWalletOption = page.getByTestId('wallet-selector-com.trustwallet.app');
    this.metamaskBrowserTab = page.getByRole('button', { name: /browser/i });
  }

  async fillEmailInput(email:string){
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await expect(this.emailInput, 'Email input has wrong value').toHaveValue(email);
  }

  async fillPasswordInput(password:string){
    await this.passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.passwordInput.click();
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    await expect(this.passwordInput, 'Password input has wrong value').toHaveValue(password);
  }

  async clickLoginBtn(){
    await expect(this.loginBtn, 'Login button should be enabled before clicking').toBeEnabled({ timeout: 15000 });
    await this.loginBtn.click();
  }

  async removeFocusFromElement(){
     await this.page.click('body');
  }
  
  // Here we check the input for compliance.
  async fillUsernameInput(username?: string) {
    const finalUsername = username ?? `autotest_${Date.now()}`;

    await expect(this.usernameInput, 'Username input is not editable').toBeEditable();
    await this.usernameInput.fill(finalUsername);
    await expect(this.usernameInput, 'Username input has wrong value').toHaveValue(finalUsername)
    return finalUsername;
  }

  // Here we do not check the input for compliance. 
  async fillUsernameInput2(username?: string) {
    const finalUsername = username ?? `autotest_${Date.now()}`;

    await expect(this.usernameInput, 'Username input is not editable').toBeEditable();
    await this.usernameInput.fill(finalUsername);
  }

  async clickCheckbox() {
    await expect(this.checkbox, 'Checkbox is not visible').toBeVisible();
    await this.checkbox.click({ force: true });
  }

  async clickContinueWithEmail() {
    await expect(this.registerEmailBtn, 'Register email button is not enabled').toBeEnabled();
    await this.registerEmailBtn.click();
    await expect(this.enterEmailPrompt, 'Enter-email prompt is not visible').toBeVisible();
  }

  async fillEmailRegistrationInput(email: any) {
    await expect(this.emailInputRegistration, 'Email input registration is not editable').toBeEditable();
    await this.emailInputRegistration.fill(email);
  }

  async fillFirstPassword(firstPassword:any) {
    await expect(this.firstPassword, 'First password is not editable').toBeEditable();
    await this.firstPassword.fill(firstPassword);
  }
  
  async fillSecondPassword(secondPassword:any) {
    await expect(this.secondPassword, 'Second password is not editable').toBeEditable();
    await this.secondPassword.fill(secondPassword);
  }
  
  async clickCreateAccountBtn(email: any) {
    await expect(this.createAccountBtn, 'Create account button is not enabled').toBeEnabled();
    await this.createAccountBtn.click();
    await expect(this.body, 'Verification-link message is not visible').toContainText('verification link');
    await expect(this.body, `Email ${email} is not shown in the verification message`).toContainText(email);
  }

  async blur() {
    await this.page.click('body');
  }

  async setUsernameAndBlur(value: string) {
    await expect(this.usernameInput, 'Username input is not visible').toBeVisible();
    await expect(this.usernameInput, 'Username input is not editable').toBeEditable();
    await this.usernameInput.fill(value);
    await this.blur();
  }

  async assertError(text: string) {
    await expect(this.page.getByText(text), `Expected text "${text}" is not visible`).toBeVisible();
  }

  async assertLowercased(expected: string) {
    await expect(this.usernameInput, 'Username input has wrong value').toHaveValue(expected);
  }

  async clickWalletLoginBtn() {
    await expect(this.walletLoginBtn, 'Wallet Login button is not visible').toBeVisible();
    await expect(this.walletLoginBtn, 'Wallet Login button is not enabled').toBeEnabled();
    await this.walletLoginBtn.click();
  }

  async clickRegisterWalletBtn() {
    await expect(this.registerWalletBtn, 'Register Wallet button is not visible').toBeVisible();
    await expect(this.registerWalletBtn, 'Register Wallet button is not enabled').toBeEnabled();
    await this.registerWalletBtn.click();
  }

  async clickMetamaskOption() {
    await expect(this.metamaskOption, 'MetaMask option is not visible in wallet modal').toBeVisible();
    await this.metamaskOption.click();
  }

  async clickMetamaskBrowserTab() {
    await expect(this.metamaskBrowserTab, 'MetaMask Browser tab is not visible').toBeVisible();
    await this.metamaskBrowserTab.click();
  }

  async clickWalletOption(walletType: EvmWalletType) {
    const rdns = getWalletRdns(walletType);
    const option = this.page.getByTestId(`wallet-selector-${rdns}`);
    await expect(option, `${walletType} option is not visible in wallet modal`).toBeVisible();
    await option.click();
  }

  async assertButtonsDisabled() {
    await expect(this.registerWalletBtn, 'Register wallet button should be disabled').toBeDisabled();
    await expect(this.registerEmailBtn, 'Register email button should be disabled').toBeDisabled();
    await expect(this.telegramLoginBtn, 'Telegram login button should be disabled').toBeDisabled();
  }

}
