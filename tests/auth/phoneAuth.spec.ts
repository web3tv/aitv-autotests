import { test } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { RegistrationFlow } from '../../src/flows/RegistrationFlow';
import { DataGenerator } from '../../src/utils/dataGenerator';


test.describe('Phone login tests', () => {

    test('Success login via phone', { tag: '@critical', annotation: { type: 'TC', description: 'PHONE-AUTH-001' } }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const phone = DataGenerator.generatePhoneNumber();
        const user = await authApi.createUserFastViaPhone(phone);

        await test.step('Open login popup and enter phone credentials', async () => {
            await authFlow.loginViaPhonePopup(user.phone, process.env.USER_PASSWORD!, user.username);
        });
    });

    test('Can`t login with incorrect password', { annotation: { type: 'TC', description: 'PHONE-AUTH-003' } }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const phone = DataGenerator.generatePhoneNumber();
        await authApi.createUserFastViaPhone(phone);

        await test.step('Open popup and submit wrong password', async () => {
            await authFlow.passwordErrorViaPhonePopup(phone, 'Admin1@');
        });
    });

});


test.describe('Phone registration tests', () => {

    test('Register user via popup (phone flow)', { tag: '@critical', annotation: { type: 'TC', description: 'PHONE-AUTH-004' } }, async ({ page, request }) => {
        const authFlow = new AuthFlow(page);
        const registrationFlow = new RegistrationFlow(page, request);
        const phone = DataGenerator.generatePhoneNumber();
        let username: string;

        await test.step('Register new user via popup with phone', async () => {
            ({ username } = await registrationFlow.registerViaPhoneFast(phone));
        });

        await test.step('Verify user is logged in after registration', async () => {
            await authFlow.assertLoggedInAs(username);
        });
    });

});
