import { Page, APIRequestContext, test } from '@playwright/test';
import { MailTmHelper } from '../utils/mailTmHelper.ts';
import { AuthFlow } from './AuthFlow';
import { LoginPage } from '../pages/auth/LoginPage.ts';
import { expect } from '@playwright/test';

export class RegistrationFlow {
  readonly loginPage: LoginPage;
  readonly mailTmHelper: MailTmHelper;

  constructor(
    private page: Page,
    private request: APIRequestContext
  ) {
    this.loginPage = new LoginPage(page);
    this.mailTmHelper = new MailTmHelper(request);
  }
  
  async openRegistrationPage(){
    await this.page.goto('/register')
  }

  async registerViaEmail(email:string,password:string){
    await this.loginPage.fillUsernameInput();  // генерирует сам
    await this.loginPage.clickCheckbox();
    await this.loginPage.clickContinueWithEmail();
    await this.loginPage.fillEmailRegistrationInput(email);
    await this.loginPage.fillFirstPassword(password);
    await this.loginPage.fillSecondPassword(password);
    await this.loginPage.clickCreateAccountBtn(email);
  }

  async registerAndVerifyUserViaEmail() {
    const password = 'Admin1@@'
    const mailTmPassword = 'StrongPass123!';
    
    const email = await this.mailTmHelper.generateEmail();
    await this.mailTmHelper.createMailbox();
    await this.registerViaEmail(email,password);
    const token = await this.mailTmHelper.getToken(email, mailTmPassword);
    await this.mailTmHelper.waitForMessage(token);
    const verificationUrl = await this.mailTmHelper.extractVerificationUrl();
    await this.page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByText(/Email Successfully Verified!/i)).toBeVisible({timeout: 40_000 });
    return { email, password };
  }
}
