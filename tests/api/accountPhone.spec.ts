import { test, expect, APIRequestContext } from '@playwright/test';
import { AuthApi, STATIC_OTP_CODE } from '../../src/api/AuthApi';
import { DataGenerator } from '../../src/utils/dataGenerator';

/**
 * W3-2808 — contract tests for the account-phone endpoints, hitting the API directly:
 *   POST /user/me/phone        — start: validates the number + the current password, sends an OTP
 *   POST /user/me/phone/verify — verify: redeems the challenge and attaches the number
 * The UI-visible half of the feature lives in tests/accountSettings/security.spec.ts.
 */

const API_URL = process.env.API_URL!;

type PhoneUser = { email: string; username: string; token: string };

async function createUserWithToken(request: APIRequestContext): Promise<PhoneUser> {
    const authApi = new AuthApi(request);
    const { email, username } = await authApi.createUserFast();
    const token = await authApi.getUserToken(email, process.env.USER_PASSWORD!);
    return { email, username, token };
}

function startPhone(request: APIRequestContext, token: string, data: Record<string, unknown>) {
    return request.post(`${API_URL}/user/me/phone`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        data,
    });
}

function verifyPhone(request: APIRequestContext, token: string, data: Record<string, unknown>) {
    return request.post(`${API_URL}/user/me/phone/verify`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        data,
    });
}

