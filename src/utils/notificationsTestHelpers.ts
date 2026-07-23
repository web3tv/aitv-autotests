import { APIRequestContext } from "@playwright/test";
import { AuthApi } from "../api/AuthApi";
import { SubscriptionApi } from "../api/SubscriptionApi";
import { VideoApi } from "../api/VideoApi";

export interface NotificationsTestUser {
    email: string;
    username: string;
    token: string;
    channelId: string;
}

/** Creates a fresh user (static-OTP flow, no mailbox) and resolves their token + channel id. */
export async function createUserWithChannel(request: APIRequestContext): Promise<NotificationsTestUser> {
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    const { email, username } = await authApi.createUserFast();
    const token = await authApi.getUserToken(email, process.env.USER_PASSWORD!);
    const channelId = await videoApi.getChannelId(token);
    return { email, username, token, channelId };
}

/**
 * Seeds `count` UNSEEN `channel_subscription` notifications for the channel owner by
 * creating `count` fresh users that each free-follow the channel. Returns the follower
 * usernames in follow order.
 */
export async function seedFollowers(
    request: APIRequestContext,
    channelId: string,
    count: number
): Promise<string[]> {
    const authApi = new AuthApi(request);
    const subscriptionApi = new SubscriptionApi(request);
    const usernames: string[] = [];
    for (let i = 0; i < count; i++) {
        // Registration and follow are rate-limited when fired in a burst (429) —
        // retry with backoff instead of failing the seed.
        const follower = await withRetryOn429(() => authApi.createUserFast());
        const token = await authApi.getUserToken(follower.email, process.env.USER_PASSWORD!);
        await withRetryOn429(() => subscriptionApi.followChannel(token, channelId));
        usernames.push(follower.username);
    }
    return usernames;
}

/** Retries `fn` on 429 (rate limit) with a growing backoff; rethrows anything else. */
async function withRetryOn429<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
    for (let attempt = 0; ; attempt++) {
        try {
            return await fn();
        } catch (e) {
            if (attempt === maxAttempts - 1 || !String(e).includes('429')) throw e;
            await new Promise((r) => setTimeout(r, 10_000 * (attempt + 1)));
        }
    }
}

/**
 * Polls the on-platform notifications until `predicate` matches (house poll idiom —
 * notifications are produced asynchronously server-side, never assume immediate
 * availability). Returns the matched notification.
 */
export async function waitForNotification(
    request: APIRequestContext,
    token: string,
    predicate: (n: any) => boolean,
    options: { maxAttempts?: number; intervalMs?: number; status?: 'seen' | 'unseen' | 'clicked' } = {}
): Promise<any> {
    const { maxAttempts = 20, intervalMs = 3000, status } = options;
    const videoApi = new VideoApi(request);
    let items: any[] = [];
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        items = await videoApi.getNotifications(token, status);
        const match = items.find(predicate);
        if (match) return match;
        await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(
        `Notification not found after ${maxAttempts} attempts. Present types: ${items.map((n) => n.type).join(', ') || 'none'}`
    );
}

/** Polls until the user has at least `count` UNSEEN notifications. */
export async function waitForUnseenCount(
    request: APIRequestContext,
    token: string,
    count: number,
    options: { maxAttempts?: number; intervalMs?: number } = {}
): Promise<void> {
    const { maxAttempts = 20, intervalMs = 3000 } = options;
    const videoApi = new VideoApi(request);
    let last = 0;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const items = await videoApi.getNotifications(token, 'unseen');
        last = items.length;
        if (last >= count) return;
        await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`Expected >= ${count} unseen notifications, got ${last} after ${maxAttempts} attempts`);
}
