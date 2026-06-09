import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { RegistrationFlow } from '../../src/flows/RegistrationFlow';
import { MailTmHelper } from '../../src/utils/mailTmHelper';


test.describe('Login tests', () => {

    test('Success login as user', { tag: '@critical', annotation: { type: 'TC', description: 'AUTH-001' } }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const user = await authApi.createUserFast();

        await test.step('Open login popup and enter credentials', async () => {
            await authFlow.loginViaPopup(user.email, process.env.USER_PASSWORD!, user.username);
        });
    });

    test('Success logout', { tag: '@critical', annotation: { type: 'TC', description: 'AUTH-004' } }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const user = await authApi.createUserFast();

        await test.step('Login via popup', async () => {
            await authFlow.loginViaPopup(user.email, process.env.USER_PASSWORD!, user.username);
        });

        await test.step('Logout and verify redirect to home', async () => {
            await authFlow.logout();
        });
    });

    test('Can`t login with incorrect password', { annotation: { type: 'TC', description: 'AUTH-002' } }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const user = await authApi.createUserFast();

        await test.step('Open popup and submit wrong password', async () => {
            await authFlow.passwordErrorViaPopup(user.email, 'Admin1@');
        });
    });

});


test.describe('Registration tests', () => {

    test('Register user via popup (email flow)', { tag: '@critical', annotation: { type: 'TC', description: 'AUTH-005' } }, async ({ page, request }) => {
        const authFlow = new AuthFlow(page);
        const registrationFlow = new RegistrationFlow(page, request);
        let username: string;

        await test.step('Register new user via popup', async () => {
            ({ username } = await registrationFlow.registerAndVerifyUserViaPopup());
        });

        await test.step('Verify user is logged in after registration', async () => {
            await authFlow.assertLoggedInAs(username);
        });
    });

    test('Register and verify user via API, then login via popup', { tag: '@critical', annotation: { type: 'TC', description: 'AUTH-006' } }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const user = await authApi.createUserFast();

        await test.step('Login via popup with API-created user', async () => {
            await authFlow.loginViaPopup(user.email, process.env.USER_PASSWORD!, user.username);
        });
    });

});


test.describe('Reset password tests', () => {

    test('Reset password via popup: old password fails, new password succeeds', { annotation: { type: 'TC', description: 'AUTH-007' } }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const mailTmHelper = new MailTmHelper(request);
        const oldPassword = process.env.USER_PASSWORD!;
        const newPassword = 'Admin1234@@';

        let email: string;
        let username: string;
        let mailToken: string;

        await test.step('Create user via API', async () => {
            ({ email, username, mailToken } = await authApi.createAndVerifyUser());
        });

        await test.step('Open popup, enter email and request password reset', async () => {
            await authFlow.submitForgotPasswordViaPopup(email);
        });

        await test.step('Extract reset URL from email and set new password', async () => {
            const messageId = await mailTmHelper.waitForMessage(mailToken, 'password', 15, 3000);
            const url = await mailTmHelper.extractPasswordResetnUrl(messageId, mailToken);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await authFlow.loginPopupPage.fillResetPassword(newPassword);
            await authFlow.loginPopupPage.clickResetFinish();
        });

        await test.step('Login with old password — expect error', async () => {
            await authFlow.passwordErrorViaPopup(email, oldPassword);
        });

        await test.step('Login with new password — expect success', async () => {
            await authFlow.loginViaPopup(email, newPassword, username);
        });
    });

    test('Can`t reset password with mismatched passwords in popup', { annotation: { type: 'TC', description: 'AUTH-008' } }, async ({ page, request }) => {
        const authFlow = new AuthFlow(page);
        const authApi = new AuthApi(request);
        const mailTmHelper = new MailTmHelper(request);
        const newPassword = 'Admin1234@@';
        const wrongPassword = 'Admin1233@@';

        let email: string;
        let username: string;
        let mailToken: string;

        await test.step('Create user via API', async () => {
            ({ email, username, mailToken } = await authApi.createAndVerifyUser());
        });

        await test.step('Open popup and request password reset', async () => {
            await authFlow.submitForgotPasswordViaPopup(email);
        });

        await test.step('Extract reset URL and enter new passwords with mismatch', async () => {
            const messageId = await mailTmHelper.waitForMessage(mailToken, 'password', 15, 3000);
            const url = await mailTmHelper.extractPasswordResetnUrl(messageId, mailToken);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await authFlow.loginPopupPage.fillResetPassword(newPassword);
            await authFlow.loginPopupPage.repeatResetPasswordInput.fill(wrongPassword);
        });

        await test.step('Verify set new password button is disabled on mismatch', async () => {
            await expect(
                authFlow.loginPopupPage.resetFinishBtn,
                'Finish button should be disabled when passwords do not match'
            ).toBeDisabled();
        });
    });

});


test.describe.skip('2FA tests', () => {

    test('Enable 2FA and verify code', { annotation: [{ type: 'TC', description: '2FA-001' }, { type: 'TC', description: '2FA-002' }, { type: 'TC', description: '2FA-003' }] }, async ({ page, request }) => {
        let user = { email: '', username: '', password: '', token: '', mailTmPassword: '' };

        await test.step('Register user and enable 2FA', async () => {
            const registrationFlow = new RegistrationFlow(page, request);
            const authFlow = new AuthFlow(page);

            user = await registrationFlow.registerAndVerifyUserViaPopup();
            await authFlow.loginViaPopup(user.email, user.password, user.username);
        });

        await test.step('Login - insert incorrect 2FA code - Failed', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginWith2FaFailed(user.email, user.password);
        });

        await test.step('Login - insert correct 2FA code - Success', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginWith2FaSuccess(user.email, user.password, user.token, user.username);
        });
    });

    test('Disable 2FA and verify login without 2FA', { annotation: { type: 'TC', description: '2FA-004' } }, async ({ page, request }) => {
        let user = { email: '', username: '', password: '', token: '', mailTmPassword: '' };

        await test.step('Register user and enable 2FA', async () => {
            const registrationFlow = new RegistrationFlow(page, request);
            const authFlow = new AuthFlow(page);

            user = await registrationFlow.registerAndVerifyUserViaPopup();
            await authFlow.loginViaPopup(user.email, user.password, user.username);
        });

        await test.step('Login without 2FA - Success', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginViaPopup(user.email, user.password, user.username);
        });
    });

});
