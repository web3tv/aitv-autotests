import { test, expect } from '@playwright/test';
import { SideBarPage } from '../../src/pages/SideBarPage';
import { HeaderPage } from '../../src/pages/HeaderPage';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { StudioProfilePage } from '../../src/pages/StudioProfilePage';
import { UserDropdownPage } from '../../src/pages/UserDropdownPage';
import { CreateChannelPage } from '../../src/pages/CreateChannelPage';


test.describe('Handle validation on Edit Channel Page', () => {

    test.beforeEach(async ({ page }) => {
        const login = process.env.USER_LOGIN!;
        const password = process.env.USER_PASSWORD!;
    
        const authFlow = new AuthFlow(page);
    
        await authFlow.loginSuccess(login, password);
    });

    test('1. Empty username → Username is required', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle is required');
        await studioProfilePage.assertSaveBtnDisabled();
    });

    test('2. Too short username → Username must be at least 4 characters', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('abс');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must be at least 4 characters');
        await studioProfilePage.assertSaveBtnDisabled();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('abcd');
        await studioProfilePage.assertSaveBtnEnabled();

    });

    test('3. Too long handle → Max length of handle is 32 characters', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('hgjfkdlsffoepeoriefeferrerererrrw');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must have maximum 32 characters');
        await studioProfilePage.assertSaveBtnDisabled();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('hgjfkdlsffoepeoriefeferrerererrr');
        await studioProfilePage.assertError('32/32 characters limit');
        await studioProfilePage.assertSaveBtnEnabled();
    });

    test('4. Reject Not Latin chars → Handle must start with a letter and contain only latin lowercase letters, digits, and underscores.', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('abcппкп');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await studioProfilePage.assertSaveBtnDisabled();
    });

    test('5. Reject spaces', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('abc def');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await studioProfilePage.assertSaveBtnDisabled();
    });

    test('6. Reject starting underscore', async ({ page }) => {
        const sideBarPage = new SideBarPage(page)
        const studioProfilePage = new StudioProfilePage(page);

        await sideBarPage.clickStudioProfileChannel();
        await studioProfilePage.clearHandleInput();
        await studioProfilePage.fillHandleName('_abcdef');
        await studioProfilePage.blur();
        await studioProfilePage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await studioProfilePage.assertSaveBtnDisabled();
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
        await studioProfilePage.assertSaveBtnDisabled();
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
        const userDropdownPage = new UserDropdownPage(page);
        const headerPage = new HeaderPage(page);
        const createChannelPage = new CreateChannelPage(page)
        const login = process.env.USER_LOGIN!;
        const password = process.env.USER_PASSWORD!;
    
        const authFlow = new AuthFlow(page);
    
        await authFlow.loginSuccess(login, password);
        await headerPage.clickUserIcon();
        await userDropdownPage.clickAddChannelBtn();
        await createChannelPage.fillName('test_name')
    });

    test('1. Empty username → Username is required', async ({ page }) => {
        const createChannelPage = new CreateChannelPage(page)
        
        await createChannelPage.fillHandleName('')
        await createChannelPage.blur();
        await createChannelPage.assertError('Handle is required');
        await createChannelPage.assertSaveBtnDisabled();
    });

    test('2. Too short username → Username must be at least 4 characters', async ({ page }) => {
        const createChannelPage = new CreateChannelPage(page)

        await createChannelPage.fillHandleName('abc')
        await createChannelPage.blur();
        await createChannelPage.assertError('Handle must be at least 4 characters');
        await createChannelPage.assertSaveBtnDisabled();
        await createChannelPage.clearHandleInput();
        await createChannelPage.fillHandleName('abcd');
        await createChannelPage.assertSaveBtnEnabled();
    });

    test('3. Too long handle → Max length of handle is 32 characters', async ({ page }) => {
        const createChannelPage = new CreateChannelPage(page)

        await createChannelPage.fillHandleName('hgjfkdlsffoepeoriefeferrerererrrw');
        await createChannelPage.blur();
        await createChannelPage.assertError('Handle must have maximum 32 characters');
        await createChannelPage.assertSaveBtnDisabled();
        await createChannelPage.clearHandleInput();
        await createChannelPage.fillHandleName('hgjfkdlsffoepeoriefeferrerererrr');
        await createChannelPage.assertError('32/32 characters limit');
        await createChannelPage.assertSaveBtnEnabled();
    });

    test('4. Reject Not Latin chars → Handle must start with a letter and contain only latin lowercase letters, digits, and underscores.', async ({ page }) => {
        const createChannelPage = new CreateChannelPage(page)

        await createChannelPage.fillHandleName('abcппкп');
        await createChannelPage.blur();
        await createChannelPage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await createChannelPage.assertSaveBtnDisabled();
    });

    test('5. Reject spaces', async ({ page }) => {
        const createChannelPage = new CreateChannelPage(page)

        await createChannelPage.fillHandleName('abc def');
        await createChannelPage.blur();
        await createChannelPage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await createChannelPage.assertSaveBtnDisabled();
    });

    test('6. Reject starting underscore', async ({ page }) => {
        const createChannelPage = new CreateChannelPage(page)

        await createChannelPage.fillHandleName('_abcdef');
        await createChannelPage.blur();
        await createChannelPage.assertError('Handle must start with a letter and contain only latin lowercase letters, digits, and underscores');
        await createChannelPage.assertSaveBtnDisabled();
    });
    
    // NEED TI FIX ON FE SIDE
    test('7. Username exists', async ({ page }) => {
        const username = process.env.USER_EXIST
        const createChannelPage = new CreateChannelPage(page)
        
        await createChannelPage.fillHandleName(username);
        await createChannelPage.blur();
        await createChannelPage.assertError('Handle exists');
        await createChannelPage.assertSaveBtnDisabled();
    });

    test('8. Uppercase → should convert to lowercase', async ({ page }) => {
        const createChannelPage = new CreateChannelPage(page)

        await createChannelPage.fillHandleWithoutAssertToHaveValue('FewFWFTESTING');
        await createChannelPage.blur();
        await createChannelPage.asertLowerCase('fewfwftesting');
    });

});