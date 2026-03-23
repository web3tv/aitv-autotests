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

    async createPaidSubscription(
        token: string,
        channelId: string,
        options: {
            title?: string;
            description?: string;
            price?: string;
            duration?: number;
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
                    price: options.price ?? "100",
                    duration: options.duration ?? 7,
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
}
