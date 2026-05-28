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
    readonly playlistTab: Locator;
    readonly searchInput: Locator;
    readonly videoRows: Locator;

    constructor(page: Page) {
        this.page = page;

        this.firstVideoRaw = this.page.locator('[data-testid="video-row"]').first();
        this.firstVideoDescription = this.firstVideoRaw.locator('[data-id="video"]');
        this.firstVideoVisibility = this.firstVideoRaw.locator('[data-id="visibility"]');
        this.firstVideoStatus = this.firstVideoRaw.locator('[data-id="date"]').first();
        this.firstVideoStatusIcon = this.firstVideoRaw.locator('.MuiBox-root > svg');

        this.shortsTab = this.page.locator('[data-id="shorts-tab"]');
        this.videosTab = this.page.locator('[data-id="videos-tab"]');
        this.liveTab = this.page.locator('[data-id="live-tab"]');
        this.playlistTab = this.page.locator('[data-id="playlist-tab"]');

        this.searchInput = this.page.locator('[data-testid="studioSearchInput"]');
        this.videoRows = this.page.locator('[data-testid="video-row"]');
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



    async getFirstVideoUrl(){
        const href = await this.firstVideoRaw.locator('[data-id="video"] a').getAttribute('href');
        return href
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

    async clickPlaylistTab(){
        await this.playlistTab.click();
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