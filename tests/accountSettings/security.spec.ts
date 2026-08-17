import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi, STATIC_OTP_CODE } from '../../src/api/AuthApi';
import { SecurityPage } from '../../src/pages/account/SecurityPage';
import { createMailHelper, createMailFlows } from '../../src/utils/mailHelper';
import { DataGenerator } from '../../src/utils/dataGenerator';
import { injectEthereumMock, type WalletInfo } from '../../src/utils/walletMock';

test.describe('Change password', () => {

  test('Change password with email confirmation', { annotation: { type: 'TC', description: 'ACCOUNT-010' } }, async ({ page, request }) => {
    let user: { email: string, username: string, password: string, token: string };
    const newPassword = 'NewPassword1@';

    await test.step('Create user', async () => {
      const authApi = new AuthApi(request);
      const { email, username, mailToken } = await authApi.createAndVerifyUser();
      user = { email, username, password: process.env.USER_PASSWORD!, token: mailToken };
    });

    await test.step('Change password and confirm it via the email link', async () => {
      const authFlow = new AuthFlow(page);
      const securityPage = new SecurityPage(page);
      const mailFlows = createMailFlows(request);

      await authFlow.loginSuccess(user.email, user.password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.changePassword(user.password, newPassword);

      const verificationUrl = await mailFlows.passwordChangeUrl(user.token);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Password updated/i)).toBeVisible({ timeout: 20_000 });
    });

    await test.step('Login with the old password -> Error', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginFailed(user.email, user.password);
    });

    await test.step('Login with the new password -> Success', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(user.email, newPassword, user.username);
    });
  });

  test('Change password without email confirmation', { annotation: { type: 'TC', description: 'ACCOUNT-011' } }, async ({ page, request }) => {
    let user: { email: string, username: string, password: string };
    const newPassword = 'NewPassword1@';

    await test.step('Create user', async () => {
      const authApi = new AuthApi(request);
      const { email, username } = await authApi.createAndVerifyUser();
      user = { email, username, password: process.env.USER_PASSWORD! };
    });

    await test.step('Change password but do NOT confirm it via email', async () => {
      const authFlow = new AuthFlow(page);
      const securityPage = new SecurityPage(page);

      await authFlow.loginSuccess(user.email, user.password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.changePassword(user.password, newPassword);
      await authFlow.logout();
    });

    await test.step('Login with the new (unconfirmed) password -> Error', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginFailed(user.email, newPassword);
    });

    await test.step('Login with the old password -> Success', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(user.email, user.password, user.username);
    });
  });

  // BLOCKED by W3-2783: second password change in one session fails with 412 Precondition Failed
  // (PUT /api/account/password), so the confirm-password-change modal never appears.
  // https://stretch-com.atlassian.net/browse/W3-2783
  test.fixme('Change password twice in one session', { annotation: { type: 'TC', description: 'ACCOUNT-006' } }, async ({ page, request }) => {
    let user: { email: string, username: string, password: string, token: string };
    const firstNewPassword = 'FirstNew1@@';
    const secondNewPassword = 'SecondNew1@@';

    await test.step('Create user', async () => {
      const authApi = new AuthApi(request);
      const { email, username, mailToken } = await authApi.createAndVerifyUser();
      user = { email, username, password: process.env.USER_PASSWORD!, token: mailToken };
    });

    await test.step('Login and navigate to account settings', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(user.email, user.password, user.username);
      await authFlow.openAccountSettings();
    });

    await test.step('Change password first time', async () => {
      const securityPage = new SecurityPage(page);
      await securityPage.changePassword(user.password, firstNewPassword);
    });

    const beforeSecondChange = Date.now();

    await test.step('Change password second time immediately', async () => {
      const securityPage = new SecurityPage(page);
      await securityPage.changePassword(user.password, secondNewPassword);
    });

    await test.step('Verify first password change via email', async () => {
      const mailFlows = createMailFlows(request);
      const verificationUrl = await mailFlows.passwordChangeUrl(user.token);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Password updated/i)).toBeVisible({ timeout: 20_000 });
    });

    await test.step('Verify second password change via email', async () => {
      const mailFlows = createMailFlows(request);
      const verificationUrl = await mailFlows.passwordChangeUrl(user.token, { since: beforeSecondChange });
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Password updated/i)).toBeVisible({ timeout: 20_000 });
    });

    await test.step('Login with second new password -> Success', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(user.email, secondNewPassword, user.username);
      await authFlow.logout();
    });

    await test.step('Login with first new password -> Error', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginFailed(user.email, firstNewPassword);
    });
  });

});

