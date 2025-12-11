import { Page, Locator, Browser } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioContentPage {
    readonly page: Page;

    readonly firstVideoRaw : Locator;
    



    constructor(page: Page) {
        this.page = page;

        this.firstVideoRaw = this.page.locator('.infinite-scroll-component').locator('div').first();
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


   





}