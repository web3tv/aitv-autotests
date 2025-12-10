import { Page, Locator, Browser } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioContentPage {
    readonly page: Page;

    readonly lastVideoRaw : Locator;
    



    constructor(page: Page) {
        this.page = page;

        this.lastVideoRaw = this.page.locator('.infinite-scroll-component').locator('div').first();
    }

    async checkVideoDescription(description: any){
        await expect(this.lastVideoRaw.locator('[data-id="video"]')).toContainText(description);
    }
    async checkVideoVisibility(visibility: any){
        await expect(this.lastVideoRaw.locator('[data-id="visibility"]')).toContainText(visibility);
    }


    async openVideoFromStudio(){
        await this.lastVideoRaw.locator('[aria-label="open video"]').click();
        await this.page.waitForURL('**/video/**');
    }


   





}