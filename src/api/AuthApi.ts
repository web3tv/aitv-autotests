import { APIRequestContext } from "@playwright/test";
import { DataGenerator } from "../utils/dataGenerator";
import { MailTmHelper } from "../utils/mailTmHelper";
import * as crypto from "node:crypto";

const OAUTH_CLIENT_ID = "fa281fa9-ea9c-467e-a0f1-776876c3ad76";
const MAILTM_PASSWORD = "StrongPass123!";

export class AuthApi {
    constructor(
    private request: APIRequestContext,
    private baseUrl = process.env.API_URL,
    ) {}

    async getAdminToken() {
        const adminUsername = process.env.USER_LOGIN_ADMIN!;
        const adminPassword = process.env.USER_PASSWORD!;

        const verifier = crypto.randomBytes(32).toString("base64url");
        const challenge = crypto
            .createHash("sha256")
            .update(verifier)
            .digest("base64url");

        const authorize = await this.request.post(
            `${this.baseUrl}/auth/authorize?client_id=${OAUTH_CLIENT_ID}` +
            `&response_type=json&code_challenge=${challenge}&code_challenge_method=S256&scope=user`,
            {
            headers: { "Content-Type": "application/json" },
            data: { username: adminUsername, password: adminPassword }
            }
        );

        const authJson = await authorize.json();

        if (!authJson.code) {
            throw new Error("❌ Admin authorize failed: no auth code returned");
        }

        const tokenRes = await this.request.post(`${this.baseUrl}/auth/token`, {
            headers: { "Content-Type": "application/json" },
            data: {
            grant_type: "authorization_code",
            client_id: OAUTH_CLIENT_ID,
            code: authJson.code,
            code_verifier: verifier
            }
        });

        const tokenJson = await tokenRes.json();

        if (!tokenJson.access_token) {
            throw new Error("❌ Failed to get admin access_token");
        }

        return tokenJson.access_token;
    }

    async getUserToken(email: string, password: string) {
        const verifier = crypto.randomBytes(32).toString("base64url");
        const challenge = crypto
            .createHash("sha256")
            .update(verifier)
            .digest("base64url");

        const authorize = await this.request.post(
            `${this.baseUrl}/auth/authorize?client_id=${OAUTH_CLIENT_ID}` +
            `&response_type=json&code_challenge=${challenge}&code_challenge_method=S256&scope=user`,
            {
            headers: { "Content-Type": "application/json" },
            data: { username: email, password }
            }
        );

        const authJson = await authorize.json();

        if (!authJson.code) {
            throw new Error("❌ User authorize failed: no auth code returned");
        }

        const tokenRes = await this.request.post(`${this.baseUrl}/auth/token`, {
            headers: { "Content-Type": "application/json" },
            data: {
            grant_type: "authorization_code",
            client_id: OAUTH_CLIENT_ID,
            code: authJson.code,
            code_verifier: verifier
            }
        });

        const tokenJson = await tokenRes.json();

        if (!tokenJson.access_token) {
            throw new Error("❌ Failed to get user access_token");
        }

        return tokenJson.access_token;
    }

    async createAndVerifyUser() {
        const mailTm = new MailTmHelper(this.request);
        const email = await mailTm.generateEmail();
        await mailTm.createMailbox();
        const mailToken = await mailTm.getToken(email, MAILTM_PASSWORD);

        const startRes = await this.request.post(`${this.baseUrl}/auth/start`, {
            headers: { "Content-Type": "application/json" },
            data: { method: "email", identifier: email, clientId: OAUTH_CLIENT_ID },
        });
        if (!startRes.ok()) throw new Error(`❌ /auth/start failed: ${startRes.status()}`);
        const { otpChallengeId } = await startRes.json();

        const messageId = await mailTm.waitForMessage(mailToken, "verification", 15, 3000);
        const code = await mailTm.extractVerificationCode(messageId, mailToken);

        const verifyRes = await this.request.post(`${this.baseUrl}/auth/verify`, {
            headers: { "Content-Type": "application/json" },
            data: { challengeId: otpChallengeId, code },
        });
        if (!verifyRes.ok()) throw new Error(`❌ /auth/verify failed: ${verifyRes.status()}`);
        const { ticket } = await verifyRes.json();

        const username = DataGenerator.generateUsername();
        const completeRes = await this.request.post(`${this.baseUrl}/auth/complete`, {
            headers: { "Content-Type": "application/json" },
            data: { ticket, handle: username, password: process.env.USER_PASSWORD ?? "Admin1@@" },
        });
        if (!completeRes.ok()) throw new Error(`❌ /auth/complete failed: ${completeRes.status()}`);
        const completeJson = await completeRes.json();

        return {
            email,
            username: (completeJson.user?.username as string) ?? username,
            mailToken,
        };
    }

