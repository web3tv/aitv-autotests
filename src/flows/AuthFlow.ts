import { HeaderPage } from "../pages/components/HeaderPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { UserDropdownPage } from "../pages/components/UserDropdownPage";
import { expect } from '@playwright/test';
import { Page } from '@playwright/test';


export class AuthFlow {

  readonly loginPage: LoginPage;
  readonly headerPage: HeaderPage;
  readonly userDropdownPage: UserDropdownPage;

  constructor(public page: Page) {
    this.loginPage = new LoginPage(page);
    this.headerPage = new HeaderPage(page);
    this.userDropdownPage = new UserDropdownPage(page);
  }

  async loginSuccess (email:string,password:string,device?: 'mobile' | 'desktop') {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await this.loginPage.page.waitForURL('/')
    await this.loginPage.page.waitForResponse('/api/users/whoami',{timeout:40_000})
    if (device === 'mobile') {
      await expect(this.loginPage.page.locator('[data-id="user-avatar"]')).toBeVisible();
    }
    else{
      await expect(this.loginPage.page.locator('#profile-button')).toBeVisible();
    }
  }

  async forgotPassword(){
    await this.loginPage.visitLoginPage();
    
  }

  async passwordError (email:string,password:string) {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await expect(this.loginPage.page.locator('form')).toContainText('Invalid password. Please re-enter another password.');
    expect(this.loginPage.page.waitForURL('/login'));
  }

  async usernameError (email:string, password:string) {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.removeFocusFromElement();
    await expect(this.loginPage.page.locator('form')).toContainText('Username not found. Try another one.');
    expect(this.loginPage.page.waitForURL('/login'));
  }

  async logout(){
    await this.headerPage.clickUserIcon();
    await this.userDropdownPage.clickLogoutBtn();
    await expect(this.loginPage.page).toHaveURL('/login');
  }
}