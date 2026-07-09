import { APIRequestContext } from "@playwright/test";
import { DataGenerator } from "../utils/dataGenerator";
import { GmailHelper } from "../utils/gmailHelper";
import * as crypto from "node:crypto";

const OAUTH_CLIENT_ID = "fa281fa9-ea9c-467e-a0f1-776876c3ad76";

/** Static OTP accepted by dev stands for fast (no-mailbox) registration flows. */
export const STATIC_OTP_CODE = '1111';

export class AuthApi {
    constructor(
    private request: APIRequestContext,
    private baseUrl = process.env.API_URL,
    ) {}

    /** PKCE authorize → token exchange shared by the admin/user token getters. */
    private async getPkceToken(username: string, password: string, who: string): Promise<string> {
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
            data: { username, password }
            }
        );

        const authJson = await authorize.json();

        if (!authJson.code) {
            throw new Error(`❌ ${who} authorize failed: no auth code returned`);
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
            throw new Error(`❌ Failed to get ${who} access_token`);
        }

        return tokenJson.access_token;
    }

    async getAdminToken() {
        return this.getPkceToken(process.env.USER_LOGIN_ADMIN!, process.env.USER_PASSWORD!, "Admin");
    }

    async getUserToken(email: string, password: string) {
        return this.getPkceToken(email, password, "User");
    }

    /**
     * Shared registration chain: /auth/start → /auth/verify → /auth/complete.
     * `code` is either the OTP itself (static-OTP flows) or a provider called with the
     * challengeId after /auth/start (mailbox flows read the code from the inbox).
     * `label` only decorates error messages (e.g. "(phone)").
     */
    private async registerViaOtp(
        method: "email" | "phone",
        identifier: string,
        code: string | (() => Promise<string>),
        username: string,
        label = "",
    ): Promise<{ username: string }> {
        const startRes = await this.request.post(`${this.baseUrl}/auth/start`, {
            headers: { "Content-Type": "application/json" },
            data: { method, identifier, clientId: OAUTH_CLIENT_ID },
        });
        if (!startRes.ok()) throw new Error(`❌ /auth/start${label} failed: ${startRes.status()}`);
        const { otpChallengeId } = await startRes.json();

        const otp = typeof code === "function" ? await code() : code;

        const verifyRes = await this.request.post(`${this.baseUrl}/auth/verify`, {
            headers: { "Content-Type": "application/json" },
            data: { challengeId: otpChallengeId, code: otp },
        });
        if (!verifyRes.ok()) throw new Error(`❌ /auth/verify${label} failed: ${verifyRes.status()}`);
        const { ticket } = await verifyRes.json();

        const completeRes = await this.request.post(`${this.baseUrl}/auth/complete`, {
            headers: { "Content-Type": "application/json" },
            data: { ticket, handle: username, password: process.env.USER_PASSWORD ?? "Admin1@@" },
        });
        if (!completeRes.ok()) throw new Error(`❌ /auth/complete${label} failed: ${completeRes.status()}`);
        const completeJson = await completeRes.json();

        return { username: (completeJson.user?.username as string) ?? username };
    }

    async createAndVerifyUser() {
        const mailHelper = new GmailHelper(this.request);
        const email = await mailHelper.generateEmail();
        const mailToken = await mailHelper.getToken(email);

        const { username } = await this.registerViaOtp(
            "email",
            email,
            async () => {
                const messageId = await mailHelper.waitForMessage(mailToken, "verification", 15, 3000);
                return mailHelper.extractVerificationCode(messageId, mailToken);
            },
            DataGenerator.generateUsername(),
        );

        return { email, username, mailToken };
    }

    async createUserFastViaPhone(phone: string, staticCode = STATIC_OTP_CODE) {
        const { username } = await this.registerViaOtp(
            "phone",
            phone,
            staticCode,
            DataGenerator.generateUsername(),
            " (phone)",
        );

        return { phone, username };
    }

    async createUserFast(staticCode = STATIC_OTP_CODE, opts: { email?: string; username?: string } = {}) {
        // No real mailbox is needed here: /auth/verify uses a static OTP, so the inbox
        // is never polled. The address is built locally under EMAIL_DOMAIN (no
        // IMAP/Gmail round-trip at all). Timestamp + random keeps it unique.
        // `opts.email`/`opts.username` pin a deterministic account (used by the
        // visual-fixture seed script); omitted → random, as before.
        const domain = process.env.EMAIL_DOMAIN ?? 'aitv-test.com';
        const email = opts.email ?? `qa_${Date.now()}_${DataGenerator.randomString(6)}@${domain}`;

        const { username } = await this.registerViaOtp(
            "email",
            email,
            staticCode,
            opts.username ?? DataGenerator.generateUsername(),
        );

        return { email, username };
    }
}
