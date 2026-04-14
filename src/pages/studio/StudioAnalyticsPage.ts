import { Page, Locator, expect, Response } from '@playwright/test';

export class StudioAnalyticsPage {
    readonly page: Page;

    // Summary cards
    readonly viewsLabel: Locator;
    readonly viewsCount: Locator;
    readonly viewsCard: Locator;
    readonly subscribersLabel: Locator;
    readonly subscribersCount: Locator;
    readonly subscribersCard: Locator;

    // Period selector
    readonly periodSelector: Locator;
    readonly periodDateRange: Locator;
    readonly periodType: Locator;

    // Chart
    readonly mainChart: Locator;

    // Engagement
    readonly engagementTitle: Locator;
    readonly engagementLikes: Locator;
    readonly engagementChart: Locator;

    // Latest Uploaded Content
    readonly latestVideoSection: Locator;
    readonly latestVideoTitle: Locator;
    readonly latestVideoCover: Locator;
    readonly latestVideoViews: Locator;
    readonly latestVideoLikes: Locator;
    readonly latestVideoComments: Locator;

    // Top Content table
    readonly topContentHeader: Locator;
    readonly topContentRows: Locator;

    // Empty state
    readonly emptyStateMessage: Locator;

    constructor(page: Page) {
        this.page = page;

        // Summary cards — find label P then sibling count P via parent
        this.viewsLabel = page.locator('p').filter({ hasText: /^\s*Views\s*$/ }).first();
        this.viewsCount = this.viewsLabel.locator('xpath=following-sibling::p[1]');
        this.viewsCard = this.viewsLabel.locator('..');

        this.subscribersLabel = page.locator('p').filter({ hasText: /^\s*Subscribers\s*$/ }).first();
        this.subscribersCount = this.subscribersLabel.locator('xpath=following-sibling::p[1]');
        this.subscribersCard = this.subscribersLabel.locator('..');

        // Period selector — the clickable area with date range and period type
        this.periodSelector = page.locator('[data-testid="KeyboardArrowDownIcon"]').locator('..');
        this.periodDateRange = this.periodSelector.locator('p').first();
        this.periodType = this.periodSelector.locator('p').nth(1);

        // Main chart (recharts)
        this.mainChart = page.locator('.recharts-wrapper').first();

        // Engagement section
        this.engagementTitle = page.locator('p').filter({ hasText: 'Engagement (48h)' });
        this.engagementLikes = this.engagementTitle.locator('..').locator('..').locator('p').filter({ hasText: /likes/ });
        this.engagementChart = this.engagementTitle.locator('..').locator('..').locator('.recharts-wrapper');

        // Latest Uploaded Content
        this.latestVideoSection = page.locator('[data-id="latest-video-section"]');
        this.latestVideoTitle = page.locator('[data-id="video-title"]');
        this.latestVideoCover = page.locator('[data-id="video-cover"]');
        this.latestVideoViews = page.locator('[data-id="views"]');
        this.latestVideoLikes = page.locator('[data-id="likes"]');
        this.latestVideoComments = page.locator('[data-id="comments"]');

        // Top Content table
        this.topContentHeader = page.locator('p').filter({ hasText: 'Top Content' });
        this.topContentRows = page.locator('p').filter({ hasText: 'Top Content' }).locator('..').locator('> div').filter({ has: page.locator('img') });

        // Empty state
        this.emptyStateMessage = page.getByText("It's a bit empty here", { exact: false });
    }

    async navigateToAnalytics(): Promise<void> {
        const studioUrl = process.env.STUDIO_URL || 'https://studio.web3tv.dev';
        const analyticsLoaded = this.page.waitForResponse(
            r => r.url().includes('/analytics') && !r.url().includes('analytics-chart') && r.url().includes('from=') && r.status() === 200,
            { timeout: 15000 }
        );
        await this.page.goto(`${studioUrl}/analytics`, { waitUntil: 'domcontentloaded' });
        await analyticsLoaded;
    }

    async assertViewsVisible(): Promise<void> {
        await expect(this.viewsLabel, 'Views label is not visible').toBeVisible();
        await expect(this.viewsCount, 'Views count is not visible').toBeVisible();
    }

    async assertSubscribersVisible(): Promise<void> {
        await expect(this.subscribersLabel, 'Subscribers label is not visible').toBeVisible();
        await expect(this.subscribersCount, 'Subscribers count is not visible').toBeVisible();
    }

    async assertEngagementVisible(): Promise<void> {
        await expect(this.engagementTitle, 'Engagement title is not visible').toBeVisible();
        await expect(this.engagementLikes, 'Engagement likes is not visible').toBeVisible();
    }

    async assertLatestVideoVisible(): Promise<void> {
        await expect(this.latestVideoSection, 'Latest video section is not visible').toBeVisible();
        await expect(this.latestVideoTitle, 'Latest video title is not visible').toBeVisible();
        await expect(this.latestVideoCover, 'Latest video cover is not visible').toBeVisible();
        await expect(this.latestVideoViews, 'Latest video views is not visible').toBeVisible();
        await expect(this.latestVideoLikes, 'Latest video likes is not visible').toBeVisible();
        await expect(this.latestVideoComments, 'Latest video comments is not visible').toBeVisible();
    }

