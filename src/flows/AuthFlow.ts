import { HeaderPage } from "../pages/components/HeaderPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { UserDropdownPage } from "../pages/components/UserDropdownPage";
import { expect } from '@playwright/test';
import { Page } from '@playwright/test';
import { MailTmHelper } from "../utils/mailTmHelper";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";


export class AuthFlow {

  readonly loginPage: LoginPage;
  readonly resetPasswordPage: ResetPasswordPage;
  readonly headerPage: HeaderPage;
  readonly userDropdownPage: UserDropdownPage;
  readonly forgotPasswordPage: ForgotPasswordPage;

  constructor(public page: Page) {
    this.loginPage = new LoginPage(page);
    this.resetPasswordPage = new ResetPasswordPage(page);
    this.headerPage = new HeaderPage(page);
    this.userDropdownPage = new UserDropdownPage(page);
    this.forgotPasswordPage = new ForgotPasswordPage(page);
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

  async loginFailed (email:string,password:string,device?: 'mobile' | 'desktop') {
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await this.page.waitForResponse((response) =>
            response.url().includes('/api/auth/login') &&
            response.status() === 400,
            { timeout: 40000 }
        );
    await expect(this.page.locator('form')).toContainText('Invalid password. Please re-enter another password.');
  }

  async loginWith2FaFailed(email:string,password:string){
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    await this.loginPage.clickLoginBtn();
    await expect(this.page.locator('body')).toContainText('To ensure your identity, we`ve sent a verification code to your email. Please enter the code below to proceed.');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill('2');
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill('2');
    await this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/check') &&
            res.status() === 403
        );
    await expect(this.page.locator('body')).toContainText('Error code. Check your code on email and try again.');
  }

  async loginWith2FaSuccess(email:string,password:string,token:string){
    const mailTmHelper = new MailTmHelper(this.page.request);
    await this.loginPage.visitLoginPage();
    await this.loginPage.fillEmailInput(email);
    await this.loginPage.fillPasswordInput(password);
    const requestedAt = Date.now();
    await this.loginPage.clickLoginBtn();
    await expect(this.page.locator('body')).toContainText('To ensure your identity, we`ve sent a verification code to your email. Please enter the code below to proceed.');
    const messageId = await mailTmHelper.waitForMessage(token, 'Authentication Code', 10, 3000, requestedAt);
    const [d1, d2, d3, d4] = await mailTmHelper.extract2FACode(messageId,token);
    console.log(`Extracted 2FA code: ${d1}${d2}${d3}${d4}`);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill(d1);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill(d2);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill(d3);
    await this.page.waitForTimeout(500);
    await this.page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill(d4);
    await this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/check') &&
            res.status() === 200
        );
    await expect(this.loginPage.page.locator('#profile-button')).toBeVisible();
  }

  async submitForgotPasswordRequest(email: string) {
    await this.loginPage.visitLoginPage();
    await this.forgotPasswordPage.openForm();
    await this.forgotPasswordPage.fillEmail(email);
    await this.forgotPasswordPage.submitRequest();
  }

  async prepareResetPasswordForm(resetUrl: string) {
    await this.page.goto(resetUrl, { waitUntil: 'networkidle' });
    await this.resetPasswordPage.verifyPasswordFieldsVisible();
    await this.resetPasswordPage.verifyPasswordFieldsEditable();
  }

  async completePasswordReset(newPassword: string) {
    await this.resetPasswordPage.resetPassword(newPassword);
    return this.waitForResetPasswordResponse();
  }

  private async waitForResetPasswordResponse() {
    const [response] = await Promise.all([
      this.page.waitForResponse(res =>
        res.url().includes('/api/auth/update-password') &&
        res.request().method() === 'POST'
      ),
      this.resetPasswordPage.clickChangePasswordBtn()
    ]);
    return response.status();
  }

  async fillResetPasswordWithMismatch(password: string, confirmPassword: string) {
    await this.resetPasswordPage.fillPasswordsWithMismatch(password, confirmPassword);
  }

  async assertResetPasswordMismatchState(password: string, confirmPassword: string) {
    await this.resetPasswordPage.verifyPasswordValue(password);
    await this.resetPasswordPage.verifyConfirmPasswordValue(confirmPassword);
    await this.resetPasswordPage.verifyChangePasswordBtnDisabled();
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