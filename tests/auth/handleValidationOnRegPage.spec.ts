import { test, expect } from '@playwright/test';
import { HeaderPage } from '../../src/pages/components/HeaderPage';
import { LoginPopupPage } from '../../src/pages/testPopups/LoginPopupPage';
import { createMailHelper } from '../../src/utils/mailHelper';
import { AuthApi, STATIC_OTP_CODE } from '../../src/api/AuthApi';
import { DataGenerator } from '../../src/utils/dataGenerator';

test.describe('Handle validation on registration page', { tag: '@validation', annotation: [{ type: 'TC', description: 'VAL-001' }, { type: 'TC', description: 'VAL-002' }] }, () => {

  test.beforeEach(async ({ page, request }) => {
    const mailHelper = createMailHelper(request);
    const headerPage = new HeaderPage(page);
    const loginPopupPage = new LoginPopupPage(page);

    const email = await mailHelper.generateEmail();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await headerPage.clickSignup();
    await loginPopupPage.assertPopupVisible();
    await loginPopupPage.clickEmailEntry();
    await loginPopupPage.fillEmailOrUsername(email);
    await loginPopupPage.clickContinue();

    await loginPopupPage.fillCode(STATIC_OTP_CODE);

    await loginPopupPage.fillCreatePassword(process.env.USER_PASSWORD!);
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


test.describe('Email validation on registration modal', { tag: '@validation' }, () => {

  test.beforeEach(async ({ page }) => {
    const headerPage = new HeaderPage(page);
    const loginPopupPage = new LoginPopupPage(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await headerPage.clickSignup();
    await loginPopupPage.assertPopupVisible();
    await loginPopupPage.clickEmailEntry();
    await expect(loginPopupPage.emailUsernameeInput, 'Email input is not visible after opening email step').toBeVisible();
  });

  test('Username instead of email → username-not-allowed error', { annotation: { type: 'TC', description: 'VAL-014' } }, async ({ page }) => {
    const loginPopupPage = new LoginPopupPage(page);

    await test.step('Submit a username-shaped identifier', async () => {
      await loginPopupPage.fillEmailOrUsername(`qa_not_an_email_${Date.now()}`);
      await loginPopupPage.clickContinue();
    });

    await test.step('Verify username-not-allowed error', async () => {
      await expect(
        page.getByText("A username can't be used to sign up. Enter an email instead, or log in."),
        'Username-not-allowed error is not shown'
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test('Invalid email format → validation error', { annotation: { type: 'TC', description: 'VAL-015' } }, async ({ page }) => {
    const loginPopupPage = new LoginPopupPage(page);

    await test.step('Submit an invalid-format email', async () => {
      await loginPopupPage.fillEmailOrUsername('a@b');
      await loginPopupPage.clickContinue();
    });

    await test.step('Verify email-format validation error', async () => {
      await expect(
        page.getByText('Please enter a valid email or username.'),
        'Email-format validation error is not shown'
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test('Existing username → username-not-allowed error', { annotation: { type: 'TC', description: 'VAL-016' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const loginPopupPage = new LoginPopupPage(page);
    let username: string;

    await test.step('Create user via API', async () => {
      ({ username } = await authApi.createUserFast());
    });

    await test.step('Submit the existing username', async () => {
      await loginPopupPage.fillEmailOrUsername(username);
      await loginPopupPage.clickContinue();
    });

    await test.step('Verify username-not-allowed error and Log In switch', async () => {
      await expect(
        page.getByText("A username can't be used to sign up. Enter an email instead, or log in."),
        'Existing-username sign-up error is not shown'
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        loginPopupPage.emailSwitchIntentBtn,
        'Log In instead button is not visible'
      ).toBeVisible();
    });
  });

  test('Existing phone number → account-already-exists error', { annotation: { type: 'TC', description: 'VAL-017' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const loginPopupPage = new LoginPopupPage(page);
    let phone: string;

    await test.step('Create phone user via API', async () => {
      ({ phone } = await authApi.createUserFastViaPhone(DataGenerator.generatePhoneNumber()));
    });

    await test.step('Switch to phone and submit the taken number', async () => {
      await loginPopupPage.clickSwitchToPhone();
      await loginPopupPage.fillPhone(phone);
      await loginPopupPage.clickPhoneContinue();
    });

    await test.step('Verify "account already exists" error and Log In switch', async () => {
      await expect(
        page.getByText('An account already exists for this phone number.'),
        'Account-already-exists (phone) error is not shown'
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        loginPopupPage.phoneSwitchIntentBtn,
        'Log In instead button is not visible'
      ).toBeVisible();
    });
  });

});