test.describe('Change email', () => {

  test('Change email without verification then change password', { annotation: { type: 'TC', description: 'ACCOUNT-007' } }, async ({ page, request }) => {
    let user: { email: string, username: string, password: string, token: string };
    let newEmail: string;
    const newPassword = 'NewPassword1@@';

    await test.step('Create user', async () => {
      const authApi = new AuthApi(request);
      const { email, username, mailToken } = await authApi.createAndVerifyUser();
      user = { email, username, password: process.env.USER_PASSWORD!, token: mailToken };
    });

    await test.step('Login and navigate to account settings', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(user.email, user.password, user.username);
      await authFlow.openAccountSettings();
    });

    await test.step('Change email without verification', async () => {
      const securityPage = new SecurityPage(page);
      const mailHelper = createMailHelper(request);
      newEmail = await mailHelper.generateEmail();
      await mailHelper.createMailbox();
      await securityPage.changeEmail(user.email, newEmail, user.password);
    });

    await test.step('Change password immediately after unverified email change', async () => {
      const securityPage = new SecurityPage(page);
      await securityPage.changePassword(user.password, newPassword);
    });

    await test.step('Verify password change via email from the still-verified old address', async () => {
      const mailFlows = createMailFlows(request);
      const verificationUrl = await mailFlows.passwordChangeUrl(user.token);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Password updated/i)).toBeVisible({ timeout: 20_000 });
    });

    await test.step('Old email + new password -> Success (unverified email change did not switch the login)', async () => {
      const authFlow = new AuthFlow(page);
      // Visiting the password-change verification link already signs the current session out
      // ("You'll be signed out from all other devices"), so no explicit logout is needed here.
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await authFlow.loginSuccess(user.email, newPassword, user.username);
      await authFlow.logout();
    });

    await test.step('New (unverified) email is not a recognized account -> no account found', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginNoAccountFound(newEmail);
    });
  });

  test('Change email twice without verification', { annotation: { type: 'TC', description: 'ACCOUNT-008' } }, async ({ page, request }) => {
    let user: { email: string, username: string, password: string, token: string };
    let firstNewEmail: string;
    let firstVerificationUrl: string;
    let secondNewEmail: string;
    let secondNewToken: string;

    await test.step('Create user', async () => {
      const authApi = new AuthApi(request);
      const { email, username, mailToken } = await authApi.createAndVerifyUser();
      user = { email, username, password: process.env.USER_PASSWORD!, token: mailToken };
    });

    await test.step('Login and navigate to account settings', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(user.email, user.password, user.username);
      await authFlow.openAccountSettings();
    });

    await test.step('Change email first time and get verification link', async () => {
      const securityPage = new SecurityPage(page);
      const mailHelper = createMailHelper(request);
      const mailFlows = createMailFlows(request);
      firstNewEmail = await mailHelper.generateEmail();
      await mailHelper.createMailbox();
      const firstNewToken = await mailHelper.getToken(firstNewEmail);
      await securityPage.changeEmail(user.email, firstNewEmail, user.password);
      firstVerificationUrl = await mailFlows.emailChangeUrl(firstNewToken);
    });

    await test.step('Change email second time immediately', async () => {
      const securityPage = new SecurityPage(page);
      const mailHelper = createMailHelper(request);
      secondNewEmail = await mailHelper.generateEmail();
      await mailHelper.createMailbox();
      secondNewToken = await mailHelper.getToken(secondNewEmail);
      await securityPage.changeEmail(user.email, secondNewEmail, user.password);
    });

    await test.step('First verification link is invalid and email not assigned', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.logout();
      await page.goto(firstVerificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/This verification link has expired or is no longer valid/i)).toBeVisible({ timeout: 10_000 });
      await authFlow.loginFailed(firstNewEmail, user.password);
    });

    await test.step('Verify second email and login with new email', async () => {
      const mailFlows = createMailFlows(request);
      const authFlow = new AuthFlow(page);
      const verificationUrl = await mailFlows.emailChangeUrl(secondNewToken);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email changed/i)).toBeVisible({ timeout: 40_000 });
      await authFlow.loginSuccess(secondNewEmail, user.password, user.username);
    });
  });

  test('Change email to an already-registered address is rejected', { annotation: { type: 'TC', description: 'ACCOUNT-009' } }, async ({ page, request }) => {
    let user: { email: string, username: string, password: string };
    let takenEmail: string;

    await test.step('Create the acting user and a second user whose email is already taken', async () => {
      const authApi = new AuthApi(request);
      const { email, username } = await authApi.createAndVerifyUser();
      user = { email, username, password: process.env.USER_PASSWORD! };
      const second = await authApi.createAndVerifyUser();
      takenEmail = second.email;
    });

    await test.step('Login and open account settings', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(user.email, user.password, user.username);
      await authFlow.openAccountSettings();
    });

    // On submit the FE validates the new email against GET /api/emails/check; a taken address is
    // flagged client-side (inline error + disabled button) and the change is never sent — no
    // PUT /api/account/email fires.
    let putEmailSent = false;

    await test.step('Submit the already-registered email -> FE reports it as existing', async () => {
      const securityPage = new SecurityPage(page);
      await securityPage.assertDisplayedEmail(user.email);
      await securityPage.clickEditEmailBtn();
      await securityPage.fillNewEmail(takenEmail);
      await securityPage.fillEmailPassword(user.password);

      // Guard: no change-email request must be sent for a taken address.
      page.on('request', r => {
        if (r.url().includes('/api/account/email') && r.method() === 'PUT') putEmailSent = true;
      });

      // Clicking Continue triggers the availability check (button is enabled until the check returns).
      const checkPromise = page.waitForResponse(
        r => r.url().includes('/api/emails/check') && r.request().method() === 'GET',
        { timeout: 15000 }
      );
      await expect(securityPage.emailContinueBtn, 'Continue is not enabled before submit').toBeEnabled();
      await securityPage.emailContinueBtn.click();
      const checkResponse = await checkPromise;

      expect(checkResponse.status(), 'emails/check should return 200').toBe(200);
      expect(await checkResponse.json(), 'The taken email must be reported as already existing')
        .toMatchObject({ isExist: true });
    });

    await test.step('Submit is blocked client-side: inline error + disabled button, no PUT sent', async () => {
      const securityPage = new SecurityPage(page);

      // Duplicate-email error shown, "sent" step never reached, Continue becomes disabled.
      await securityPage.assertEmailAlreadyRegisteredError();
      await expect(securityPage.emailContinueBtn, 'Continue must be disabled for a taken email').toBeDisabled();

      // No change-email request is ever fired.
      await page.waitForTimeout(2000);
      expect(putEmailSent, 'No PUT /api/account/email must be sent for a taken email').toBe(false);
    });

    await test.step('The email on the account page stays unchanged', async () => {
      const securityPage = new SecurityPage(page);
      await securityPage.closeEmailModal();
      await securityPage.assertDisplayedEmail(user.email);
    });
  });

  // W3-2910 fixed in W3-2808: the "Add Email" modal now asks for the current password whenever the
  // account has one (`requiresPassword = hasPassword`), so a phone+password user can attach an email.
  test('Add email to phone-registered account', { annotation: { type: 'TC', description: 'ACCOUNT-012' } }, async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const mailHelper = createMailHelper(request);
    let user: { phone: string, username: string, password: string };
    let email: string;
    let mailToken: string;

    await test.step('Create user via phone + password', async () => {
      const authApi = new AuthApi(request);
      const { phone, username } = await authApi.createUserFastViaPhone(DataGenerator.generatePhoneNumber());
      user = { phone, username, password: process.env.USER_PASSWORD! };
    });

    await test.step('Create disposable email', async () => {
      email = await mailHelper.generateEmail();
      await mailHelper.createMailbox();
      mailToken = await mailHelper.getToken(email);
    });

    await test.step('Login via phone and open account settings', async () => {
      await authFlow.loginSuccess({ phone: user.phone }, user.password, user.username);
      await authFlow.openAccountSettings();
    });

    await test.step('Add email: the modal asks for the current password since the account has one', async () => {
      await securityPage.clickAddEmailBtn();
      await securityPage.fillNewEmail(email);
      // W3-2910: this input does not exist in the "Add Email" modal today, so the flow is blocked.
      await securityPage.fillEmailPassword(user.password);
      await securityPage.clickEmailContinueBtn();
      await securityPage.verifyEmailConfirmationAlert();
      await securityPage.closeEmailModal();
    });

    await test.step('Verify email via the link from the mailbox', async () => {
      const verificationUrl = await createMailFlows(request).emailChangeUrl(mailToken);
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email added/i)).toBeVisible({ timeout: 40_000 });
    });

    await test.step('Email is attached to the account', async () => {
      await page.goto('/account?tab=security', { waitUntil: 'domcontentloaded' });
      await securityPage.assertDisplayedEmail(email);
      await expect(securityPage.addEmailRow, 'Add Email row must disappear once the email is attached').toBeHidden();

      const whoami = await page.request.get('/api/users/whoami');
      expect(whoami.status(), 'whoami should return 200').toBe(200);
      const { data } = await whoami.json();
      expect(data.email, 'whoami must report the attached email').toBe(email);
    });
  });

  test('Change email', { annotation: { type: 'TC', description: 'ACCOUNT-001' } }, async ({ page, request }) => {
    let user: { email: string, username: string, password: string, token: string };
    let newEmailToken: string;
    let newEmail: string;
    let verificationUrl: string;

    await test.step('Create user', async () => {
      const authApi = new AuthApi(request);
      const { email, username, mailToken } = await authApi.createAndVerifyUser();
      user = { email, username, password: process.env.USER_PASSWORD!, token: mailToken };
    });

    await test.step('Change email', async () => {
      const authFlow = new AuthFlow(page);
      const securityPage = new SecurityPage(page);
      const mailHelper = createMailHelper(request);
      const mailFlows = createMailFlows(request);
      newEmail = await mailHelper.generateEmail();

      await authFlow.loginSuccess(user.email, user.password, user.username);
      await authFlow.openAccountSettings();
      await mailHelper.createMailbox();
      newEmailToken = await mailHelper.getToken(newEmail);
      await securityPage.assertDisplayedEmail(user.email);
      await securityPage.changeEmail(user.email, newEmail, user.password);
      verificationUrl = await mailFlows.emailChangeUrl(newEmailToken);
      await authFlow.logout();
    });

    await test.step('Login with old email before verification -> Success', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(user.email, user.password, user.username);
      await authFlow.logout();
    });

    await test.step('Login with new email before verification -> Error', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginFailed(newEmail, user.password);
    });

    await test.step('Verify changing email via email', async () => {
      await page.goto(verificationUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Email changed/i)).toBeVisible({ timeout: 40_000 });
    });

    await test.step('Login with NEW email after verification -> Success', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginSuccess(newEmail, user.password, user.username);
      await authFlow.logout();
    });

    await test.step('Login with OLD email after verification -> Error', async () => {
      const authFlow = new AuthFlow(page);
      await authFlow.loginFailed(user.email, user.password);
    });
  });

});

