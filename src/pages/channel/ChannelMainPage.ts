import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { HeroPayPage } from '../heroPay/HeroPayPage';

export class ChannelMainPage {

    readonly page: Page;    


    readonly firstVideo: Locator;
    readonly exclusiveBadge: Locator;
    readonly lockedBadge: Locator;



    // MEMBERSHIP

    readonly subscribeBtn: Locator;
    readonly registerLoginBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.firstVideo = page.locator('[data-id="video"]').first();

        this.exclusiveBadge = page.locator('div').filter({ hasText: /^Exclusive Content$/ }).first();
        this.lockedBadge = this.firstVideo.locator('.locked');


        // MEMBERSHIP
        this.subscribeBtn = page.getByRole('button', { name: 'Subscribe Now!' });
        this.registerLoginBtn = page.getByRole('button', { name: 'Register/Login' });
    }


    // PUBLIC VIDEO

    async checkVideoIsExist(name: string){
        await expect(this.firstVideo).toContainText(name);
    }

    async clickFirstVideo(){
        await expect(this.firstVideo).toBeVisible();
        await this.firstVideo.click();
    }


    //PRIVATE VIDEO

    async checkChannelWithoutVideo(){
        await expect(this.page.locator('div').filter({ hasText: /^This channel doesn`t have any content$/ })).toBeVisible(); 
        await expect(this.firstVideo).toHaveCount(0);
    }

    async checkPrivateVideoOnChannelPage(){
        await expect(this.page.locator('body')).toContainText('This channel doesn`t have any content');
    }

    async checkPrivateVideoViaDirectLink(){
        await expect(this.page.getByText('This page isn\'t available.')).toBeVisible();
        await expect(this.page.getByRole('paragraph')).toContainText('This page isn\'t available. Sorry about that. Try searching for something else.');
    }

    // UNLISTED VIDEO

    async checkUnlistedVideoNotAvailable(){
        await expect(this.page.locator('body')).toContainText('This channel doesn`t have any content');
    }


    // PAID VIDEO ON MEMBERSHIP PAGE

    async clickRegisterLoginBtn(){
        await this.checkRegisterLoginBtn();
        await this.registerLoginBtn.click();
    }

    async clickButtonSubscribeNow(){
        await this.checkButtonSubscribeNow();
        await this.subscribeBtn.click();
    }

    async checkRegisterLoginBtn(){
        await expect(this.registerLoginBtn).toBeVisible();
    }
    
    async checkButtonSubscribeNow(){
        await expect(this.subscribeBtn).toBeVisible();
    }


    // PAID VIDEO

    async purhcaseMembershipFromMembershipPage(){
        await this.clickButtonSubscribeNow();
        const heroPay = new HeroPayPage(this.page);
        await heroPay.mockPayment();
        await expect(this.page.locator('body')).toContainText('Active');
    }

    async checkPaidVideoAttributes(){
        await this.checkExclusiveContentBadge();
        await this.checkLockedBadge();
    }

    async checkExclusiveContentBadge(){
        await this.firstVideo.hover();
        await expect(this.exclusiveBadge).toBeVisible();; 
    }

    async checkLockedBadge(){
        await expect(this.lockedBadge).toBeVisible();
    }


}