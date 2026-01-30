import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/auth/LoginPage';
import { AuthFlow } from '../src/flows/AuthFlow';
import { MainPage } from '../src/pages/components/MainPage';
import { HeaderPage } from '../src/pages/components/HeaderPage';
import { MailTmHelper } from '../src/utils/mailTmHelper';
import { AuthApi } from "../src/api/AuthApi";
import { RegistrationFlow } from '../src/flows/RegistrationFlow';


test.describe('Login tests', () => {

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

test.describe('Sign Up tests', () => {

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

  // test('Reset password and check', async ({ page, request }) => {
  //   const mail = new MailTmHelper(request);
  //   const loginPage = new LoginPage(page)
  //   const authFlow = new AuthFlow(page);
  //   const password = 'Admin1@@'

   

  //   await authFlow.loginSuccess(email, password);
  // });

});

