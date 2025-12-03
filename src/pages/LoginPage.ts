import { Page, Locator } from '@playwright/test';


export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByRole('textbox', { name: 'Enter email or username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Enter password' });
    this.loginBtn = page.getByRole('button', { name: 'Login' });
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
  

  
}
