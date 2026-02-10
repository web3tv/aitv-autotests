import { test, expect } from '@playwright/test';
import { AuthFlow } from '../src/flows/AuthFlow';
import { AuthApi } from "../src/api/AuthApi";
import { SideBarPage } from '../src/pages/components/SideBarPage';


test.describe('Subscription plan tests', () => {
    let previousFailed = false;

     test.afterEach(async ({}, testInfo) => {
        if (testInfo.status !== 'passed') previousFailed = true;
    });

    test('Create subscription plan', async ({ page,request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const user = await authApi.createAndVerifyUser();
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(user.email, password);

        const sideBar = new SideBarPage(page);
        await sideBar.clickStudioMemberships();
        
      });


    test('Login with new email', async ({ page }) => {
        test.skip(previousFailed, 'Previous test failed');
        
      });

});