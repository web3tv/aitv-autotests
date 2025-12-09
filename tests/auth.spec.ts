import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { AuthFlow } from '../src/flows/AuthFlow';
import { MainPage } from '../src/pages/MainPage';
import { HeaderPage } from '../src/pages/HeaderPage';
import { MailTmHelper } from '../utils/mailTmHelper';



test.describe('Login tests', () => {

  test('Login as user', async ({ page }) => { 
    const authFlow = new AuthFlow(page);
    const login = process.env.USER_LOGIN!;
    const password = process.env.USER_PASSWORD!;
  
    await authFlow.loginSuccess(login, password);
  });

  test('User logout', async ({ page }) => { 
    const authFlow = new AuthFlow(page);
    const login = process.env.USER_LOGIN!;
    const password = process.env.USER_PASSWORD!;
  
    await authFlow.loginSuccess(login, password);
    await authFlow.logout();
  });

  test('Can`t login with incorrect password', async ({ page }) => { 
    const authFlow = new AuthFlow(page);
    const login = process.env.USER_LOGIN!;

    await authFlow.passwordError(login, "Admin1@");
  });

  test('Can`t login with incorrect username', async ({ page }) => { 
    const authFlow = new AuthFlow(page);

    await authFlow.usernameError("user1", "Admin1@@");
  });

});

test.describe('Sign Up tests', () => {

  test('Register user via Email', async ({ page, request }) => {
    const mail = new MailTmHelper(request);
    const loginPage = new LoginPage(page)
    const authFlow = new AuthFlow(page);
    const password = 'Admin1@@'

    let email: string = '';
    let verificationUrl: string;

    await test.step('Mail.tm: Generate email with domain', async () => {
      email = await mail.generateEmail();
      console.log('Generated email:', email);

      await mail.createMailbox();
    });

    await test.step('Web3TV: Fill registration form', async () => {
      const mainPage = new MainPage(page);
      const headerPage = new HeaderPage(page);

      await mainPage.visitMainPage();
      await headerPage.clickJoinBtn();
      await expect(loginPage.usernameInput).toBeVisible({ timeout: 20_000 });
      await loginPage.fillUsernameInput();
      await loginPage.clickCheckbox();
      await loginPage.clickContinueWithEmail();
      await loginPage.fillEmailRegistrationInput(email);
      await loginPage.fillFirstPassword(password);
      await loginPage.fillSecondPassword(password);
      await loginPage.clickCreateAccountBtn(email);
    });

    await test.step('Mail.tm: Fetch token', async () => {
      await mail.getToken();
    });

    await test.step('Mail.tm: Wait for verification email', async () => {
      await mail.waitForMessage();
    });

    await test.step('Mail.tm: Extract verification URL', async () => {
      verificationUrl = await mail.extractVerificationUrl();
    });

    await test.step('Confirm email via verification URL', async () => {
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({timeout: 40_000 });
    });

    await authFlow.loginSuccess(email, password);
  });

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

