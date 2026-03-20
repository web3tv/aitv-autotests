import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { RegistrationFlow } from '../../../src/flows/RegistrationFlow';
import { SideBarPage } from '../../../src/pages/components/SideBarPage';
import { AccountPage } from '../../../src/pages/account/AccountPage';
import { MailTmHelper } from '../../../src/utils/mailTmHelper';

test('Change password', { annotation: { type: 'TC', description: 'ACCOUNT-002' } }, async ({ page, request }) => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  const newPassword = 'NewPassword1@';

  await test.step('Create user', async () => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  });

  await test.step('Update password without verifying via email', async () => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const accountPage = new AccountPage(page);

    await authFlow.loginSuccess(user.email, user.password, user.username);
    await sideBarPage.clickSettingsAccount();
    await accountPage.changePassword(user.password, newPassword);
    await authFlow.logout();
  });

  await test.step('Login with old password without verifying via email -> Success', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, user.password, user.username);
    await authFlow.logout();
  });

  await test.step('Login with new password without verifying via email -> Error', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, newPassword);
  });

  await test.step('Verify changing password via email', async () => {
    const mailTmHelper = new MailTmHelper(request);
    const messageId = await mailTmHelper.waitForMessage(user.token, 'Password Verification');
    const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, user.token);
    await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Password Successfully Verified!/i)).toBeVisible({ timeout: 20_000 });
  });

  await test.step('Login with old password after verification via email -> Error', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, user.password);
  });

  await test.step('Login with new password after verification via email -> Success', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, newPassword, user.username);
  });
});

test('Change email', { annotation: { type: 'TC', description: 'ACCOUNT-001' } }, async ({ page, request }) => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  let newEmailToken: string;
  let newEmail: string;
  let verificationUrl: string;

  await test.step('Create user', async () => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  });

  await test.step('Change email', async () => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const accountPage = new AccountPage(page);
    const mailTmHelper = new MailTmHelper(request);
    newEmail = await mailTmHelper.generateEmail();

    await authFlow.loginSuccess(user.email, user.password, user.username);
    await sideBarPage.clickSettingsAccount();
    await mailTmHelper.createMailbox();
    newEmailToken = await mailTmHelper.getToken(newEmail, mailTmHelper['password']);
    await accountPage.assertDisplayedEmail(user.email);
    await accountPage.changeEmail(user.email, newEmail, user.password);
    const messageId = await mailTmHelper.waitForMessage(newEmailToken, 'Email Verification');
    verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, newEmailToken);
    await authFlow.logout();
  });

  await test.step('Login with old email before verification -> Success', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, user.password, user.username);
    await authFlow.logout();
  });

  await test.step('Login with new email before verification -> Error', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(newEmail, user.password);
  });

  await test.step('Verify changing email via email', async () => {
    await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({ timeout: 40_000 });
  });

  await test.step('Login with NEW email after verification -> Success', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(newEmail, user.password, user.username);
    await authFlow.logout();
  });

  await test.step('Login with OLD email after verification -> Error', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, user.password);
  });
});
