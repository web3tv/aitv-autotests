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

test.fixme('Change password twice in one session', { annotation: { type: 'TC', description: 'ACCOUNT-006' } }, async ({ page, request }) => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  const firstNewPassword = 'FirstNew1@@';
  const secondNewPassword = 'SecondNew1@@';

  await test.step('Create user', async () => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  });

  await test.step('Login and navigate to account settings', async () => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    await authFlow.loginSuccess(user.email, user.password, user.username);
    await sideBarPage.clickSettingsAccount();
  });

  await test.step('Change password first time', async () => {
    const accountPage = new AccountPage(page);
    await accountPage.changePassword(user.password, firstNewPassword);
  });

  const beforeSecondChange = Date.now();

  await test.step('Change password second time immediately', async () => {
    const accountPage = new AccountPage(page);
    await accountPage.changePassword(user.password, secondNewPassword);
  });

  await test.step('Verify first password change via email', async () => {
    const mailTmHelper = new MailTmHelper(request);
    const messageId = await mailTmHelper.waitForMessage(user.token, 'Password Verification');
    const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, user.token);
    await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Password Successfully Verified!/i)).toBeVisible({ timeout: 20_000 });
  });

  await test.step('Verify second password change via email', async () => {
    const mailTmHelper = new MailTmHelper(request);
    const messageId = await mailTmHelper.waitForMessage(user.token, 'Password Verification', 10, 3000, beforeSecondChange);
    const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, user.token);
    await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Password Successfully Verified!/i)).toBeVisible({ timeout: 20_000 });
  });

  await test.step('Login with second new password -> Success', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, secondNewPassword, user.username);
    await authFlow.logout();
  });

  await test.step('Login with first new password -> Error', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, firstNewPassword);
  });
});

test.fixme('Change email without verification then change password', { annotation: { type: 'TC', description: 'ACCOUNT-007' } }, async ({ page, request }) => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  const newPassword = 'NewPassword1@@';

  await test.step('Create user', async () => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  });

  await test.step('Login and navigate to account settings', async () => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    await authFlow.loginSuccess(user.email, user.password, user.username);
    await sideBarPage.clickSettingsAccount();
  });

  await test.step('Change email without verification', async () => {
    const accountPage = new AccountPage(page);
    const mailTmHelper = new MailTmHelper(request);
    const newEmail = await mailTmHelper.generateEmail();
    await mailTmHelper.createMailbox();
    await accountPage.changeEmail(user.email, newEmail, user.password);
  });

  await test.step('Change password immediately after unverified email change', async () => {
    const accountPage = new AccountPage(page);
    await accountPage.changePassword(user.password, newPassword);
  });

  await test.step('Verify password change via email and login with new password', async () => {
    const mailTmHelper = new MailTmHelper(request);
    const authFlow = new AuthFlow(page);
    const messageId = await mailTmHelper.waitForMessage(user.token, 'Password Verification');
    const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, user.token);
    await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Password Successfully Verified!/i)).toBeVisible({ timeout: 20_000 });
    await authFlow.loginSuccess(user.email, newPassword, user.username);
  });
});

test.fixme('Change email twice without verification', { annotation: { type: 'TC', description: 'ACCOUNT-008' } }, async ({ page, request }) => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  let firstNewEmail: string;
  let firstVerificationUrl: string;
  let secondNewEmail: string;
  let secondNewToken: string;

  await test.step('Create user', async () => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  });

  await test.step('Login and navigate to account settings', async () => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    await authFlow.loginSuccess(user.email, user.password, user.username);
    await sideBarPage.clickSettingsAccount();
  });

  await test.step('Change email first time and get verification link', async () => {
    const accountPage = new AccountPage(page);
    const mailTmHelper = new MailTmHelper(request);
    firstNewEmail = await mailTmHelper.generateEmail();
    await mailTmHelper.createMailbox();
    const firstNewToken = await mailTmHelper.getToken(firstNewEmail, mailTmHelper['password']);
    await accountPage.changeEmail(user.email, firstNewEmail, user.password);
    const messageId = await mailTmHelper.waitForMessage(firstNewToken, 'Email Verification');
    firstVerificationUrl = await mailTmHelper.extractVerificationUrl(messageId, firstNewToken);
    await expect(accountPage.emailConfirmationAlert, 'First email change toast did not disappear').toBeHidden({ timeout: 10_000 });
  });

  await test.step('Change email second time immediately', async () => {
    const accountPage = new AccountPage(page);
    const mailTmHelper = new MailTmHelper(request);
    secondNewEmail = await mailTmHelper.generateEmail();
    await mailTmHelper.createMailbox();
    secondNewToken = await mailTmHelper.getToken(secondNewEmail, mailTmHelper['password']);
    await accountPage.changeEmail(user.email, secondNewEmail, user.password);
  });

  await test.step('First verification link is invalid and email not assigned', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.logout();
    await page.goto(firstVerificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/This verification link has expired or is no longer valid/i)).toBeVisible({ timeout: 10_000 });
    await authFlow.loginFailed(firstNewEmail, user.password);
  });

  await test.step('Verify second email and login with new email', async () => {
    const mailTmHelper = new MailTmHelper(request);
    const authFlow = new AuthFlow(page);
    const messageId = await mailTmHelper.waitForMessage(secondNewToken, 'Email Verification');
    const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, secondNewToken);
    await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({ timeout: 40_000 });
    await authFlow.loginSuccess(secondNewEmail, user.password, user.username);
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
