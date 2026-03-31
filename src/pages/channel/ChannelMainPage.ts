import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { HeroPayPage } from '../heroPay/HeroPayPage';

export class ChannelMainPage {

    readonly page: Page;    


    readonly firstVideo: Locator;
    readonly firstShort: Locator;

    readonly exclusiveBadge: Locator;
    readonly lockedBadge: Locator;
   



    // MEMBERSHIP

    readonly subscriptionCard: Locator;
    readonly subscribeBtn: Locator;
    readonly registerLoginBtn: Locator;
    readonly payWithBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.firstVideo = page.locator('[data-id="video"]').first();
        this.firstShort = page.locator('[data-id="clip"]').first();

        this.exclusiveBadge = page.locator('div').filter({ hasText: /^Exclusive Content$/ }).first();
        this.lockedBadge = this.firstVideo.locator('.locked');


        // MEMBERSHIP
        this.subscriptionCard = page.locator('[data-id="sub-card"]');
        this.subscribeBtn = page.getByRole('button', { name: 'Subscribe Now!' });
        this.registerLoginBtn = page.getByRole('button', { name: 'Register/Login' });
        this.payWithBtn = page.getByRole('button', { name: /Pay With/ });
    }


    // PUBLIC VIDEO/ SHORTS

    async checkVideoIsExist(name: string){
        await expect(this.firstVideo).toContainText(name);
    }

    async clickFirstVideo(){
        await expect(this.firstVideo).toBeVisible();
        await this.firstVideo.click();
    }

    async checkShortsIsExist(name: string){
        await expect(this.firstShort).toContainText(name);
    }

    async clickFirstShort(){
        await expect(this.firstShort).toBeVisible();
        await this.firstShort.click();
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

    async assertSubscriptionCardVisible(): Promise<void> {
        await expect(this.subscriptionCard, 'Subscription card is not visible').toBeVisible();
    }

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

    async clickPayWith(){
        await expect(this.payWithBtn, 'Pay With button is not visible').toBeVisible();
        await expect(this.payWithBtn, 'Pay With button is not enabled').toBeEnabled();
        await this.payWithBtn.click();
        await this.page.waitForURL(/pay\.hero\.io/, { timeout: 30_000 });
    }

    async purhcaseMembershipFromMembershipPageMockPayment(){
        await this.clickButtonSubscribeNow();
        await this.clickPayWith();
        const heroPay = new HeroPayPage(this.page);
        await heroPay.mockPayment();
        await expect(this.page.locator('body')).toContainText('Active');
    }

    async purhcaseMembershipFromMembershipPageTestNet(){
        await this.clickButtonSubscribeNow();
        await this.clickPayWith();
        const heroPay = new HeroPayPage(this.page);
        await heroPay.testnetPayment();

        // Poll for Active status — blockchain confirmation may take time
        const deadline = Date.now() + 120_000;
        while (Date.now() < deadline) {
            const body = await this.page.locator('body').innerText();
            if (body.includes('Active') && !body.includes('Inactive')) break;
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await this.page.waitForTimeout(15_000);
        }
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