import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { SideBarPage } from '../../src/pages/SideBarPage';
import { MainPage } from '../../src/pages/MainPage';
import { HeaderPage } from '../../src/pages/HeaderPage';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { StudioProfilePage } from '../../src/pages/StudioProfilePage';

test.describe('Handle validation on Edit Channel Page', () => {

    test.beforeEach(async ({ page }) => {
        const mainPage = new MainPage(page);
        const headerPage = new HeaderPage(page);
        const loginPage = new LoginPage(page);
        const login = process.env.USER_LOGIN!;
        const password = process.env.USER_PASSWORD!;
    
        const authFlow = new AuthFlow(loginPage);
    
        await authFlow.loginSuccess(login, password);
    });

    test('1. Empty username → Username is required', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        // await studioProfilePage.fillHandleName('');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle is required');
        await studioProfilePage.assertButtonsDisabled();
    });

    test('2. Too short username → Username must be at least 3 characters', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('ab');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must be at least 3 characters');
        await studioProfilePage.assertButtonsDisabled();
    });

    test('3. Too long handle → Max length of handle is 32 characters', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleWithoutAssertToHaveValue('hgjfkdlsffoepeoriefeferrerererrrw');
        await studioProfilePage.blur();
        await studioProfilePage.fillHandleName('hgjfkdlsffoepeoriefeferrerererrr');
        await studioProfilePage.assertError('32/32 characters limit');
        await studioProfilePage.assertButtonsDisabled();
    });

    test('4. Reject Not Latin chars → Username must start with a letter and contain only latin lowercase letters, digits, and underscores.', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('abcппкп');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await studioProfilePage.assertButtonsDisabled();
    });

    test('5. Reject spaces', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('abc def');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await studioProfilePage.assertButtonsDisabled();
    });

    test('6. Reject starting underscore', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('_abcdef');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await studioProfilePage.assertButtonsDisabled();
    });

    test('7. Username exists', async ({ page }) => {
        const username = process.env.USER_EXIST
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);
        
        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName(username);
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle exists');
        await studioProfilePage.assertButtonsDisabled();
    });

    test('8. Uppercase → should convert to lowercase', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleWithoutAssertToHaveValue('FewFWFTESTING');
        await studioProfilePage.blur();
        await studioProfilePage.asertLowerCase('fewfwftesting');
    });


})

test.describe('Handle validation on Create Channel Page', () => {
    test.beforeEach(async ({ page }) => {
        const mainPage = new MainPage(page);
        const headerPage = new HeaderPage(page);
        const loginPage = new LoginPage(page);
        const login = process.env.USER_LOGIN!;
        const password = process.env.USER_PASSWORD!;
    
        const authFlow = new AuthFlow(loginPage);
    
        await authFlow.loginSuccess(login, password);

        
    });
});