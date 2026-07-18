import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { AccountPage } from '../../src/pages/account/AccountPage';
import { createMailHelper, createMailFlows } from '../../src/utils/mailHelper';

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
    const accountPage = new AccountPage(page);
    const mailFlows = createMailFlows(request);

    await authFlow.loginSuccess(user.email, user.password, user.username);
    await authFlow.openAccountSettings();
    await accountPage.changePassword(user.password, newPassword);

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
    const accountPage = new AccountPage(page);

    await authFlow.loginSuccess(user.email, user.password, user.username);
    await authFlow.openAccountSettings();
    await accountPage.changePassword(user.password, newPassword);
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
    const accountPage = new AccountPage(page);
    await accountPage.changePassword(user.password, firstNewPassword);
  });

  const beforeSecondChange = Date.now();

  await test.step('Change password second time immediately', async () => {
    const accountPage = new AccountPage(page);
    await accountPage.changePassword(user.password, secondNewPassword);
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
    const accountPage = new AccountPage(page);
    const mailHelper = createMailHelper(request);
    newEmail = await mailHelper.generateEmail();
    await mailHelper.createMailbox();
    await accountPage.changeEmail(user.email, newEmail, user.password);
  });

  await test.step('Change password immediately after unverified email change', async () => {
    const accountPage = new AccountPage(page);
    await accountPage.changePassword(user.password, newPassword);
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
    const accountPage = new AccountPage(page);
    const mailHelper = createMailHelper(request);
    const mailFlows = createMailFlows(request);
    firstNewEmail = await mailHelper.generateEmail();
    await mailHelper.createMailbox();
    const firstNewToken = await mailHelper.getToken(firstNewEmail);
    await accountPage.changeEmail(user.email, firstNewEmail, user.password);
    firstVerificationUrl = await mailFlows.emailChangeUrl(firstNewToken);
  });

  await test.step('Change email second time immediately', async () => {
    const accountPage = new AccountPage(page);
    const mailHelper = createMailHelper(request);
    secondNewEmail = await mailHelper.generateEmail();
    await mailHelper.createMailbox();
    secondNewToken = await mailHelper.getToken(secondNewEmail);
    await accountPage.changeEmail(user.email, secondNewEmail, user.password);
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
    const accountPage = new AccountPage(page);
    await accountPage.assertDisplayedEmail(user.email);
    await accountPage.clickEditEmailBtn();
    await accountPage.fillNewEmail(takenEmail);
    await accountPage.fillEmailPassword(user.password);

    // Guard: no change-email request must be sent for a taken address.
    page.on('request', r => {
      if (r.url().includes('/api/account/email') && r.method() === 'PUT') putEmailSent = true;
    });

    // Clicking Continue triggers the availability check (button is enabled until the check returns).
    const checkPromise = page.waitForResponse(
      r => r.url().includes('/api/emails/check') && r.request().method() === 'GET',
      { timeout: 15000 }
    );
    await expect(accountPage.emailContinueBtn, 'Continue is not enabled before submit').toBeEnabled();
    await accountPage.emailContinueBtn.click();
    const checkResponse = await checkPromise;

    expect(checkResponse.status(), 'emails/check should return 200').toBe(200);
    expect(await checkResponse.json(), 'The taken email must be reported as already existing')
      .toMatchObject({ isExist: true });
  });

  await test.step('Submit is blocked client-side: inline error + disabled button, no PUT sent', async () => {
    const accountPage = new AccountPage(page);

    // Duplicate-email error shown, "sent" step never reached, Continue becomes disabled.
    await accountPage.assertEmailAlreadyRegisteredError();
    await expect(accountPage.emailContinueBtn, 'Continue must be disabled for a taken email').toBeDisabled();

    // No change-email request is ever fired.
    await page.waitForTimeout(2000);
    expect(putEmailSent, 'No PUT /api/account/email must be sent for a taken email').toBe(false);
  });

  await test.step('The email on the account page stays unchanged', async () => {
    const accountPage = new AccountPage(page);
    await accountPage.closeEmailModal();
    await accountPage.assertDisplayedEmail(user.email);
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
    const accountPage = new AccountPage(page);
    const mailHelper = createMailHelper(request);
    const mailFlows = createMailFlows(request);
    newEmail = await mailHelper.generateEmail();

    await authFlow.loginSuccess(user.email, user.password, user.username);
    await authFlow.openAccountSettings();
    await mailHelper.createMailbox();
    newEmailToken = await mailHelper.getToken(newEmail);
    await accountPage.assertDisplayedEmail(user.email);
    await accountPage.changeEmail(user.email, newEmail, user.password);
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