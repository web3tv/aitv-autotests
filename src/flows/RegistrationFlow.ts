import { Page, APIRequestContext, test } from '@playwright/test';
import { MailTmHelper } from '../utils/mailTmHelper.ts';
import { AuthFlow } from './AuthFlow';
import { LoginPage } from '../pages/auth/LoginPage.ts';
import { expect } from '@playwright/test';
import { HeaderPage } from '../pages/components/HeaderPage';
import { LoginPopupPage } from '../pages/testPopups/LoginPopupPage';
import { DataGenerator } from '../utils/dataGenerator';

export class RegistrationFlow {
  readonly loginPage: LoginPage;
  readonly mailTmHelper: MailTmHelper;
  readonly headerPage: HeaderPage;
  readonly loginPopupPage: LoginPopupPage;

  constructor(
    private page: Page,
    private request: APIRequestContext
  ) {
    this.loginPage = new LoginPage(page);
    this.mailTmHelper = new MailTmHelper(request);
    this.headerPage = new HeaderPage(page);
    this.loginPopupPage = new LoginPopupPage(page);
  }
  
  async openRegistrationPage(){
    await this.page.goto('/register')
  }

  async registerViaEmail(email:string,password:string){
    const username = await this.loginPage.fillUsernameInput();  // генерирует сам
    await this.loginPage.clickCheckbox();
    await this.loginPage.clickContinueWithEmail();
    await this.loginPage.fillEmailRegistrationInput(email);
    await this.loginPage.fillFirstPassword(password);
    await this.loginPage.fillSecondPassword(password);
    await this.loginPage.clickCreateAccountBtn(email);
    return username
  }

  async registerAndVerifyUserViaEmail() {
    const password = 'Admin1@@'
    const mailTmPassword = 'StrongPass123!';
    const email = await this.mailTmHelper.generateEmail();
    await this.mailTmHelper.createMailbox();
    const username = await this.registerViaEmail(email,password);
    const token = await this.mailTmHelper.getToken(email, mailTmPassword);
    const messageId = await this.mailTmHelper.waitForMessage(token,'Email Verification');
    const verificationUrl = await this.mailTmHelper.extractVerificationUrl(messageId, token);
    await this.page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByText(/Email Successfully Verified!/i)).toBeVisible({timeout: 40_000 });
    return { email, password, username, mailTmPassword, token };
  }

  async registerAndVerifyUserViaPopup(): Promise<{ email: string; password: string; username: string; mailTmPassword: string; token: string }> {
    const password = 'Admin1@@';
    const mailTmPassword = 'StrongPass123!';
    const username = DataGenerator.generateUsername();

    const email = await this.mailTmHelper.generateEmail();
    await this.mailTmHelper.createMailbox();
    const token = await this.mailTmHelper.getToken(email, mailTmPassword);

    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.headerPage.clickGetStarted();
    await this.loginPopupPage.assertPopupVisible();
    await this.loginPopupPage.clickEmailEntry();
    await this.loginPopupPage.fillEmailOrUsername(email);
    await this.loginPopupPage.clickContinue();

    const messageId = await this.mailTmHelper.waitForMessage(token, 'verification', 15, 3000);
    const code = await this.mailTmHelper.extractVerificationCode(messageId, token);
    await this.loginPopupPage.fillCode(code);

    await this.loginPopupPage.fillCreatePassword(password);
    await this.loginPopupPage.clickSetNewPassword();
    await this.loginPopupPage.fillChooseHandle(username);
    await this.loginPopupPage.clickFinish();

    await this.page.waitForURL('/');
    await this.page.waitForResponse('/api/users/whoami', { timeout: 40_000 });

    return { email, password, username, mailTmPassword, token };
  }
}
