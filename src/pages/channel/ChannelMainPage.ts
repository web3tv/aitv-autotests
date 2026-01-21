import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ChannelMainPage {

    readonly page: Page;    


    readonly firstVideo: Locator;
    readonly exclusiveBadge: Locator;
    readonly lockedBadge: Locator;

    constructor(page: Page) {
        this.page = page;

        this.firstVideo = page.locator('[data-id="video"]').first();

        this.exclusiveBadge = page.locator('div').filter({ hasText: /^Exclusive Content$/ }).first();
        this.lockedBadge = this.firstVideo.locator('.locked');
    }

    async clickFirstVideo(){
        await expect(this.firstVideo).toBeVisible();
        await this.firstVideo.click();
    }

    async checkExclusiveContentBadge(){
        await this.firstVideo.hover();
        await expect(this.exclusiveBadge).toBeVisible();;
        
    }

    async checkLockedBadge(){
        await expect(this.lockedBadge).toBeVisible();
    }

    async checkPaidVideoAttributes(){
        await this.checkExclusiveContentBadge();
        await this.checkLockedBadge();
    }

    async checkChannelWithoutVideo(){
        await expect(this.page.locator('div').filter({ hasText: /^This channel doesn`t have any content$/ })).toBeVisible(); 
    }

    async checkPrivateVideoNotAvailable(){
        await expect(this.page.getByText('This page isn\'t available.')).toBeVisible();
        await expect(this.page.getByRole('paragraph')).toContainText('This page isn\'t available. Sorry about that. Try searching for something else.');
    }



}