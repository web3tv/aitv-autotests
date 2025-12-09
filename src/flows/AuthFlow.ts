import { HeaderPage } from "../pages/HeaderPage";
import { LoginPage } from "../pages/LoginPage";
import { UserDropdownPage } from "../pages/UserDropdownPage";
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

  async loginSuccess (email:string,password:string) {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await this.loginPage.page.waitForURL('/')
    await this.loginPage.page.waitForResponse('/api/users/whoami',{timeout:40_000})
    await expect(this.loginPage.page.locator('#profile-button')).toBeVisible();
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