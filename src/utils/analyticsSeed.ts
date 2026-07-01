import { APIRequestContext } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { VideoApi } from '../api/VideoApi';
import { DatabaseHelper } from '../api/DatabaseHelper';

const VIDEO_PATH = 'test-data/fixtures/video/5secVideo.mp4';
const HELPER_USER_COUNT = 8;

/**
 * Expected totals for the seeded analytics data. Kept next to the seeding logic so the
 * test asserts against the same source of truth that produced the rows.
 *
 * Distribution across 7 days:
 *  Views:  d0=8, d1=6, d2=5, d3=4, d4=3, d5=2, d6=2  => 30
 *  Likes:  5 within 48h + 3 older                     => 8
 *  Comments: d0=3, d1=2, d2=2, d3=1, d5=2             => 10
 *  Subscribers: d0, d2, d4, d6, d10                   => 5 (4 within 7 days)
 */
export const ANALYTICS_TOTALS = {
    views: 30,
    likes: 8,
    comments: 10,
    subscribers: 5,
    likesWithin48h: 5,
    subscribersWithin7Days: 4,
} as const;

export interface SeededAnalytics {
    owner: { email: string; username: string };
    token: string;
    videoTitle: string;
    totals: typeof ANALYTICS_TOTALS;
}


export async function setupSeededAnalytics(request: APIRequestContext): Promise<SeededAnalytics> {
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    const password = process.env.USER_PASSWORD!;

    const owner = await authApi.createUserFast();
    const token = await authApi.getUserToken(owner.email, password);

    const videoTitle = `AnalyticsTest_${Date.now()}`;
    await videoApi.uploadVideo(token, VIDEO_PATH, {
        title: videoTitle,
        description: 'Analytics test video',
        privacySetting: 'public',
        waitForProcessing: true,
    });

    const helperEmails: string[] = [];
    for (let i = 0; i < HELPER_USER_COUNT; i++) {
        const user = await authApi.createUserFast();
        helperEmails.push(user.email);
    }

    const db = new DatabaseHelper();
    await db.connect();
    try {
        const videoHex = await db.getVideoId(videoTitle);
        const ownerHex = await db.getUserId(owner.email);
        const channelHex = await db.getChannelIdByVideo(videoHex);

        const helperHexIds: string[] = [];
        for (const email of helperEmails) {
            helperHexIds.push(await db.getUserId(email));
        }

        await db.seedVideoViews(videoHex, ownerHex, [
            { daysAgo: 0, count: 8 },
            { daysAgo: 1, count: 6 },
            { daysAgo: 2, count: 5 },
            { daysAgo: 3, count: 4 },
            { daysAgo: 4, count: 3 },
            { daysAgo: 5, count: 2 },
            { daysAgo: 6, count: 2 },
        ]);

        await db.seedVideoLikes(videoHex, [
            { userHexId: helperHexIds[0], hoursAgo: 2 },
            { userHexId: helperHexIds[1], hoursAgo: 12 },
            { userHexId: helperHexIds[2], hoursAgo: 24 },
            { userHexId: helperHexIds[3], hoursAgo: 36 },
            { userHexId: helperHexIds[4], hoursAgo: 44 },
            { userHexId: helperHexIds[5], hoursAgo: 72 },
            { userHexId: helperHexIds[6], hoursAgo: 120 },
            { userHexId: helperHexIds[7], hoursAgo: 168 },
        ]);

        await db.seedVideoComments(videoHex, [
            { authorHexId: helperHexIds[0], daysAgo: 0, count: 3 },
            { authorHexId: helperHexIds[1], daysAgo: 1, count: 2 },
            { authorHexId: helperHexIds[2], daysAgo: 2, count: 2 },
            { authorHexId: helperHexIds[3], daysAgo: 3, count: 1 },
            { authorHexId: helperHexIds[4], daysAgo: 5, count: 2 },
        ]);

        await db.seedChannelSubscribers(channelHex, [
            { userHexId: helperHexIds[0], daysAgo: 0 },
            { userHexId: helperHexIds[1], daysAgo: 2 },
            { userHexId: helperHexIds[2], daysAgo: 4 },
            { userHexId: helperHexIds[3], daysAgo: 6 },
            { userHexId: helperHexIds[4], daysAgo: 10 },
        ]);

        await db.updateVideoStats(videoHex, ANALYTICS_TOTALS.views, ANALYTICS_TOTALS.likes, ANALYTICS_TOTALS.comments);
        await db.updateChannelSubscriberCount(channelHex, ANALYTICS_TOTALS.subscribers);
    } finally {
        await db.disconnect();
    }

    return { owner, token, videoTitle, totals: ANALYTICS_TOTALS };
}
