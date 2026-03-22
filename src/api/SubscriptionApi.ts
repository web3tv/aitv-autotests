import { APIRequestContext } from "@playwright/test";

interface CreatedSubscription {
    id: string;
    title: string;
    channelId: string;
}

export class SubscriptionApi {
    constructor(
        private request: APIRequestContext,
        private baseUrl = process.env.BASE_URL!
    ) {}

    async createPaidSubscription(
        token: string,
        channelId: string,
        options: {
            title?: string;
            description?: string;
            price?: string;
            duration?: number;
            currency?: string;
        } = {}
    ): Promise<CreatedSubscription> {
        const title = options.title ?? "Subscription #1";

        const tokensData = JSON.stringify({
            token_type: "Bearer",
            expires_in: 3600,
            access_token: token,
            refresh_token: "",
            valid_until: Date.now() + 3600_000,
        });

        const response = await this.request.post(
            `${this.baseUrl}/api/paid-subscriptions`,
            {
                headers: {
                    Accept: "*/*",
                    "Content-Type": "text/plain;charset=UTF-8",
                    Cookie: `tokensData=${encodeURIComponent(tokensData)}`,
                },
                data: JSON.stringify({
                    title,
                    description: options.description ?? "Test Description",
                    price: options.price ?? "0.99",
                    duration: options.duration ?? 7,
                    currency: options.currency ?? "USD",
                    channelId,
                }),
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
}
