import { test, expect } from '@playwright/test';
import { HeaderPage } from '../../src/pages/components/HeaderPage';
import { LoginPopupPage } from '../../src/pages/testPopups/LoginPopupPage';
import { GmailHelper } from '../../src/utils/gmailHelper';
import { AuthApi } from '../../src/api/AuthApi';

test.describe('Handle validation on registration page', { tag: '@validation', annotation: [{ type: 'TC', description: 'VAL-001' }, { type: 'TC', description: 'VAL-002' }] }, () => {

  test.beforeEach(async ({ page, request }) => {
    const mailHelper = new GmailHelper(request);
    const headerPage = new HeaderPage(page);
    const loginPopupPage = new LoginPopupPage(page);

    const email = await mailHelper.generateEmail();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await headerPage.clickGetStarted();
    await loginPopupPage.assertPopupVisible();
    await loginPopupPage.clickEmailEntry();
    await loginPopupPage.fillEmailOrUsername(email);
    await loginPopupPage.clickContinue();

    await loginPopupPage.fillCode('1111');

    await loginPopupPage.fillCreatePassword('Admin1@@');
    await loginPopupPage.clickSetNewPassword();

    await expect(loginPopupPage.chooseHandleInput, 'Handle input is not visible after password step').toBeVisible({ timeout: 10_000 });
  });


  test('1. Too short username → Handle must be at least 4 characters', async ({ page }) => {
    const loginPopupPage = new LoginPopupPage(page);

    await loginPopupPage.chooseHandleInput.fill('abc');
    await page.keyboard.press('Tab');

    await expect(page.getByText('Handle must be at least 4 characters')).toBeVisible();
    await expect(loginPopupPage.finishBtn).toBeDisabled();
  });

  test('2. Too long username → Max length of username is 32 characters', async ({ page }) => {
    const loginPopupPage = new LoginPopupPage(page);

    await loginPopupPage.chooseHandleInput.fill('hgjfkdlsffoepeoriefeferrerererrrr');
    await page.keyboard.press('Tab');

    await expect(page.getByText('Handle must have maximum 32 characters')).toBeVisible();
    await expect(loginPopupPage.finishBtn).toBeDisabled();
  });

  test('3. Reject Not Latin chars → Handle must start with a letter and contain only latin lowercase letters, digits, and underscores.', async ({ page }) => {
    const loginPopupPage = new LoginPopupPage(page);

    await loginPopupPage.chooseHandleInput.fill('abcппкп');
    await page.keyboard.press('Tab');

    await expect(page.getByText('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores')).toBeVisible();
    await expect(loginPopupPage.finishBtn).toBeDisabled();
  });

  test('4. Reject spaces', async ({ page }) => {
    const loginPopupPage = new LoginPopupPage(page);

    await loginPopupPage.chooseHandleInput.fill('abc def');
    await page.keyboard.press('Tab');

    await expect(page.getByText('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores')).toBeVisible();
    await expect(loginPopupPage.finishBtn).toBeDisabled();
  });

  test('5. Reject starting underscore', async ({ page }) => {
    const loginPopupPage = new LoginPopupPage(page);

    await loginPopupPage.chooseHandleInput.fill('_abcdef');
    await page.keyboard.press('Tab');

    await expect(page.getByText('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores')).toBeVisible();
    await expect(loginPopupPage.finishBtn).toBeDisabled();
  });

  test('6. Handle exists', async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const user = await authApi.createUserFast();

    const loginPopupPage = new LoginPopupPage(page);
    await loginPopupPage.chooseHandleInput.fill(user.username);
    await page.keyboard.press('Tab');

    await expect(page.getByText('This handle is already taken. Please choose another.')).toBeVisible();
    await expect(loginPopupPage.finishBtn).toBeDisabled();
  });

  test('7. Uppercase → should convert to lowercase', async ({ page }) => {
    const loginPopupPage = new LoginPopupPage(page);

    await loginPopupPage.chooseHandleInput.fill('FewFWFTESTING');
    await page.keyboard.press('Tab');

    await expect(loginPopupPage.chooseHandleInput).toHaveValue('fewfwftesting');
  });

});
