import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { RegistrationFlow } from '../../src/flows/RegistrationFlow';
import { MailTmHelper } from '../../src/utils/mailTmHelper';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { SecurityPage } from '../../src/pages/account/SecurityPage';


test.describe('Login tests', () => {

  test('Success login as user', { annotation: { type: 'TC', description: 'AUTH-001' } }, async ({ page,request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const password = process.env.USER_PASSWORD!;
    const user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, password, user.username);
  });

  test('Success logout', { annotation: { type: 'TC', description: 'AUTH-004' } }, async ({ page,request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const password = process.env.USER_PASSWORD!;
    const user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, password, user.username);
    await authFlow.logout();
  });

  test('Can`t login with incorrect password', { annotation: { type: 'TC', description: 'AUTH-002' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const password = process.env.USER_PASSWORD!;
    const user = await authApi.createAndVerifyUser();

    await authFlow.passwordError(user.email, "Admin1@");
  });

  test('Can`t login with incorrect username', { annotation: { type: 'TC', description: 'AUTH-003' } }, async ({ page }) => {
    const authFlow = new AuthFlow(page);

    await authFlow.usernameError("user1", "Admin1@@");
  });

});


test.describe('Registration tests', () => {

  test('Register user via Email', { annotation: { type: 'TC', description: 'AUTH-005' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const registrationFlow = new RegistrationFlow(page, request);

    await registrationFlow.openRegistrationPage();
    const { email, password, username } = await registrationFlow.registerAndVerifyUserViaEmail();
    await authFlow.loginSuccess(email, password, username);
  });

  test('Register and verify user via API', { annotation: { type: 'TC', description: 'AUTH-006' } }, async ({ page,request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const password = process.env.USER_PASSWORD!;
    const user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, password, user.username);
  });

});


test.describe('Reset password tests', () => {

  test('Reset password and login with old password -> Error, login with new password -> Success', { annotation: { type: 'TC', description: 'AUTH-007' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const registrationFlow = new RegistrationFlow(page, request);
    const mailTmHelper = new MailTmHelper(request);
    const newPassword = 'Admin1234@@';

    await registrationFlow.openRegistrationPage();
    const { email, password, username, token } = await registrationFlow.registerAndVerifyUserViaEmail();

    await authFlow.submitForgotPasswordRequest(email);

    const messageId = await mailTmHelper.waitForMessage(token,'Your password reset code');
    const resetPassUrl = await mailTmHelper.extractPasswordResetnUrl(messageId,token);
    await authFlow.prepareResetPasswordForm(resetPassUrl);
    const status = await authFlow.completePasswordReset(newPassword);
    expect(status).toBe(200);
    await authFlow.loginFailed(email,password);
    await authFlow.loginSuccess(email, newPassword, username);
  });

  test('Can`t reset password with mismatched passwords', { annotation: { type: 'TC', description: 'AUTH-008' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const registrationFlow = new RegistrationFlow(page, request);
    const mailTmHelper = new MailTmHelper(request);
    const newPassword = 'Admin1234@@';
    const wrongPassword = 'Admin1233@@';

    await registrationFlow.openRegistrationPage();
    const { email, password, username , mailTmPassword, token } = await registrationFlow.registerAndVerifyUserViaEmail();

    await authFlow.submitForgotPasswordRequest(email);

    const messageId = await mailTmHelper.waitForMessage(token,'Your password reset code');
    const resetPassUrl = await mailTmHelper.extractPasswordResetnUrl(messageId,token);
    await authFlow.prepareResetPasswordForm(resetPassUrl);
    await authFlow.fillResetPasswordWithMismatch(newPassword, wrongPassword);
    await authFlow.assertResetPasswordMismatchState(newPassword, wrongPassword);
  });

});


test('Check 2FA', { annotation: [{ type: 'TC', description: '2FA-001' }, { type: 'TC', description: '2FA-002' }, { type: 'TC', description: '2FA-003' }, { type: 'TC', description: '2FA-004' }] }, async ({ page, request }) => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };

  await test.step('Setup 2FA', async () => {
    const registrationFlow = new RegistrationFlow(page, request);
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const securityPage = new SecurityPage(page);

    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
    await authFlow.loginSuccess(user.email, user.password, user.username);
    await sideBarPage.clickSettingsSecurity();
    await securityPage.setup2FA(user.email);
    await authFlow.logout();
  });

  await test.step('Login - insert incorrect 2FA code - Failed', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginWith2FaFailed(user.email, user.password);
  });

  await test.step('Login - insert correct 2FA code - Success', async () => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginWith2FaSuccess(user.email, user.password, user.token, user.username);
    await authFlow.logout();
  });

  await test.step('Disable 2FA - check login without 2FA', async () => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const securityPage = new SecurityPage(page);

    await authFlow.loginWith2FaSuccess(user.email, user.password, user.token, user.username);
    await sideBarPage.clickSettingsSecurity();
    await securityPage.disable2FA(user.email);
    await authFlow.logout();
    await authFlow.loginSuccess(user.email, user.password, user.username);
  });
});
