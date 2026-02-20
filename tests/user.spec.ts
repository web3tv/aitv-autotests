import { test, expect } from '@playwright/test';
import { AuthFlow } from '../src/flows/AuthFlow';
import { RegistrationFlow } from '../src/flows/RegistrationFlow';
import { SideBarPage } from '../src/pages/components/SideBarPage';
import { AccountPage } from '../src/pages/account/AccountPage';
import { MailTmHelper } from '../src/utils/mailTmHelper';
import { AuthApi } from '../src/api/AuthApi';
import { ProfilePage } from '../src/pages/account/ProfilePage';
import { SecurityPage } from '../src/pages/account/SecurityPage';

test.describe.configure({ mode: 'parallel' });

// ACCOUNT PAGE

test.describe.serial('Change password', () => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  const newPassword = 'NewPassword1@';

  test('Create user', async ({ page, request }) => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  })

  test('Update password without verifying via email', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const accountPage = new AccountPage(page);

    await authFlow.loginSuccess(user.email, user.password);
    await sideBarPage.clickSettingsAccount();
    await accountPage.changePassword(user.password, newPassword);
  });

  test('Login with old password without verifying via email -> Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, user.password);
  });

  test('Login with new password without verifying via email -> Error', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, newPassword);
  });

  test('Verify changing password via email', async ({ page, request }) => {
    const mailTmHelper = new MailTmHelper(request);
    const messageId = await mailTmHelper.waitForMessage(user.token, 'Password Verification');
    const verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, user.token);
    await page.goto(verificationUrl, { waitUntil: 'networkidle' });
    await expect(page.getByText(/Password Successfully Verified!/i)).toBeVisible({timeout: 20_000 });
  });

  test('Login with old password after verification via email -> Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, user.password);
  });

  test('Login with new password after verification via email -> Error', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, newPassword);
  });

})

test.describe.serial('Change email', () => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  let newEmailToken: string;
  let newEmail: string;
  let verificationUrl: string;

  test('Create user', async ({ page, request }) => {
    const registrationFlow = new RegistrationFlow(page, request);
    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
  })

  test('Change email', async ({ page, request }) => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const accountPage = new AccountPage(page);
    const mailTmHelper = new MailTmHelper(request);
    newEmail = await mailTmHelper.generateEmail();

    await authFlow.loginSuccess(user.email, user.password);
    await sideBarPage.clickSettingsAccount();
    await mailTmHelper.createMailbox();
    newEmailToken = await mailTmHelper.getToken(newEmail, mailTmHelper['password']);
    await accountPage.changeEmail(user.email, newEmail, user.password);
    const messageId = await mailTmHelper.waitForMessage(newEmailToken, 'Email Verification');
    verificationUrl = await mailTmHelper.extractVerificationUrl(messageId, newEmailToken);
  })

  test('Login with old email before verification -> Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, user.password);
  })

  test('Login with new email before verification -> Error', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(newEmail, user.password);
  })

  test('Verify changing email via email', async ({ page }) => {
    await page.goto(verificationUrl, { waitUntil: 'networkidle' });
    await expect(page.getByText(/Email Successfully Verified!/i)).toBeVisible({timeout: 40_000 });
  })

  test('Login with NEW email after verification -> Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(newEmail, user.password);
  });

  test('Login with OLD email after verification -> Error', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginFailed(user.email, user.password);
  });
});



// PROFILE PAGE

test.describe('Change user Avatar', () => {
  let user: { email: string };
  
  test('Change user avatar and check new avatar is displayed', async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const profilePage = new ProfilePage(page);
    const password = process.env.USER_PASSWORD!;

    user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, password);
    await sideBarPage.clickSettingsProfile();
    await profilePage.uploadProfileAvatarAndConfirmNewAvatarDisplayed();
  })

})



// SECURITY PAGE

test.describe.serial('Check 2FA', () => {
  let user: { email: string, username: string, password: string, token: string, mailTmPassword: string };
  
  test('Setup 2FA', async ({ page, request }) => {
    const registrationFlow = new RegistrationFlow(page, request);
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const securityPage = new SecurityPage(page);

    await registrationFlow.openRegistrationPage();
    user = await registrationFlow.registerAndVerifyUserViaEmail();
    await authFlow.loginSuccess(user.email, user.password);
    await sideBarPage.clickSettingsSecurity();
    await securityPage.setup2FA(user.email);
  })  

  test('Login - insert incorrect 2FA code - Failed', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginWith2FaFailed(user.email, user.password);
  })

  test('Login - insert correct 2FA code - Success', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    await authFlow.loginWith2FaSuccess(user.email, user.password, user.token);
  })   

  test('Disable 2FA - check login without 2FA', async ({ page }) => {
    const authFlow = new AuthFlow(page);
    const sideBarPage = new SideBarPage(page);
    const securityPage = new SecurityPage(page);

    await authFlow.loginWith2FaSuccess(user.email, user.password, user.token);
    await sideBarPage.clickSettingsSecurity();
    await securityPage.disable2FA(user.email);
    await authFlow.logout();  
    await authFlow.loginSuccess(user.email, user.password);
  }) 

})


// TODO: Convert to NFT