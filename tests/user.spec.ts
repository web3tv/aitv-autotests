import { test, expect } from '@playwright/test';
import { AuthFlow } from '../src/flows/AuthFlow';
import { RegistrationFlow } from '../src/flows/RegistrationFlow';
import { SideBarPage } from '../src/pages/components/SideBarPage';
import { AccountPage } from '../src/pages/account/AccountPage';
import { MailTmHelper } from '../src/utils/mailTmHelper';
import { StudioProfilePage } from '../src/pages/studio/StudioProfilePage';
import { AuthApi } from '../src/api/AuthApi';

test.describe.serial('Change password', () => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  const newPassword = 'NewPassword1@';

  test('Create user', async ({ page, request }) => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  })

  test('Update password without verifying via email', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, user.password);
    const sideBarPage = new SideBarPage(page);
    await sideBarPage.clickSettingsAccount();
    const accountPage = new AccountPage(page);
    await accountPage.changePassword(user.password, newPassword);
  });

  test('Login with old password without verifying via email -> Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, user.password);
  });

  test('Login with new password without verifying via email -> Error', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, newPassword);
  });

  test('Verify changing password via email', async ({ page, request }) => {
    const mailTmHelper = new MailTmHelper(request);
    const messageId = await mailTmHelper.waitForMessage(user.token, 'Password Verification');
    const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, user.token);
    await page.goto(verificationUrl, { waitUntil: 'networkidle' });
    await expect(page.getByText(/Password Successfully Verified!/i)).toBeVisible({timeout: 20_000 });
  });

  test('Login with old password after verification via email -> Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, user.password);
  });

  test('Login with new password after verification via email -> Error', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, newPassword);
  });

})

test.describe.serial('Change email', () => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  let newEmailToken: string;
  let newEmail: string;
  let verificationUrl: string;

  test('Create user', async ({ page, request }) => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  })

  test('Change email', async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const accountPage = new AccountPage(page);
    const mailTmHelper = new MailTmHelper(request);
    newEmail = await mailTmHelper.generateEmail();

    await authFlow.loginSuccess(user.email, user.password);
    await sideBarPage.clickSettingsAccount();
    await mailTmHelper.createMailbox();
    newEmailToken = await mailTmHelper.getToken(newEmail, mailTmHelper['password']);
    await accountPage.changeEmail(user.email, newEmail, user.password);
    const messageId = await mailTmHelper.waitForMessage(newEmailToken, 'Email Verification');
    verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, newEmailToken);
  })

  test('Login with old email before verification -> Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, user.password);
  })

  test('Login with new email before verification -> Error', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(newEmail, user.password);
  })

  test('Verify changing email via email', async ({ page }) => {
    await page.goto(verificationUrl, { waitUntil: 'networkidle' });
    await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({timeout: 40_000 });
  })

  test('Login with NEW email after verification -> Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(newEmail, user.password);
  });

  test('Login with OLD email after verification -> Error', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, user.password);
  });
});