test.describe('Account phone API', () => {

    test('Phone number format validation follows E.164', { annotation: { type: 'TC', description: 'API-PHONE-001' }, tag: '@validation' }, async ({ request }) => {
        const password = process.env.USER_PASSWORD!;
        let user: PhoneUser;

        await test.step('Create user and get a token', async () => {
            user = await createUserWithToken(request);
        });

        // invalid shapes: no leading +, leading zero, letters, over the 16-char limit, empty
        const invalidNumbers = ['2015550123', '+02015550123', '+1201555abcd', '+1234567890123456789', ''];

        for (const phone of invalidNumbers) {
            await test.step(`"${phone || '<empty>'}" is rejected with 422`, async () => {
                const response = await startPhone(request, user.token, { phone, currentPassword: password });
                expect(response.status(), `"${phone}" must be rejected`).toBe(422);
                expect(await response.json(), 'The rejection reason must be validation_failed')
                    .toMatchObject({ reason: 'validation_failed' });
            });
        }

        await test.step('A valid E.164 number is accepted and returns a challenge', async () => {
            const response = await startPhone(request, user.token, {
                phone: DataGenerator.generatePhoneNumber(),
                currentPassword: password,
            });
            expect(response.status(), 'A valid number must be accepted').toBe(200);
            expect((await response.json()).otpChallengeId, 'The response must carry a challenge id').toBeTruthy();
        });
    });

    test('Verify with another user challenge is rejected', { annotation: { type: 'TC', description: 'API-PHONE-002' } }, async ({ request }) => {
        const password = process.env.USER_PASSWORD!;
        let owner: PhoneUser;
        let outsider: PhoneUser;
        let challengeId: string;

        await test.step('Create two users', async () => {
            owner = await createUserWithToken(request);
            outsider = await createUserWithToken(request);
        });

        await test.step('The first user requests a code', async () => {
            const response = await startPhone(request, owner.token, {
                phone: DataGenerator.generatePhoneNumber(),
                currentPassword: password,
            });
            expect(response.status(), 'Requesting a code should succeed').toBe(200);
            challengeId = (await response.json()).otpChallengeId;
        });

        await test.step('The second user cannot redeem that challenge', async () => {
            const response = await verifyPhone(request, outsider.token, { otpChallengeId: challengeId, code: STATIC_OTP_CODE });
            expect(response.status(), 'A challenge of another user must be rejected with 410').toBe(410);
            expect(await response.json(), 'The error must be challenge_expired').toMatchObject({ error: 'challenge_expired' });
        });

        await test.step('No phone number was attached to the second user', async () => {
            const me = await request.get(`${API_URL}/user/me`, {
                headers: { Authorization: `Bearer ${outsider.token}` },
            });
            expect(me.status(), 'GET /user/me should return 200').toBe(200);
            expect((await me.json()).phone, 'The outsider must have no phone number').toBeFalsy();
        });
    });

    test('Anonymous auth-flow challenge cannot be redeemed on the account endpoint', { annotation: { type: 'TC', description: 'API-PHONE-003' } }, async ({ request }) => {
        let user: PhoneUser;
        let authChallengeId: string;

        await test.step('Create user and get a token', async () => {
            user = await createUserWithToken(request);
        });

        await test.step('Start an anonymous registration challenge for a free number', async () => {
            const response = await request.post(`${API_URL}/auth/start`, {
                headers: { 'Content-Type': 'application/json' },
                data: { method: 'phone', identifier: DataGenerator.generatePhoneNumber(), clientId: 'fa281fa9-ea9c-467e-a0f1-776876c3ad76' },
            });
            expect(response.status(), 'Anonymous /auth/start should succeed').toBe(200);
            authChallengeId = (await response.json()).otpChallengeId;
            expect(authChallengeId, 'The auth flow must return a challenge id').toBeTruthy();
        });

        await test.step('The account endpoint refuses the anonymous challenge', async () => {
            const response = await verifyPhone(request, user.token, { otpChallengeId: authChallengeId, code: STATIC_OTP_CODE });
            expect(response.status(), 'A cross-flow challenge must be rejected with 410').toBe(410);
            expect(await response.json(), 'The error must be challenge_expired').toMatchObject({ error: 'challenge_expired' });
        });
    });

    test('Wrong code decrements the attempts and then exhausts the challenge', { annotation: { type: 'TC', description: 'API-PHONE-004' } }, async ({ request }) => {
        const password = process.env.USER_PASSWORD!;
        let user: PhoneUser;
        let challengeId: string;

        await test.step('Create user and request a code', async () => {
            user = await createUserWithToken(request);
            const response = await startPhone(request, user.token, {
                phone: DataGenerator.generatePhoneNumber(),
                currentPassword: password,
            });
            expect(response.status(), 'Requesting a code should succeed').toBe(200);
            challengeId = (await response.json()).otpChallengeId;
        });

        await test.step('Each wrong code reports one attempt less (5 in total)', async () => {
            for (const attemptsRemaining of [4, 3, 2, 1]) {
                const response = await verifyPhone(request, user.token, { otpChallengeId: challengeId, code: '9999' });
                expect(response.status(), 'A wrong code must be rejected with 400').toBe(400);
                expect(await response.json(), 'The error must report the remaining attempts')
                    .toMatchObject({ error: 'invalid_code', attemptsRemaining });
            }
        });

        await test.step('The last wrong code exhausts the challenge', async () => {
            const response = await verifyPhone(request, user.token, { otpChallengeId: challengeId, code: '9999' });
            expect(response.status(), 'An exhausted challenge must answer 429').toBe(429);
            expect(await response.json(), 'The error must be attempts_exhausted').toMatchObject({ error: 'attempts_exhausted' });
            expect(response.headers()['retry-after'], 'A Retry-After header must be returned').toBeTruthy();
        });

        await test.step('Even the correct code no longer passes', async () => {
            const response = await verifyPhone(request, user.token, { otpChallengeId: challengeId, code: STATIC_OTP_CODE });
            expect(response.status(), 'The exhausted challenge must stay locked').toBe(429);
        });
    });

    test('Account with a password must supply the correct current password', { annotation: { type: 'TC', description: 'API-PHONE-005' } }, async ({ request }) => {
        const password = process.env.USER_PASSWORD!;
        const phone = DataGenerator.generatePhoneNumber();
        let user: PhoneUser;

        await test.step('Create user and get a token', async () => {
            user = await createUserWithToken(request);
        });

        await test.step('Without a current password the request is rejected', async () => {
            const response = await startPhone(request, user.token, { phone });
            expect(response.status(), 'A missing current password must be rejected with 422').toBe(422);
            const body = await response.json();
            expect(body, 'The rejection reason must be validation_failed').toMatchObject({ reason: 'validation_failed' });
            expect(JSON.stringify(body.errors), 'The error must point at the currentPassword field').toContain('currentPassword');
        });

        await test.step('With a wrong current password the request is rejected', async () => {
            const response = await startPhone(request, user.token, { phone, currentPassword: 'WrongPassword1@' });
            expect(response.status(), 'A wrong current password must be rejected with 422').toBe(422);
            expect(JSON.stringify(await response.json()), 'The message must name the incorrect password')
                .toContain('The provided password is incorrect.');
        });

        await test.step('With the correct current password a challenge is issued', async () => {
            const response = await startPhone(request, user.token, { phone, currentPassword: password });
            expect(response.status(), 'The correct current password must be accepted').toBe(200);
            expect((await response.json()).otpChallengeId, 'The response must carry a challenge id').toBeTruthy();
        });
    });

});
