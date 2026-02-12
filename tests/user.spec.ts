import { test, expect } from '@playwright/test';
import { AuthFlow } from '../src/flows/AuthFlow';
import { RegistrationFlow } from '../src/flows/RegistrationFlow';
import { SideBarPage } from '../src/pages/components/SideBarPage';
import { AccountPage } from '../src/pages/account/AccountPage';
import { MailTmHelper } from '../src/utils/mailTmHelper';


//TODO: Add test for successful password change (with email verification)
test.describe('Change password', () => {

    test('Update password without verifying via email -> Can`t login with new password', async ({ page, request }) => {
        const authFlow = new AuthFlow(page);
        const registrationFlow = new RegistrationFlow(page,request)
        
        await registrationFlow.openRegistrationPage();
        const { email, password } = await registrationFlow.registerAndVerifyUserViaEmail();

        await authFlow.loginSuccess(email, password);

        const sideBarPage = new SideBarPage(page);
        await sideBarPage.clickSettingsAccount();

        const accountPage = new AccountPage(page);

        const newPassword = 'NewPassword1@';
        await accountPage.changePassword(password, newPassword);
        await authFlow.logout();

        await authFlow.loginFailed(email, newPassword)
        
    });

    test('Update password without verifying via email -> Can login with old password', async ({ page, request }) => {
        const authFlow = new AuthFlow(page);
        const registrationFlow = new RegistrationFlow(page,request)
        
        await registrationFlow.openRegistrationPage();
        const { email, password } = await registrationFlow.registerAndVerifyUserViaEmail();

        await authFlow.loginSuccess(email, password);


        const sideBarPage = new SideBarPage(page);
        await sideBarPage.clickSettingsAccount();

        const accountPage = new AccountPage(page);

        const newPassword = 'NewPassword1@';
        await accountPage.changePassword(password, newPassword);
        await authFlow.logout();

        await authFlow.loginSuccess(email, password)
    });

})
test.describe.serial('Update email', () => {
  let oldEmail: string;
  let password: string;
  let newEmail: string;

  test('Change email', async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const registrationFlow = new RegistrationFlow(page, request);
    const mailTmHelper = new MailTmHelper(request);
    const sideBarPage = new SideBarPage(page);
    const accountPage = new AccountPage(page);

    await registrationFlow.openRegistrationPage();
    ({ email: oldEmail, password } = await registrationFlow.registerAndVerifyUserViaEmail());

    await authFlow.loginSuccess(oldEmail, password);
    await sideBarPage.clickSettingsAccount();

    newEmail = await mailTmHelper.generateEmail();
    await mailTmHelper.createMailbox();
    const newEmailToken = await mailTmHelper.getToken(newEmail, mailTmHelper['password']);

    await accountPage.changeEmail(oldEmail, newEmail, password);

    const messageId = await mailTmHelper.waitForMessage(newEmailToken, 'Email Verification');
    const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, newEmailToken);

    await page.goto(verificationUrl, { waitUntil: 'networkidle' });
    await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({timeout: 40_000 });
  });

  test('Login with new email', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(newEmail, password);
  });

  test('Old email login should fail', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(oldEmail, password);
  });
});