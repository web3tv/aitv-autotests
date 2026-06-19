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

    // Period tabs
    readonly periodSelector: Locator;
    readonly periodDateRange: Locator;
    readonly periodType: Locator;

    // Chart
    readonly mainChart: Locator;

    // Engagement
    readonly engagementTitle: Locator;
    readonly engagementLikes: Locator;
    readonly engagementChart: Locator;

    // Latest Video (right panel)
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

    // Dashboard page masks
    readonly dashboardAnalyticsData: Locator;
    readonly dashboardVideoTitle: Locator;
    readonly dashboardVideoCover: Locator;

    constructor(page: Page) {
        this.page = page;

        // Summary cards — scoped to chart option containers
        this.viewsCard = page.locator('[data-id="aitv-analytics-chart-option-views"]');
        this.viewsLabel = this.viewsCard.locator('span').filter({ hasText: /^Views$/ }).first();
        this.viewsCount = this.viewsCard.locator('p').first();

        this.subscribersCard = page.locator('[data-id="aitv-analytics-chart-option-subscribers"]');
        this.subscribersLabel = this.subscribersCard.locator('span').filter({ hasText: /^Subscribers$/ }).first();
        this.subscribersCount = this.subscribersCard.locator('p').first();

        // Period picker
        this.periodSelector = page.locator('[data-id="aitv-analytics-range-picker"]');
        this.periodDateRange = page.locator('span').filter({ hasText: /^\w{3}\s+\d+/ }).first();
        this.periodType = page.locator('[data-id^="aitv-analytics-range-preset-"]').first();

        // Main chart (recharts) — scoped to charts container
        this.mainChart = page.locator('[data-id="aitv-analytics-charts"]').locator('.recharts-wrapper').first();

        // Engagement section — scoped to engagement block
        this.engagementTitle = page.locator('[data-id="aitv-analytics-engagement"]').locator('span').filter({ hasText: /^Engagements$/ }).first();
        this.engagementLikes = this.engagementTitle.locator('xpath=../following-sibling::div[1]');
        this.engagementChart = page.locator('[data-id="aitv-analytics-engagement"]').locator('.recharts-wrapper').first();

        // Latest Video (right panel) — scoped to latest video block
        this.latestVideoSection = page.locator('[data-id="aitv-analytics-latest-video"]');
        this.latestVideoCover = this.latestVideoSection.locator('img').first();
        this.latestVideoTitle = this.latestVideoSection.locator('p').first();
        this.latestVideoViews    = this.latestVideoSection.locator('span').filter({ hasText: /^Views$/ }).locator('xpath=../following-sibling::span[1]');
        this.latestVideoLikes    = this.latestVideoSection.locator('span').filter({ hasText: /^Likes$/ }).locator('xpath=../following-sibling::span[1]');
        this.latestVideoComments = this.latestVideoSection.locator('span').filter({ hasText: /^Comments$/ }).locator('xpath=../following-sibling::span[1]');

        // Top Content — scoped to top content block
        this.topContentHeader = page.locator('[data-id="aitv-analytics-top-content"]').locator('p, span').filter({ hasText: /^Top Content In This Period$/ }).first();
        this.topContentRows = page.locator('[data-id="aitv-analytics-top-content"]').locator('> div').filter({ has: page.locator('img') });

        // Empty state
        this.emptyStateMessage = page.getByText("It's a bit empty here", { exact: false });

        // Dashboard page masks
        this.dashboardAnalyticsData = page.locator('[data-id="analytics-data"]');
        this.dashboardVideoTitle = page.locator('[data-id="video-title"]');
        this.dashboardVideoCover = page.locator('[data-id="video-cover"]');
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
        await this.viewsCard.click();
    }

    async switchChartToSubscribers(): Promise<Response> {
        const chartResponse = this.page.waitForResponse(
            r => r.url().includes('analytics-chart') && r.url().includes('metric=subscribers') && r.status() === 200,
            { timeout: 15000 }
        );
        await expect(this.subscribersCard, 'Subscribers card is not visible').toBeVisible();
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
     * Click a period tab by label (e.g. "7D", "30D", "Today", "YTD", "All", "Custom").
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

        const keyMap: Record<string, string> = {
            'Today': 'today',
            '7D': '7d',
            '30D': '30d',
            'YTD': 'ytd',
            'All': 'all',
        };
        const tab = periodText === 'Custom'
            ? this.page.locator('[data-id="aitv-analytics-range-custom"]')
            : this.page.locator(`[data-id="aitv-analytics-range-preset-${keyMap[periodText] ?? periodText.toLowerCase()}"]`);

        await expect(tab, `Period tab "${periodText}" is not visible`).toBeVisible();

        // Active tab has a unique CSS class; inactive tabs share the same class.
        // Clicking an already-active tab fires no API requests — reload instead.
        const isActive = await tab.evaluate((el) => {
            const siblings = Array.from(el.parentElement?.children ?? []).filter(c => c !== el);
            return siblings.length > 0 && !siblings.some(s => s.className === el.className);
        });

        if (isActive) {
            await this.page.reload({ waitUntil: 'domcontentloaded' });
        } else {
            await tab.click();
        }

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
