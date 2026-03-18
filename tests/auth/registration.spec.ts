import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from "../../src/api/AuthApi";
import { RegistrationFlow } from '../../src/flows/RegistrationFlow';


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