test.describe('Manage phone', () => {

  test('Add phone number to an email account', { annotation: { type: 'TC', description: 'ACCOUNT-013' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const phone = DataGenerator.generatePhoneNumber();

    let user: { email: string, username: string };

    await test.step('Create user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Login and open account settings', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
    });

    await test.step('A fresh account shows the Add Phone row and no number', async () => {
      await expect(securityPage.addPhoneRow, 'Add Phone row should be visible for an account without a number').toBeVisible();
      await expect(securityPage.phoneValue, 'No phone number should be displayed yet').toBeHidden();
    });

    await test.step('Add the number and confirm it with the code', async () => {
      await securityPage.clickAddPhoneRow();
      await securityPage.submitPhone(phone, password);
      await securityPage.clickPhoneFinishBtn();
    });

    await test.step('The saved number is displayed and the Add Phone row is gone', async () => {
      await securityPage.assertDisplayedPhone(phone);
      await expect(securityPage.addPhoneRow, 'Add Phone row must disappear once a number is attached').toBeHidden();
      await expect(securityPage.changePhoneBtn, 'Change button should be available').toBeVisible();
    });

    await test.step('The number survives a reload', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await securityPage.assertDisplayedPhone(phone);
    });
  });

  test('Change an existing phone number', { annotation: { type: 'TC', description: 'ACCOUNT-014' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const oldPhone = DataGenerator.generatePhoneNumber();
    const newPhone = DataGenerator.generatePhoneNumber();

    let user: { phone: string, username: string };

    await test.step('Create user registered via phone', async () => {
      user = await authApi.createUserFastViaPhone(oldPhone);
    });

    await test.step('Login via phone and open account settings', async () => {
      await authFlow.loginSuccess({ phone: oldPhone }, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.assertDisplayedPhone(oldPhone);
    });

    await test.step('Change the number to a new one', async () => {
      await securityPage.clickChangePhoneBtn();
      await securityPage.submitPhone(newPhone, password);
      await securityPage.clickPhoneFinishBtn();
    });

    await test.step('The row shows the new number after a reload', async () => {
      await securityPage.assertDisplayedPhone(newPhone);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await securityPage.assertDisplayedPhone(newPhone);
    });
  });

  test('Added phone number works as a sign-in method', { annotation: { type: 'TC', description: 'ACCOUNT-015' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const phone = DataGenerator.generatePhoneNumber();

    let user: { email: string, username: string };

    await test.step('Create user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Login by email and attach a phone number', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.clickAddPhoneRow();
      await securityPage.submitPhone(phone, password);
      await securityPage.clickPhoneFinishBtn();
      await securityPage.assertDisplayedPhone(phone);
    });

    await test.step('Logout and login with the phone number', async () => {
      await authFlow.logout();
      await authFlow.loginSuccess({ phone }, password, user.username);
    });
  });

  test('Phone number already used by another account is rejected', { annotation: { type: 'TC', description: 'ACCOUNT-016' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const takenPhone = DataGenerator.generatePhoneNumber();

    await test.step('Create the account that owns the number', async () => {
      await authApi.createUserFastViaPhone(takenPhone);
    });

    let user: { email: string, username: string };

    await test.step('Create the second user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Login as a second user and try to attach the same number', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.clickAddPhoneRow();
      await securityPage.fillPhoneNumber(takenPhone);
      await securityPage.fillPhonePassword(password);
      const response = await securityPage.submitPhoneFormAndGetResponse();
      expect(response.status(), 'A taken phone number must be rejected with 409').toBe(409);
      expect((await response.json()).body, 'The rejection reason must be phone_already_in_use')
        .toMatchObject({ reason: 'phone_already_in_use' });
    });

    await test.step('The modal stays on the form step and explains the conflict', async () => {
      await expect(securityPage.phoneFormStep, 'The flow must stay on the form step').toBeVisible();
      await securityPage.assertPhoneModalError('This phone number is already in use by another account.');
      await expect(securityPage.phoneOtpInputs.first(), 'No code step should be reached').toBeHidden();
    });
  });

  // BLOCKED: the backend answers 422 with errors[{ path: 'currentPassword', … }], while the FE
  // normalizer reads `field`/`propertyPath`/`property` — so a wrong password is rendered as
  // "Please enter a valid phone number." under the PHONE field instead of the password one.
  // Reported in the W3-2808 comment (item 2).
  test.fixme('Wrong current password is reported on the password field', { annotation: { type: 'TC', description: 'ACCOUNT-017' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const phone = DataGenerator.generatePhoneNumber();

    let user: { email: string, username: string };

    await test.step('Create user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Login and open the add-phone modal', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.clickAddPhoneRow();
    });

    await test.step('Submit a valid number with a wrong current password', async () => {
      await securityPage.fillPhoneNumber(phone);
      await securityPage.fillPhonePassword('WrongPassword1@');
      const response = await securityPage.submitPhoneFormAndGetResponse();
      expect(response.status(), 'A wrong current password must be rejected with 422').toBe(422);
      expect((await response.json()).body, 'The rejection reason must be validation_failed')
        .toMatchObject({ reason: 'validation_failed' });
    });

    await test.step('The password field carries the error, the phone field does not', async () => {
      await expect(securityPage.phoneFormStep, 'The flow must stay on the form step').toBeVisible();
      await securityPage.assertPhoneModalError('The provided password is incorrect.');
      // a wrong password must not be reported as an invalid phone number
      await securityPage.assertPhoneModalErrorAbsent('Please enter a valid phone number.');
    });
  });

  test('Incomplete phone number keeps the submit button disabled', { annotation: { type: 'TC', description: 'ACCOUNT-018' }, tag: '@validation' }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;

    let user: { email: string, username: string };

    await test.step('Create user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Login and open the add-phone modal', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.clickAddPhoneRow();
    });

    await test.step('Continue is disabled while the form is empty', async () => {
      await expect(securityPage.phoneContinueBtn, 'Continue must be disabled with an empty form').toBeDisabled();
    });

    await test.step('Continue stays disabled for an incomplete number', async () => {
      await securityPage.fillPhoneNumber('+1201');
      await securityPage.fillPhonePassword(password);
      await expect(securityPage.phoneContinueBtn, 'Continue must be disabled for an incomplete number').toBeDisabled();
    });

    await test.step('Continue becomes enabled once the number is complete', async () => {
      await securityPage.fillPhoneNumber(DataGenerator.generatePhoneNumber());
      await expect(securityPage.phoneContinueBtn, 'Continue must be enabled for a complete number').toBeEnabled();
    });
  });

  test('Wrong verification code decrements the attempts counter', { annotation: { type: 'TC', description: 'ACCOUNT-019' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const phone = DataGenerator.generatePhoneNumber();

    let user: { email: string, username: string };

    await test.step('Create user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Login and request a code for a new number', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.clickAddPhoneRow();
      await securityPage.fillPhoneNumber(phone);
      await securityPage.fillPhonePassword(password);
      const response = await securityPage.submitPhoneFormAndGetResponse();
      expect(response.status(), 'Requesting a code should succeed').toBe(200);
    });

    await test.step('A wrong code is rejected and reports the remaining attempts', async () => {
      // a challenge starts with 5 attempts, so the first wrong code leaves 4
      const response = await securityPage.fillPhoneCodeAndGetResponse('9999');
      expect(response.status(), 'A wrong code must be rejected with 400').toBe(400);
      expect((await response.json()).body, 'The error must report the remaining attempts')
        .toMatchObject({ error: 'invalid_code', attemptsRemaining: 4 });
      await securityPage.assertPhoneModalError('Incorrect code. 4 attempts remaining.');
    });

    await test.step('The correct code still completes the flow', async () => {
      const response = await securityPage.fillPhoneCodeAndGetResponse(STATIC_OTP_CODE);
      expect(response.status(), 'The correct code must be accepted').toBe(204);
      await expect(securityPage.phoneSuccessStep, 'Phone success step is not visible').toBeVisible();
      await securityPage.clickPhoneFinishBtn();
      await securityPage.assertDisplayedPhone(phone);
    });
  });

  // BLOCKED: after a wrong code the boxes keep the entered digits (so retyping the same code
  // fires no request at all), and once the attempts are exhausted they stay enabled instead of
  // being blocked. Reported in the W3-2808 comment (items 3 and 4).
  test.fixme('Code input is cleared on error and blocked once attempts are exhausted', { annotation: { type: 'TC', description: 'ACCOUNT-020' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const phone = DataGenerator.generatePhoneNumber();

    let user: { email: string, username: string };

    await test.step('Create user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Login and request a code for a new number', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.clickAddPhoneRow();
      await securityPage.fillPhoneNumber(phone);
      await securityPage.fillPhonePassword(password);
      const response = await securityPage.submitPhoneFormAndGetResponse();
      expect(response.status(), 'Requesting a code should succeed').toBe(200);
    });

    await test.step('The boxes are cleared after a wrong code', async () => {
      await securityPage.fillPhoneCodeAndGetResponse('9999');
      await expect(securityPage.phoneOtpInputs.first(), 'Code boxes must be cleared after a wrong code').toHaveValue('');
    });

    await test.step('Exhausting the attempts blocks further input', async () => {
      // the challenge allows 5 attempts in total; 4 wrong ones are left
      for (const code of ['8888', '7777', '6666', '5555']) {
        await securityPage.fillPhoneCodeAndGetResponse(code);
      }
      await securityPage.assertPhoneModalError(/Too many incorrect attempts/);
      await expect(securityPage.phoneOtpInputs.first(), 'Code boxes must be blocked once attempts are exhausted').toBeDisabled();
    });
  });

  test('Edit returns to the form step and closing resets the modal', { annotation: { type: 'TC', description: 'ACCOUNT-021' } }, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const phone = DataGenerator.generatePhoneNumber();

    let user: { email: string, username: string };

    await test.step('Create user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Login and reach the code step', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.clickAddPhoneRow();
      await securityPage.fillPhoneNumber(phone);
      await securityPage.fillPhonePassword(password);
      const response = await securityPage.submitPhoneFormAndGetResponse();
      expect(response.status(), 'Requesting a code should succeed').toBe(200);
      await expect(securityPage.phoneOtpInputs.first(), 'Code step is not visible').toBeVisible();
    });

    await test.step('Edit brings the entered number back to the form step', async () => {
      await securityPage.clickPhoneOtpEditBtn();
      await expect(securityPage.phoneInput, 'The entered number should be kept when going back')
        .toHaveValue(new RegExp(phone.slice(2, 5)));
    });

    await test.step('Closing and reopening the modal resets the form', async () => {
      await securityPage.closePhoneModal();
      await securityPage.clickAddPhoneRow();
      await expect(securityPage.phoneInput, 'The number field must be empty after reopening').toHaveValue('');
      await expect(securityPage.phonePasswordInput, 'The password field must be empty after reopening').toHaveValue('');
      await expect(securityPage.phoneContinueBtn, 'Continue must be disabled after reopening').toBeDisabled();
    });
  });

});

