import { APIRequestContext } from "@playwright/test";
import { DataGenerator } from "../utils/dataGenerator";
import * as crypto from "node:crypto";


export class AuthApi {
    constructor(
    private request: APIRequestContext,
    private baseUrl = process.env.API_URL
    ) {}

    async createUser() {
        const { username, email } = DataGenerator.generateEmail("web3tv.com");

        const response = await this.request.post(`${this.baseUrl}/user/`, {
        headers: { "Content-Type": "application/json" },
        data: {
            email,
            username,
            plain_password: "Admin1@@",
        },
        });

        if (!response.ok()) {
        throw new Error(`❌ Failed to create user: ${response.status()}`);
        }

        const json = await response.json();

        return {
        id: json.id,
        email,
        username,
        };
    }

    async getAdminToken() {
        const adminUsername = process.env.USER_LOGIN_ADMIN!;
        const adminPassword = process.env.USER_PASSWORD!;

        const verifier = crypto.randomBytes(32).toString("base64url");
        const challenge = crypto
            .createHash("sha256")
            .update(verifier)
            .digest("base64url");

        const authorize = await this.request.post(
            `${this.baseUrl}/auth/authorize?client_id=fa281fa9-ea9c-467e-a0f1-776876c3ad76` +
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

        const code = authJson.code;

        const tokenRes = await this.request.post(`${this.baseUrl}/auth/token`, {
            headers: { "Content-Type": "application/json" },
            data: {
            grant_type: "authorization_code",
            client_id: "fa281fa9-ea9c-467e-a0f1-776876c3ad76",
            code,
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
            `${this.baseUrl}/auth/authorize?client_id=fa281fa9-ea9c-467e-a0f1-776876c3ad76` +
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
            client_id: "fa281fa9-ea9c-467e-a0f1-776876c3ad76",
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

    async verifyUser(id: string, email: string, adminToken: string) {
        const response = await this.request.patch(`${this.baseUrl}/admin/user/${id}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
        },
        data: {
            email,
            roles: ["ROLE_USER_VERIFIED"],
        },
        });

        if (!response.ok()) {
        throw new Error(`❌ Failed to verify user: ${response.status()}`);
        }
    }

    async createAndVerifyUser() {
        const user = await this.createUser();
        const adminToken = await this.getAdminToken();
        await this.verifyUser(user.id, user.email, adminToken);
        return user; 
    }
}
