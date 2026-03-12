import { Page, Locator, Browser } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioContentPage {
    readonly page: Page;

    readonly firstVideoRaw : Locator;
    readonly shortsTab: Locator;
    readonly videosTab: Locator;
    readonly liveTab: Locator; 
    readonly playlistTab: Locator;




    constructor(page: Page) {
        this.page = page;

        this.firstVideoRaw = this.page.locator('[data-id="video"]').first().locator('..');
    

        this.shortsTab = this.page.locator('[data-id="shorts-tab"]');
        this.videosTab = this.page.locator('[data-id="videos-tab"]');
        this.liveTab = this.page.locator('[data-id="live-tab"]');
        this.playlistTab = this.page.locator('[data-id="playlist-tab"]');
    }

    async checkVideoDescription(description: any){
        await expect(this.firstVideoRaw.locator('[data-id="video"]')).toContainText(description);
    }
    async checkVideoVisibility(visibility: any){
        await expect(this.firstVideoRaw.locator('[data-id="visibility"]')).toContainText(visibility);
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

}