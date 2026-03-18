import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from "../../src/api/AuthApi";


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
