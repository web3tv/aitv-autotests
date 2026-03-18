import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { RegistrationFlow } from '../../src/flows/RegistrationFlow';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { SecurityPage } from '../../src/pages/account/SecurityPage';


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
