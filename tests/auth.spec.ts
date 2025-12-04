import { test, expect } from '@playwright/test';
import { user1 } from '../test-data/users';
import { LoginPage } from '../src/pages/LoginPage';
import { AuthFlow } from '../src/flows/AuthFlow';
import { MainPage } from '../src/pages/MainPage';
import { HeaderPage } from '../src/pages/HeaderPage';
import { MailTmHelper } from '../utils/mailTmHelper';



test.describe('Login tests', () => {

  test('Login as user', async ({ page }) => { 
    const loginPage = new LoginPage(page)
    const authFlow = new AuthFlow(loginPage);

    await authFlow.loginSuccess(user1.login, user1.password);
  });

  test('Check incorrect password', async ({ page }) => { 
    const loginPage = new LoginPage(page)
    const authFlow = new AuthFlow(loginPage);
    await authFlow.passwordError(user1.login, "Admin1@");
  });

  test('Check incorrect username', async ({ page }) => { 
    const loginPage = new LoginPage(page)
    const authFlow = new AuthFlow(loginPage);

    await authFlow.usernameError("user1", "Admin1@@");
  });

});



test.describe('Registration tests', () => {

  test('Register user via Email', async ({ page, request }) => {
    const mail = new MailTmHelper(request);
    const loginPage = new LoginPage(page)
    const authFlow = new AuthFlow(loginPage);
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
      await expect(loginPage.emailInput).toBeVisible({ timeout: 20_000 });
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

test.describe('Validation tests', () => {
  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    const headerPage = new HeaderPage(page);
    const loginPage = new LoginPage(page);

    await mainPage.visitMainPage();
    await headerPage.clickJoinBtn();

    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('1. Empty username → Handle is required', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('');
    await loginPage.blur();

    await loginPage.assertError('Username is required');
    await loginPage.assertButtonsDisabled();
  });

  test('2. Too short username → Handle must be at least 3 characters', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('ab');
    await loginPage.blur();
    //TODO Username must be at least !5! characters
    await loginPage.assertError('Username must be at least 3 characters');
    await loginPage.assertButtonsDisabled();
  });

  test('3. Reject Not Latin chars', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('abcппкп');
    await loginPage.blur();
    await loginPage.assertError('Username must start with a letter and contain only latin lowercase letters, digits, and underscores.');
    await loginPage.assertButtonsDisabled();
  });

  test('4. Reject spaces', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('abc def');
    await loginPage.blur();
    await loginPage.assertError('Username must start with a letter and contain only latin lowercase letters, digits, and underscores.');
    await loginPage.assertButtonsDisabled();
  });

  test('5. Reject starting underscore', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('_abcdef');
    await loginPage.blur();
    await loginPage.assertError('Username must start with a letter and contain only lowercase letters, numbers, and underscores');
    await loginPage.assertButtonsDisabled();
  });

  test('6. Username exists', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const alreadyCreatedUsername = 'tttttttt'
    await loginPage.fillUsernameInput(alreadyCreatedUsername);
    await loginPage.blur();
    await loginPage.assertError('Username exists');
    await loginPage.assertButtonsDisabled();
  });

  test('7. Uppercase → should convert to lowercase', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('FewFWFTESTING');
    await loginPage.blur();
    await loginPage.assertLowercased('fewfwftesting');
  });

});

