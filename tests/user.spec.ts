import { test, expect } from '@playwright/test';
import { AuthFlow } from '../src/flows/AuthFlow';
import { RegistrationFlow } from '../src/flows/RegistrationFlow';
import { SideBarPage } from '../src/pages/components/SideBarPage';
import { AccountPage } from '../src/pages/account/accountPage';
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


test.describe('Update email', () => {

    test('Update email -> Verify new email -> Login with new email', async ({ page, request }) => {
        const authFlow = new AuthFlow(page);
        const registrationFlow = new RegistrationFlow(page, request);
        const mailTmHelper = new MailTmHelper(request);
        
        await registrationFlow.openRegistrationPage();
        const { email, password } = await registrationFlow.registerAndVerifyUserViaEmail();

        await authFlow.loginSuccess(email, password);

        const sideBarPage = new SideBarPage(page);
        await sideBarPage.clickSettingsAccount();

        
        const newEmail = await mailTmHelper.generateEmail();
        await mailTmHelper.createMailbox();
        const newEmailToken = await mailTmHelper.getToken(newEmail, mailTmHelper['password']);

        const accountPage = new AccountPage(page);
        await accountPage.changeEmail(newEmail, password);

        const messageId = await mailTmHelper.waitForMessage(newEmailToken, 'Email Verification');
        const verificationUrl = await mailTmHelper.extractVerificationUrl();

        await page.goto(verificationUrl, { waitUntil: 'networkidle' });
        await expect(page).toHaveURL('/');

        await authFlow.logout();

        await authFlow.loginSuccess(newEmail, password);
    });
})
