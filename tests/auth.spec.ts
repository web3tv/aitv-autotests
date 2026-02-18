import { test, expect } from '@playwright/test';
import { AuthFlow } from '../src/flows/AuthFlow';
import { MailTmHelper } from '../src/utils/mailTmHelper';
import { AuthApi } from "../src/api/AuthApi";
import { RegistrationFlow } from '../src/flows/RegistrationFlow';


test.describe('Login tests', () => {

  test('Success login as user', async ({ page,request }) => { 
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const password = process.env.USER_PASSWORD!;
    const user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, password);
  });

  test('Success logout', async ({ page,request }) => { 
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const password = process.env.USER_PASSWORD!;
    const user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, password);
    await authFlow.logout();
  });

  test('Can`t login with incorrect password', async ({ page, request }) => { 
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const password = process.env.USER_PASSWORD!;
    const user = await authApi.createAndVerifyUser();

    await authFlow.passwordError(user.email, "Admin1@");
  });

  test('Can`t login with incorrect username', async ({ page }) => { 
    const authFlow = new AuthFlow(page);

    await authFlow.usernameError("user1", "Admin1@@");
  });

});

test.describe('Sign Up tests', () => {

  test('Register user via Email', async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const registrationFlow = new RegistrationFlow(page, request);
    
    await registrationFlow.openRegistrationPage();
    const { email, password } = await registrationFlow.registerAndVerifyUserViaEmail();
    await authFlow.loginSuccess(email, password);
  });

  test('Register and verify user via API',async ({ page,request })=>{
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const password = process.env.USER_PASSWORD!;
    const user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, password);
  })
});

test.describe('Forgot password', () => {

  test('Reset password and login with old password -> Error, login with new password -> Success', async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const registrationFlow = new RegistrationFlow(page, request);
    const mailTmHelper = new MailTmHelper(request);
    const newPassword = 'Admin1234@@';
    
    await registrationFlow.openRegistrationPage();
    const { email, password, token } = await registrationFlow.registerAndVerifyUserViaEmail();

    await authFlow.submitForgotPasswordRequest(email);

    const messageId = await mailTmHelper.waitForMessage(token,'Your password reset code');
    const resetPassUrl = await mailTmHelper.extractPasswordResetnUrl(messageId,token);
    await authFlow.prepareResetPasswordForm(resetPassUrl);
    const status = await authFlow.completePasswordReset(newPassword);
    expect(status).toBe(200);
    await authFlow.loginFailed(email,password);
    await authFlow.loginSuccess(email, newPassword);
  });
  
  test('Can`t reset password with mismatched passwords', async ({ page, request }) => {
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

