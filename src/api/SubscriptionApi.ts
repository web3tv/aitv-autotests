import { APIRequestContext } from "@playwright/test";

interface CreatedSubscription {
    id: string;
    title: string;
    channelId: string;
}

export class SubscriptionApi {
    constructor(
        private request: APIRequestContext,
        private apiUrl = process.env.API_URL!
    ) {}

    /**
     * FREE follow of a channel (the "Follow" button on the channel page). Fires a
     * `channel_subscription` on-platform notification for the channel owner — used by
     * the notification-popup tests to seed unread notifications quickly.
     */
    async followChannel(token: string, channelId: string): Promise<void> {
        const response = await this.request.post(`${this.apiUrl}/subscriptions/`, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            data: { channelId },
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to follow channel ${channelId}: ${response.status()} ${body}`);
        }
    }

    async createPaidSubscription(
        token: string,
        channelId: string,
        options: {
            title?: string;
            description?: string;
            contentDetails?: string | null;
            price?: string;
            currency?: string;
            duration?: number;
            parentSubscriptionId?: string | null;
        } = {}
    ): Promise<CreatedSubscription> {
        const now = Date.now();
        const title = options.title ?? `Subscription ${new Date(now).toISOString()}`;
        const description = options.description ?? `Subscription ${new Date(now + 1000).toISOString()}`;

        const response = await this.request.post(
            `${this.apiUrl}/paid-subs`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    title,
                    description,
                    contentDetails: options.contentDetails ?? null,
                    duration: options.duration ?? 30,
                    price: options.price ?? "100",
                    currency: options.currency ?? "USD",
                    parentSubscriptionId: options.parentSubscriptionId ?? null,
                    channelId,
                },
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to create paid subscription: ${response.status()} ${body}`
            );
        }

        const json = await response.json();

        if (!json.id) {
            throw new Error(
                "No id returned from paid subscription creation"
            );
        }

        return { id: json.id, title, channelId };
    }

    async getMySubscriptions(
        token: string,
        options: { userId?: string; maxResults?: number; mine?: boolean } = {}
    ): Promise<any> {
        const params: Record<string, string | number | boolean> = {
            maxResults: options.maxResults ?? 50,
            mine: options.mine ?? true,
        };
        if (options.userId) params.userId = options.userId;

        const response = await this.request.get(`${this.apiUrl}/paid-subs/my`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            params,
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to GET /paid-subs/my: ${response.status()} ${body}`
            );
        }

        return response.json();
    }

    async listPaidSubsByChannel(token: string, channelId: string): Promise<any> {
        const response = await this.request.get(`${this.apiUrl}/paid-subs`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            params: { channelId },
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to GET /paid-subs?channelId=${channelId}: ${response.status()} ${body}`
            );
        }

        return response.json();
    }

    async listPaidSubsByCreator(token: string, creatorId: string): Promise<any> {
        const response = await this.request.get(`${this.apiUrl}/paid-subs`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            params: { creatorId },
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to GET /paid-subs?creatorId=${creatorId}: ${response.status()} ${body}`
            );
        }

        return response.json();
    }
}