    async createUserFastViaPhone(phone: string, staticCode = '1111') {
        const startRes = await this.request.post(`${this.baseUrl}/auth/start`, {
            headers: { "Content-Type": "application/json" },
            data: { method: "phone", identifier: phone, clientId: OAUTH_CLIENT_ID },
        });
        if (!startRes.ok()) throw new Error(`❌ /auth/start (phone) failed: ${startRes.status()}`);
        const { otpChallengeId } = await startRes.json();

        const verifyRes = await this.request.post(`${this.baseUrl}/auth/verify`, {
            headers: { "Content-Type": "application/json" },
            data: { challengeId: otpChallengeId, code: staticCode },
        });
        if (!verifyRes.ok()) throw new Error(`❌ /auth/verify (phone) failed: ${verifyRes.status()}`);
        const { ticket } = await verifyRes.json();

        const username = DataGenerator.generateUsername();
        const completeRes = await this.request.post(`${this.baseUrl}/auth/complete`, {
            headers: { "Content-Type": "application/json" },
            data: { ticket, handle: username, password: process.env.USER_PASSWORD ?? "Admin1@@" },
        });
        if (!completeRes.ok()) throw new Error(`❌ /auth/complete (phone) failed: ${completeRes.status()}`);
        const completeJson = await completeRes.json();

        return {
            phone,
            username: (completeJson.user?.username as string) ?? username,
        };
    }

    async createUserFast(staticCode = '1111') {
        // No real mailbox is needed here: /auth/verify below uses a static OTP, so
        // the inbox is never polled. Building the address locally (instead of the
        // external mail.tm `GET /domains`) removes that service's intermittent
        // `socket hang up` as a setup-flake source. Timestamp + random keeps it unique.
        const domain = process.env.EMAIL_DOMAIN ?? 'aitv-test.com';
        const email = `qa_${Date.now()}_${DataGenerator.randomString(6)}@${domain}`;

        const startRes = await this.request.post(`${this.baseUrl}/auth/start`, {
            headers: { "Content-Type": "application/json" },
            data: { method: "email", identifier: email, clientId: OAUTH_CLIENT_ID },
        });
        if (!startRes.ok()) throw new Error(`❌ /auth/start failed: ${startRes.status()}`);
        const { otpChallengeId } = await startRes.json();

        const verifyRes = await this.request.post(`${this.baseUrl}/auth/verify`, {
            headers: { "Content-Type": "application/json" },
            data: { challengeId: otpChallengeId, code: staticCode },
        });
        if (!verifyRes.ok()) throw new Error(`❌ /auth/verify failed: ${verifyRes.status()}`);
        const { ticket } = await verifyRes.json();

        const username = DataGenerator.generateUsername();
        const completeRes = await this.request.post(`${this.baseUrl}/auth/complete`, {
            headers: { "Content-Type": "application/json" },
            data: { ticket, handle: username, password: process.env.USER_PASSWORD ?? "Admin1@@" },
        });
        if (!completeRes.ok()) throw new Error(`❌ /auth/complete failed: ${completeRes.status()}`);
        const completeJson = await completeRes.json();

        return {
            email,
            username: (completeJson.user?.username as string) ?? username,
        };
    }
}