    async assertChartVisible(): Promise<void> {
        await expect(this.mainChart, 'Main chart is not visible').toBeVisible();
    }

    async assertEngagementChartVisible(): Promise<void> {
        await expect(this.engagementChart, 'Engagement chart is not visible').toBeVisible();
    }

    async switchChartToViews(): Promise<void> {
        await expect(this.viewsCard, 'Views card is not visible').toBeVisible();
        await expect(this.viewsCard, 'Views card is not enabled').toBeEnabled();
        await this.viewsCard.click();
    }

    /**
     * Click Subscribers summary card to switch chart to subscribers metric.
     * Returns a promise for the chart API response.
     */
    async switchChartToSubscribers(): Promise<Response> {
        const chartResponse = this.page.waitForResponse(
            r => r.url().includes('analytics-chart') && r.url().includes('metric=subscribers') && r.status() === 200,
            { timeout: 15000 }
        );
        await expect(this.subscribersCard, 'Subscribers card is not visible').toBeVisible();
        await expect(this.subscribersCard, 'Subscribers card is not enabled').toBeEnabled();
        await this.subscribersCard.click();
        return await chartResponse;
    }

    async assertTopContentVisible(): Promise<void> {
        await expect(this.topContentHeader, 'Top Content header is not visible').toBeVisible();
    }

    async getViewsCount(): Promise<string> {
        return (await this.viewsCount.textContent()) ?? '';
    }

    async getSubscribersCount(): Promise<string> {
        return (await this.subscribersCount.textContent()) ?? '';
    }

    async getEngagementLikesText(): Promise<string> {
        return (await this.engagementLikes.textContent()) ?? '';
    }

    async getLatestVideoTitle(): Promise<string> {
        return (await this.latestVideoTitle.textContent()) ?? '';
    }

    async getLatestVideoViewsCount(): Promise<string> {
        return (await this.latestVideoViews.textContent()) ?? '';
    }

    async getLatestVideoLikesCount(): Promise<string> {
        return (await this.latestVideoLikes.textContent()) ?? '';
    }

    async getLatestVideoCommentsCount(): Promise<string> {
        return (await this.latestVideoComments.textContent()) ?? '';
    }

    async getTopContentRowCount(): Promise<number> {
        return await this.topContentRows.count();
    }

    async getTopContentRowTitle(index: number): Promise<string> {
        const row = this.topContentRows.nth(index);
        const titleEl = row.locator('img').first();
        return (await titleEl.getAttribute('alt')) ?? '';
    }

    async assertTopContentContainsVideo(title: string): Promise<void> {
        const topContentSection = this.topContentHeader.locator('..');
        await expect(topContentSection, `Top Content should contain "${title}"`).toContainText(title);
    }

    /**
     * Open period dropdown and select a period option by text.
     * Returns promises for analytics + chart API responses.
     */
    async selectPeriod(periodText: string): Promise<{ analyticsResponse: Promise<Response>; chartResponse: Promise<Response> }> {
        const analyticsResponse = this.page.waitForResponse(
            r => r.url().includes('/analytics') && !r.url().includes('analytics-chart') && r.url().includes('from=') && r.status() === 200,
            { timeout: 15000 }
        );
        const chartResponse = this.page.waitForResponse(
            r => r.url().includes('/analytics-chart') && r.url().includes('metric=views') && r.status() === 200,
            { timeout: 15000 }
        );

        await expect(this.periodSelector, 'Period selector is not visible').toBeVisible();
        await expect(this.periodSelector, 'Period selector is not enabled').toBeEnabled();
        await this.periodSelector.click();

        const periodOption = this.page.getByText(periodText, { exact: true });
        await expect(periodOption, `Period option "${periodText}" is not visible`).toBeVisible();
        await periodOption.click();

        return { analyticsResponse, chartResponse };
    }

    async parseAnalyticsResponse(responsePromise: Promise<Response>): Promise<AnalyticsData> {
        const response = await responsePromise;
        const json = await response.json();
        return json.data as AnalyticsData;
    }

    async parseChartResponse(responsePromise: Promise<Response>): Promise<ChartData> {
        const response = await responsePromise;
        const json = await response.json();
        return json.data as ChartData;
    }
}

export interface AnalyticsData {
    period: { from: string; to: string };
    summary: { views: number; subscribers: number; watchTimeSeconds: number };
    newSubscribers: number;
    engagement: { likes48h: number };
    secondaryMetrics: { retentionRate: number | null };
    latestVideo: {
        videoId: string;
        title: string;
        views: number;
        likes: number;
        commentCount: number;
    } | null;
    topContent: Array<{
        rank: number;
        videoId: string;
        title: string;
        views: number;
        likeCount: number;
        commentCount: number;
        avgViewDurationIso: string;
    }>;
}

export interface ChartData {
    metric: string;
    granularity: string;
    period: { from: string; to: string };
    data: Array<{ datetime: string; value: number }>;
}
