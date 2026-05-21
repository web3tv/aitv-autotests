import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';
import { DatabaseHelper } from '../../src/api/DatabaseHelper';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { StudioAnalyticsPage } from '../../src/pages/studio/StudioAnalyticsPage';

/**
 * Seed data distribution across 7 days:
 *
 * Views:  day 0 (today) = 8, day 1 = 6, day 2 = 5, day 3 = 4, day 4 = 3, day 5 = 2, day 6 = 2  => total 30
 * Likes:  within 48h = 5 (engagement), older = 3  => total 8
 * Comments: day 0 = 3, day 1 = 2, day 2 = 2, day 3 = 1, day 5 = 2  => total 10
 * Subscribers: day 0 = 1, day 2 = 1, day 4 = 1, day 6 = 1, day 10 = 1  => total 5
 */
const TOTAL_VIEWS = 30;
const TOTAL_LIKES = 8;
const TOTAL_COMMENTS = 10;
const TOTAL_SUBSCRIBERS = 5;
const LIKES_WITHIN_48H = 5;
const SUBSCRIBERS_WITHIN_7_DAYS = 4; // day 0, 2, 4, 6 — day 10 falls outside
const HELPER_USER_COUNT = 8;
//TODO: TIX after W3-2064
test('Analytics page displays seeded statistics', {
    tag: '@db',
    annotation: { type: 'TC', description: 'ANALY-001' },
}, async ({ page, request }) => {
    test.setTimeout(300_000);
    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);
    const db = new DatabaseHelper();
    const authFlow = new AuthFlow(page);
    const analyticsPage = new StudioAnalyticsPage(page);

    let videoTitle: string;
    let ownerEmail: string;
    let ownerUsername: string;
    const helperEmails: string[] = [];

    await test.step('Create owner user and upload video', async () => {
        const owner = await authApi.createAndVerifyUser();
        ownerEmail = owner.email;
        ownerUsername = owner.username;

        const token = await authApi.getUserToken(owner.email, process.env.USER_PASSWORD!);

        videoTitle = `AnalyticsTest_${Date.now()}`;
        await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            title: videoTitle,
            description: 'Analytics test video',
            privacySetting: 'public',
            waitForProcessing: true,
        });
    });

    await test.step('Create helper users for likes and subscriptions', async () => {
        for (let i = 0; i < HELPER_USER_COUNT; i++) {
            const user = await authApi.createAndVerifyUser();
            helperEmails.push(user.email);
        }
    });

    await test.step('Seed analytics data via DB', async () => {
        await db.connect();
        try {
            const videoHex = await db.getVideoId(videoTitle);
            const ownerHex = await db.getUserId(ownerEmail);
            const channelHex = await db.getChannelIdByVideo(videoHex);

            const helperHexIds: string[] = [];
            for (const email of helperEmails) {
                helperHexIds.push(await db.getUserId(email));
            }

            // Views: spread across 7 days
            await db.seedVideoViews(videoHex, ownerHex, [
                { daysAgo: 0, count: 8 },
                { daysAgo: 1, count: 6 },
                { daysAgo: 2, count: 5 },
                { daysAgo: 3, count: 4 },
                { daysAgo: 4, count: 3 },
                { daysAgo: 5, count: 2 },
                { daysAgo: 6, count: 2 },
            ]);

            // Likes: 5 within 48h (engagement), 3 older (unique user per like)
            await db.seedVideoLikes(videoHex, [
                { userHexId: helperHexIds[0], hoursAgo: 2 },
                { userHexId: helperHexIds[1], hoursAgo: 12 },
                { userHexId: helperHexIds[2], hoursAgo: 24 },
                { userHexId: helperHexIds[3], hoursAgo: 36 },
                { userHexId: helperHexIds[4], hoursAgo: 44 },
                // Older likes (outside 48h window, different users)
                { userHexId: helperHexIds[5], hoursAgo: 72 },
                { userHexId: helperHexIds[6], hoursAgo: 120 },
                { userHexId: helperHexIds[7], hoursAgo: 168 },
            ]);

            // Comments: spread across days from different users
            await db.seedVideoComments(videoHex, [
                { authorHexId: helperHexIds[0], daysAgo: 0, count: 3 },
                { authorHexId: helperHexIds[1], daysAgo: 1, count: 2 },
                { authorHexId: helperHexIds[2], daysAgo: 2, count: 2 },
                { authorHexId: helperHexIds[3], daysAgo: 3, count: 1 },
                { authorHexId: helperHexIds[4], daysAgo: 5, count: 2 },
            ]);

            // Subscribers: on different days
            await db.seedChannelSubscribers(channelHex, [
                { userHexId: helperHexIds[0], daysAgo: 0 },
                { userHexId: helperHexIds[1], daysAgo: 2 },
                { userHexId: helperHexIds[2], daysAgo: 4 },
                { userHexId: helperHexIds[3], daysAgo: 6 },
                { userHexId: helperHexIds[4], daysAgo: 10 },
            ]);

            // Update counters
            await db.updateVideoStats(videoHex, TOTAL_VIEWS, TOTAL_LIKES, TOTAL_COMMENTS);
            await db.updateChannelSubscriberCount(channelHex, TOTAL_SUBSCRIBERS);
        } finally {
            await db.disconnect();
        }
    });

    await test.step('Login and navigate to analytics', async () => {
        await page.goto('/');
        await authFlow.loginSuccess('gaxtw6224', process.env.USER_PASSWORD!, 'gaxtw6224');
        await analyticsPage.navigateToAnalytics();
    });

    await test.step('Verify summary cards are displayed', async () => {
        await analyticsPage.assertViewsVisible();
        const viewsText = await analyticsPage.getViewsCount();
        expect(Number(viewsText.replace(/,/g, '')), 'Views count should match seeded total').toBe(TOTAL_VIEWS);

        await analyticsPage.assertSubscribersVisible();
        const subsText = await analyticsPage.getSubscribersCount();
        expect(Number(subsText.replace(/,/g, '')), 'Subscribers count should match seeded total').toBe(TOTAL_SUBSCRIBERS);
    });

    await test.step('Verify views chart and engagement chart are displayed', async () => {
        await analyticsPage.assertChartVisible();
        await analyticsPage.assertEngagementChartVisible();
    });

    await test.step('Verify engagement section', async () => {
        await analyticsPage.assertEngagementVisible();
        const likesText = await analyticsPage.getEngagementLikesText();
        const likesNum = Number(likesText.replace(/[^\d]/g, ''));
        expect(likesNum, 'Engagement 48h likes should match seeded count').toBe(LIKES_WITHIN_48H);
    });

    await test.step('Verify latest uploaded content', async () => {
        await analyticsPage.assertLatestVideoVisible();
        const latestTitle = await analyticsPage.getLatestVideoTitle();
        expect(latestTitle, 'Latest video should be the uploaded video').toBe(videoTitle);

        const latestViews = await analyticsPage.getLatestVideoViewsCount();
        expect(Number(latestViews), 'Latest video views should match seeded count').toBe(TOTAL_VIEWS);

        const latestLikes = await analyticsPage.getLatestVideoLikesCount();
        expect(Number(latestLikes), 'Latest video likes should match seeded count').toBe(TOTAL_LIKES);

        const latestComments = await analyticsPage.getLatestVideoCommentsCount();
        expect(Number(latestComments), 'Latest video comments should match seeded count').toBe(TOTAL_COMMENTS);
    });

    await test.step('Verify top content contains the video', async () => {
        await analyticsPage.assertTopContentVisible();
        await analyticsPage.assertTopContentContainsVideo(videoTitle);
    });

    await test.step('Switch chart to Subscribers and verify API data', async () => {
        const subsChartResponse = await analyticsPage.switchChartToSubscribers();
        const subsChartData = await analyticsPage.parseChartResponse(Promise.resolve(subsChartResponse));

        expect(subsChartData.metric, 'Chart metric should be subscribers').toBe('subscribers');
        expect(subsChartData.granularity, 'Chart granularity should be day').toBe('day');
        expect(subsChartData.data.length, 'Subscribers chart should have data points').toBeGreaterThan(0);

        const subsTotal = subsChartData.data.reduce((sum, point) => sum + point.value, 0);
        expect(subsTotal, 'Subscribers chart total should match seeded subscribers').toBe(SUBSCRIBERS_WITHIN_7_DAYS);
    });

    await test.step('Switch chart back to Views', async () => {
        await analyticsPage.switchChartToViews();
        await analyticsPage.assertChartVisible();
    });

    await test.step('Switch to "Last 7 days" and verify API response', async () => {
        const { analyticsResponse, chartResponse } = await analyticsPage.selectPeriod('7D');

        const analyticsData = await analyticsPage.parseAnalyticsResponse(analyticsResponse);
        const chartData = await analyticsPage.parseChartResponse(chartResponse);

        // Chart should have data points for days with views
        expect(chartData.data.length, 'Chart should have data points for Last 7 days').toBeGreaterThan(0);
        expect(chartData.metric, 'Chart metric should be views').toBe('views');
        expect(chartData.granularity, 'Chart granularity should be day').toBe('day');

        // Total views in chart should equal sum of data points
        const chartViewsTotal = chartData.data.reduce((sum, point) => sum + point.value, 0);
        expect(chartViewsTotal, 'Chart views total should equal seeded views (all within 7 days)').toBe(TOTAL_VIEWS);

        // newSubscribers should reflect only subscribers within 7 days (day 0, 2, 4, 6)
        expect(analyticsData.newSubscribers, 'New subscribers in last 7 days').toBe(SUBSCRIBERS_WITHIN_7_DAYS);

        // latestVideo and topContent should still be present
        // expect(analyticsData.latestVideo?.title, 'Latest video title should match').toBe(videoTitle);
        expect(analyticsData.topContent.length, 'Top content should have entries').toBeGreaterThan(0);
    });
});

