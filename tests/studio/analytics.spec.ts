import { test, expect } from '../fixtures';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { StudioAnalyticsPage } from '../../src/pages/studio/StudioAnalyticsPage';

test('Analytics page displays seeded statistics', {
    tag: '@db',
    annotation: { type: 'TC', description: 'ANALY-001' },
}, async ({ page, seededAnalytics }) => {
    test.setTimeout(300_000);
    const authFlow = new AuthFlow(page);
    const analyticsPage = new StudioAnalyticsPage(page);

    const { owner, videoTitle, totals } = seededAnalytics;

    await test.step('Login and navigate to analytics', async () => {
        await page.goto('/');
        await authFlow.loginSuccess(owner.email, process.env.USER_PASSWORD!, owner.username);
        await analyticsPage.navigateToAnalytics();
    });

    await test.step('Verify summary cards are displayed', async () => {
        await analyticsPage.assertViewsVisible();
        const viewsText = await analyticsPage.getViewsCount();
        expect(Number(viewsText.replace(/,/g, '')), 'Views count should match seeded total').toBe(totals.views);

        await analyticsPage.assertSubscribersVisible();
        const subsText = await analyticsPage.getSubscribersCount();
        expect(Number(subsText.replace(/,/g, '')), 'Subscribers count should match seeded total').toBe(totals.subscribers);
    });

    await test.step('Verify views chart and engagement chart are displayed', async () => {
        await analyticsPage.assertChartVisible();
        await analyticsPage.assertEngagementChartVisible();
    });

    await test.step('Verify engagement section', async () => {
        await analyticsPage.assertEngagementVisible();
        const likesText = await analyticsPage.getEngagementLikesText();
        const likesNum = Number(likesText.replace(/[^\d]/g, ''));
        expect(likesNum, 'Engagement 48h likes should match seeded count').toBe(totals.likesWithin48h);
    });

    await test.step('Verify latest uploaded content', async () => {
        await analyticsPage.assertLatestVideoVisible();
        const latestTitle = await analyticsPage.getLatestVideoTitle();
        expect(latestTitle, 'Latest video should be the uploaded video').toBe(videoTitle);

        const latestViews = await analyticsPage.getLatestVideoViewsCount();
        expect(Number(latestViews), 'Latest video views should match seeded count').toBe(totals.views);

        const latestLikes = await analyticsPage.getLatestVideoLikesCount();
        expect(Number(latestLikes), 'Latest video likes should match seeded count').toBe(totals.likes);

        const latestComments = await analyticsPage.getLatestVideoCommentsCount();
        expect(Number(latestComments), 'Latest video comments should match seeded count').toBe(totals.comments);
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
        expect(subsTotal, 'Subscribers chart total should match seeded subscribers').toBe(totals.subscribersWithin7Days);
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
        expect(chartViewsTotal, 'Chart views total should equal seeded views (all within 7 days)').toBe(totals.views);

        // newSubscribers should reflect only subscribers within 7 days (day 0, 2, 4, 6)
        expect(analyticsData.newSubscribers, 'New subscribers in last 7 days').toBe(totals.subscribersWithin7Days);

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
        const owner = await authApi.createUserFast();
        ownerEmail = owner.email;
        ownerUsername = owner.username;

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
