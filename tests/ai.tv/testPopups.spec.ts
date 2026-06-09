import { test, expect } from '@playwright/test';
import { TestPopupsPage } from '../../src/pages/testPopups/TestPopupsPage';
import { LoginPopupPage } from '../../src/pages/testPopups/LoginPopupPage';

test.describe('Test Popups page', () => {

    test('Open Login Popup button opens login popup', {
        annotation: { type: 'TC', description: 'POPUP-001' },
    }, async ({ page }) => {
        const testPopupsPage = new TestPopupsPage(page);
        const loginPopupPage = new LoginPopupPage(page);

        await test.step('Navigate to test-popups page', async () => {
            await testPopupsPage.goto();
        });

        await test.step('Click Open Login Popup button', async () => {
            await testPopupsPage.clickOpenLoginPopup();
        });

        await test.step('Verify login popup is visible', async () => {
            await loginPopupPage.assertPopupVisible();
        });
    });

});