test('Analytics page shows empty state for user without statistics', {
    annotation: { type: 'TC', description: 'ANALY-006' },
}, async ({ page, request }) => {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const analyticsPage = new StudioAnalyticsPage(page);

    let ownerEmail: string;
    let ownerUsername: string;

    await test.step('Create fresh user and login', async () => {
        const owner = await authApi.createAndVerifyUser();
        ownerEmail = owner.email;
        ownerUsername = owner.username;

        await page.goto('/');
        await authFlow.loginSuccess(ownerEmail, process.env.USER_PASSWORD!, ownerUsername);
    });

    await test.step('Navigate to analytics', async () => {
        await analyticsPage.navigateToAnalytics();
    });

    await test.step('Verify summary cards show labels but no data', async () => {
        await expect(analyticsPage.viewsLabel, 'Views label is not visible').toBeVisible();
        await expect(analyticsPage.subscribersLabel, 'Subscribers label is not visible').toBeVisible();
    });

    await test.step('Verify engagement shows 0 likes', async () => {
        await expect(analyticsPage.engagementTitle, 'Engagement title is not visible').toBeVisible();
        const likesText = await analyticsPage.getEngagementLikesText();
        const likesNum = Number(likesText.replace(/[^\d]/g, ''));
        expect(likesNum, 'Engagement 48h likes should be 0').toBe(0);
    });

    await test.step('Verify empty state message is displayed', async () => {
        await expect(analyticsPage.emptyStateMessage, 'Empty state message is not visible').toBeVisible();
    });

    await test.step('Verify no charts rendered', async () => {
        const chartsCount = await page.locator('.recharts-wrapper').count();
        expect(chartsCount, 'No charts should be rendered for empty user').toBe(0);
    });

    await test.step('Verify no latest video section', async () => {
        await expect(analyticsPage.latestVideoSection, 'Latest video section should not exist').toBeHidden();
    });

    await test.step('Verify no top content table', async () => {
        await expect(analyticsPage.topContentHeader, 'Top Content should not exist').toBeHidden();
    });
});
