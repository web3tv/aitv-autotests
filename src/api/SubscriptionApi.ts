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
}
