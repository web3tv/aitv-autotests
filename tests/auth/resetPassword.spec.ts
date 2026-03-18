import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { MailTmHelper } from '../../src/utils/mailTmHelper';
import { RegistrationFlow } from '../../src/flows/RegistrationFlow';


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
