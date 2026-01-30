import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/auth/LoginPage';
import { AuthFlow } from '../src/flows/AuthFlow';
import { MainPage } from '../src/pages/components/MainPage';
import { HeaderPage } from '../src/pages/components/HeaderPage';
import { MailTmHelper } from '../src/utils/mailTmHelper';
import { AuthApi } from "../src/api/AuthApi";
import { RegistrationFlow } from '../src/flows/RegistrationFlow';


test.describe.skip('Login tests', () => {

  test('Login as user', async ({ page }) => { 
    const authFlow = new AuthFlow(page);
    const login = process.env.USER_LOGIN_PUBLIC!;
    const password = process.env.USER_PASSWORD!;
    await authFlow.loginSuccess(login, password);
  });

  test('User logout', async ({ page }) => { 
    const authFlow = new AuthFlow(page);
    const login = process.env.USER_LOGIN_PUBLIC!;
    const password = process.env.USER_PASSWORD!;
  
    await authFlow.loginSuccess(login, password);
    await authFlow.logout();
  });

  test('Can`t login with incorrect password', async ({ page }) => { 
    const authFlow = new AuthFlow(page);
    const login = process.env.USER_LOGIN_PUBLIC!;

    await authFlow.passwordError(login, "Admin1@");
  });

  test('Can`t login with incorrect username', async ({ page }) => { 
    const authFlow = new AuthFlow(page);

    await authFlow.usernameError("user1", "Admin1@@");
  });

});

test.describe.skip('Sign Up tests', () => {

  test('Register user via Email', async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const registrationFlow = new RegistrationFlow(page,request)
    
    await registrationFlow.openRegistrationPage();
    const { email, password } = await registrationFlow.registerAndVerifyUserViaEmail();
    await authFlow.loginSuccess(email, password);
  });

  test('Register and verify user via API',async ({ page,request })=>{
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const user = await authApi.createAndVerifyUser();
    const password = process.env.USER_PASSWORD!;
    await authFlow.loginSuccess(user.email, password);
  })
});

test.describe('Forgot password', () => {

  test('Reset password and check', async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const registrationFlow = new RegistrationFlow(page,request)
    const mailTmHelper = new MailTmHelper(request)
    const newPassword = 'Admin1234@@'
    
    await registrationFlow.openRegistrationPage();
    const { email, password, username , mailTmPassword, token } = await registrationFlow.registerAndVerifyUserViaEmail();

    await authFlow.forgotPassword();
    await page.getByRole('link', { name: 'Forgot Password?' }).click();
    await expect(page.getByText('Enter your Web3 TV username')).toBeVisible();
    await page.getByRole('textbox', { name: 'Enter email address' }).click();
    await page.getByRole('textbox', { name: 'Enter email address' }).fill(email);
    
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled()
    await page.getByRole('button', { name: 'Submit' }).click();

    const messageId = await mailTmHelper.waitForMessage(token,'Your password reset code');
    const resetPassUrl = await mailTmHelper.extractPasswordResetnUrl(messageId,token);
    await page.goto(resetPassUrl, { waitUntil: 'networkidle' });

    await page.locator('input[name="password"]').click();

    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeEditable();

    await page.locator('input[name="password"]').pressSequentially(newPassword);
    await expect(page.locator('input[name="confirmPassword"]')).toBeEditable();
    await page.locator('input[name="confirmPassword"]').pressSequentially(newPassword);

    await expect(page.locator('input[name="password"]')).toHaveValue('Admin1234@@');
    await expect(page.locator('input[name="confirmPassword"]')).toHaveValue('Admin1234@@');

    await expect(page.getByRole('button', { name: 'Change Password' })).toBeEnabled();
    await page.getByRole('button', { name: 'Change Password' }).click();

    await authFlow.loginSuccess(email, newPassword);
  });

});

