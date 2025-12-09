import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { MainPage } from '../../src/pages/MainPage';
import { HeaderPage } from '../../src/pages/HeaderPage';

test.describe('Username validation on registration page', () => {
  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    const headerPage = new HeaderPage(page);
    const loginPage = new LoginPage(page);

    await mainPage.visitMainPage();
    await headerPage.clickJoinBtn();

    await expect(loginPage.usernameInput).toBeVisible({timeout:15_000});
  });

  test('1. Empty username → Username is required', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('');
    await loginPage.blur();

    await loginPage.assertError('Username is required');
    await loginPage.assertButtonsDisabled();
  });

  test('2. Too short username → Username must be at least 4 characters', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('abc');
    await loginPage.blur();
    await loginPage.assertError('Username must be at least 4 characters');
    await loginPage.assertButtonsDisabled();
  });

  test('3. Too long username → Max length of username is 32 characters', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('hgjfkdlsffoepeoriefeferrerererrrr');
    await loginPage.blur();
    await loginPage.assertError('Max length of username is 32 characters');
    await loginPage.assertButtonsDisabled();
  });

  test('4. Reject Not Latin chars → Username must start with a letter and contain only latin lowercase letters, digits, and underscores.', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('abcппкп');
    await loginPage.blur();
    await loginPage.assertError('Username must start with a letter and contain only latin lowercase letters, digits, and underscores');
    await loginPage.assertButtonsDisabled();
  });

  test('5. Reject spaces', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('abc def');
    await loginPage.blur();
    await loginPage.assertError('Username must start with a letter and contain only latin lowercase letters, digits, and underscores');
    await loginPage.assertButtonsDisabled();
  });

  test('6. Reject starting underscore', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput('_abcdef');
    await loginPage.blur();
    await loginPage.assertError('Username must start with a letter and contain only latin lowercase letters, digits, and underscores');
    await loginPage.assertButtonsDisabled();
  });

  test('7. Username exists', async ({ page }) => {
    const username = process.env.USER_EXIST

    const loginPage = new LoginPage(page);
    await loginPage.fillUsernameInput(username);
    await loginPage.blur();
    await loginPage.assertError('Username exists');
    await loginPage.assertButtonsDisabled();
  });

  test('8. Uppercase → should convert to lowercase', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.fillUsernameInput2('FewFWFTESTING');
    await loginPage.blur();
    await loginPage.assertLowercased('fewfwftesting');

  });

});