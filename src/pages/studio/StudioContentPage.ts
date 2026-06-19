import { Page, Locator, Browser } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioContentPage {
    readonly page: Page;

    readonly firstVideoRaw : Locator;
    readonly firstVideoDescription: Locator;
    readonly firstVideoVisibility: Locator;
    readonly firstVideoStatus: Locator;
    readonly firstVideoStatusIcon: Locator;
    readonly shortsTab: Locator;
    readonly videosTab: Locator;
    readonly liveTab: Locator;
    readonly seriesTab: Locator;
    readonly firstVideoLink: Locator;
    readonly searchInput: Locator;
    readonly videoRows: Locator;

    readonly videoRowImages: Locator;
    readonly videoRowDates: Locator;
    readonly videoRowTitles: Locator;
    readonly videoRowDescriptions: Locator;

    constructor(page: Page) {
        this.page = page;

        this.firstVideoRaw = this.page.locator('[data-testid="video-row"]').first();
        this.firstVideoLink = this.firstVideoRaw.locator('a[aria-label]');
        this.firstVideoDescription = this.firstVideoRaw.locator('[data-id="video"]');
        this.firstVideoVisibility = this.page.locator('[data-id="privacy-badge"]').first();
        this.firstVideoStatus = this.firstVideoRaw.locator('[data-id="date"]').first();
        this.firstVideoStatusIcon = this.page.locator('[data-id="upload-status-badge"]').first();

        this.shortsTab = this.page.locator('[data-id="segmented-control-shorts"]');
        this.videosTab = this.page.locator('[data-id="segmented-control-movies"]');
        this.seriesTab = this.page.locator('[data-id="segmented-control-series"]');
        this.liveTab = this.page.locator('[data-id="live-tab"]');
        

        this.searchInput = this.page.locator('[data-testid="studioSearchInput"]');
        this.videoRows = this.page.locator('[data-testid="video-row"]');

        this.videoRowImages = this.page.locator('[data-id="image"]');
        this.videoRowDates = this.page.locator('[data-id="date"]');
        this.videoRowTitles = this.page.locator('[data-testid="video-row"] .title');
        this.videoRowDescriptions = this.page.locator('[data-testid="video-row"] .description');
    }

    async checkVideoDescription(description: any){
        await expect(this.firstVideoDescription).toContainText(description);
    }
    async checkVideoVisibility(visibility: any){
        await expect(this.firstVideoVisibility).toContainText(visibility);
    }

    async checkVideoStatus(status: string) {
        await expect(this.firstVideoStatusIcon, 'Video status icon is not visible').toBeVisible({ timeout: 10_000 });
        await this.firstVideoStatusIcon.hover();
        await expect(this.page.getByRole('tooltip', { name: status }), `Tooltip "${status}" is not visible`).toBeVisible();
    }



    async getFirstVideoUrl(): Promise<string> {
        await expect(this.firstVideoLink, 'First video link is not visible').toBeVisible();
        const href = await this.firstVideoLink.getAttribute('href');
        if (!href) throw new Error('First video link has no href');
        return href;
    }



    
    // TABS 
    async clickShortsTab(){
       await this.shortsTab.click();
    }

    async clickVideosTab(){
        await this.videosTab.click();
    }

    async clickLiveTab(){
        await this.liveTab.click();
    }

    async clickSeriesTab(){
        await this.seriesTab.click();
    }

    async searchByText(text: string) {
        await expect(this.searchInput, 'Search input is not visible').toBeVisible();
        await expect(this.searchInput, 'Search input is not enabled').toBeEnabled();
        await this.searchInput.fill(text);
    }

    async clearSearch() {
        await expect(this.searchInput, 'Search input is not visible').toBeVisible();
        await expect(this.searchInput, 'Search input is not enabled').toBeEnabled();
        await this.searchInput.fill('');
    }

    async getVideoRowsCount(): Promise<number> {
        return await this.videoRows.count();
    }

    async assertVideoRowContainsTitle(title: string) {
        const row = this.videoRows.filter({ hasText: title });
        await expect(row.first(), `Video row with title "${title}" is not visible`).toBeVisible();
    }

    async assertNoVideoRows() {
        await expect(this.videoRows.first()).not.toBeVisible({ timeout: 5000 });
    }
}