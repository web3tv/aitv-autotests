import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { GmailHelper, EmailMessage } from '../../src/utils/gmailHelper';


const IP_RE = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

test.describe('Email templates content (AITV)', { tag: '@emails' }, () => {

    test('Verification code email — correct subject, sender and security content', {
        annotation: { type: 'TC', description: 'EMAIL-001' },
    }, async ({ request }) => {
        const authApi = new AuthApi(request);
        const mailHelper = new GmailHelper(request);
        let mailToken: string;
        let email: EmailMessage;

        await test.step('Register user via API (triggers verification email)', async () => {
            ({ mailToken } = await authApi.createAndVerifyUser());
        });

        await test.step('Fetch verification email', async () => {
            const messageId = await mailHelper.waitForMessage(mailToken, 'Email Verification', 15, 3000);
            email = await mailHelper.getMessage(messageId, mailToken);
        });

        await test.step('Assert common invariants and security content', async () => {
            GmailHelper.assertEmailBasics(email, { subject: 'Email Verification' });
            // контракт
            expect(email.text, 'verification heading').toContain('Verification code');
            expect(email.text, 'verification code present (4 digits)').toMatch(/\b\d{4}\b/);
            expect(email.text, 'request origin line').toContain('This request came from');
            expect(email.text, 'IP address present').toMatch(IP_RE);
            expect(email.text, 'UTC timestamp present').toContain('UTC');
            // копирайт — мягко
            expect(email.text, 'security note').toMatch(/do not share/i);
        });
    });

    test('Welcome email — correct subject, sender and content', {
        annotation: { type: 'TC', description: 'EMAIL-002' },
    }, async ({ request }) => {
        const authApi = new AuthApi(request);
        const mailHelper = new GmailHelper(request);
        let mailToken: string;
        let username: string;
        let email: EmailMessage;

        await test.step('Register user via API (triggers welcome email)', async () => {
            ({ mailToken, username } = await authApi.createAndVerifyUser());
        });

        await test.step('Fetch welcome email', async () => {
            const messageId = await mailHelper.waitForMessage(mailToken, 'Welcome to AI.TV', 15, 3000);
            email = await mailHelper.getMessage(messageId, mailToken);
        });

        await test.step('Assert common invariants and content', async () => {
            GmailHelper.assertEmailBasics(email, { subject: 'Welcome to AI.TV' });
            // контракт
            expect(email.text, 'personalised with username').toContain(username);
            expect(email.text, 'studio deep-link').toContain('/studio/content');
            // копирайт — мягко
            expect(email.text, 'explore/create CTA marker').toMatch(/start exploring|create video/i);
        });
    });

    test('Password reset email — correct subject, sender, working link and security content', {
        annotation: { type: 'TC', description: 'EMAIL-003' },
    }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const mailHelper = new GmailHelper(request);
        let mailToken: string;
        let userEmail: string;
        let email: EmailMessage;

        await test.step('Create user via API', async () => {
            ({ email: userEmail, mailToken } = await authApi.createAndVerifyUser());
        });

        await test.step('Request password reset via popup', async () => {
            await authFlow.submitForgotPasswordViaPopup(userEmail);
        });

        await test.step('Fetch password reset email', async () => {
            const messageId = await mailHelper.waitForMessage(mailToken, 'Your password verification link', 15, 3000);
            email = await mailHelper.getMessage(messageId, mailToken);
        });

        await test.step('Assert common invariants, link and security content', async () => {
            GmailHelper.assertEmailBasics(email, { subject: 'Your password verification link' });
            // ссылка может быть в text и/или html — проверяем объединённое тело
            const body = `${email.text}\n${email.html}`;
            // контракт
            expect(body, 'reset link points to reset-password').toMatch(/https:\/\/[^\s"'<>)]*\/reset-password\?[^\s"'<>)]+/i);
            expect(body, 'reset link carries id, code and email params').toMatch(/reset-password\?id=[^&]+&(?:amp;)?code=[^&]+&(?:amp;)?email=/i);
            expect(email.text, 'request origin line').toContain('This request came from');
            expect(email.text, 'IP address present').toMatch(IP_RE);
            // копирайт — мягко
            expect(email.text, 'reset heading').toMatch(/reset your password/i);
            expect(email.text, 'validity notice').toMatch(/24 hours/i);
        });
    });

    test('Password changed email — correct subject, sender and confirmation content', {
        annotation: { type: 'TC', description: 'EMAIL-004' },
    }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const mailHelper = new GmailHelper(request);
        const newPassword = 'Admin1234@@';
        let mailToken: string;
        let userEmail: string;
        let username: string;
        let email: EmailMessage;

        await test.step('Create user via API', async () => {
            ({ email: userEmail, username, mailToken } = await authApi.createAndVerifyUser());
        });

        await test.step('Request password reset and open reset link', async () => {
            await authFlow.submitForgotPasswordViaPopup(userEmail);
            const messageId = await mailHelper.waitForMessage(mailToken, 'Your password verification link', 15, 3000);
            const url = await mailHelper.extractPasswordResetnUrl(messageId, mailToken);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
        });

        await test.step('Set new password (triggers password-changed email)', async () => {
            await authFlow.submitNewPasswordViaResetLink(newPassword);
        });

        await test.step('Fetch password changed email', async () => {
            const messageId = await mailHelper.waitForMessage(mailToken, 'Your password has been changed', 15, 3000);
            email = await mailHelper.getMessage(messageId, mailToken);
        });

        await test.step('Assert common invariants and confirmation content', async () => {
            GmailHelper.assertEmailBasics(email, { subject: 'Your password has been changed' });
            // контракт
            expect(email.text, 'personalised with username').toContain(username);
            expect(email.text, 'change timestamp in UTC').toContain('UTC');
            // копирайт — мягко
            expect(email.text, 'confirmation copy').toMatch(/password was successfully changed/i);
            expect(email.text, 'support fallback').toMatch(/contact us/i);
        });
    });

});