// One account accumulating several sign-in methods: attaching one must not break the others,
// and every attached method must sign the user into the SAME account.
// Social providers are out of scope here — Google/Apple cannot be linked without a real OAuth
// round-trip (the backend verifies the token against Google userinfo / Apple JWKS) and Telegram
// linking would need the stand's bot token, so only their "not linked" state is asserted.
test.describe('All sign-in methods', () => {

  test('Email, phone and wallet all sign the same account in', { annotation: { type: 'TC', description: 'ACCOUNT-022' } }, async ({ page, request }) => {
    // three full UI logins plus two attach flows — ~45 s on dev2, twice the global 90 s budget
    test.setTimeout(150_000);

    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const securityPage = new SecurityPage(page);
    const password = process.env.USER_PASSWORD!;
    const phone = DataGenerator.generatePhoneNumber();
    let user: { email: string, username: string };
    let wallet: WalletInfo;

    await test.step('Create user', async () => {
      user = await authApi.createUserFast();
    });

    await test.step('Inject the wallet mock before the first navigation', async () => {
      // addInitScript + exposeFunction: must run before any goto and only once per page,
      // so every later wallet call passes { wallet, skipInjection: true }
      wallet = await injectEthereumMock(page);
    });

    await test.step('Login by email — only the email is attached', async () => {
      await authFlow.loginSuccess(user.email, password, user.username);
      await authFlow.openAccountSettings();
      await securityPage.assertDisplayedEmail(user.email);
      await expect(securityPage.addPhoneRow, 'A fresh account should offer to add a phone').toBeVisible();
      await expect(securityPage.noWalletRow, 'A fresh account should offer to add a wallet').toBeVisible();
    });

    await test.step('Attach a phone number', async () => {
      await securityPage.clickAddPhoneRow();
      await securityPage.submitPhone(phone, password);
      await securityPage.clickPhoneFinishBtn();
      await securityPage.assertDisplayedPhone(phone);
      await expect(securityPage.addPhoneRow, 'Add Phone row must disappear once a number is attached').toBeHidden();
    });

    await test.step('Attach a wallet', async () => {
      await authFlow.addWalletFromAccountSuccess({ wallet, skipInjection: true });
      await expect(securityPage.noWalletRow, 'Add wallet row must disappear once a wallet is attached').toBeHidden();
    });

    await test.step('All three methods are shown on one account', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await securityPage.assertDisplayedEmail(user.email);
      await securityPage.assertDisplayedPhone(phone);
      await securityPage.assertDisplayedWalletAddress(wallet.address);
    });

    await test.step('Social providers are offered but not linked', async () => {
      await securityPage.assertNoSocialConnected();
    });

    await test.step('The backend reports all three identities', async () => {
      const token = await authApi.getUserToken(user.email, password);
      const me = await request.get(`${process.env.API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(me.status(), 'GET /user/me should return 200').toBe(200);
      const body = await me.json();
      expect(body.email, 'The email must be reported by the backend').toBe(user.email);
      expect(body.phone, 'The phone must be reported by the backend').toBe(phone);
      expect(body.eip55Address, 'The wallet must be reported by the backend').toBeTruthy();
      expect(String(body.eip55Address).toLowerCase(), 'The reported wallet must be the attached one')
        .toBe(wallet.address.toLowerCase());
    });

    await test.step('Logout and sign in by email', async () => {
      await authFlow.logout();
      await authFlow.loginSuccess(user.email, password, user.username);
    });

    await test.step('Logout and sign in by phone', async () => {
      await authFlow.logout();
      await authFlow.loginSuccess({ phone }, password, user.username);
    });

    await test.step('Logout and sign in by wallet', async () => {
      await authFlow.logout();
      // skipModalCheck stops walletLoginSuccess from WAITING for the wallet-only "alternative
      // login method" prompt; that it never appears is asserted explicitly below
      await authFlow.walletLoginSuccess({ wallet, skipInjection: true, skipModalCheck: true });
      await authFlow.assertAddEmailPromptAbsent();
    });

    await test.step('The wallet session is the same account, with every method still attached', async () => {
      await authFlow.openAccountSettings();
      await authFlow.assertAddEmailPromptAbsent();
      await securityPage.assertDisplayedEmail(user.email);
      await securityPage.assertDisplayedPhone(phone);
      await securityPage.assertDisplayedWalletAddress(wallet.address);
    });
  });

});
