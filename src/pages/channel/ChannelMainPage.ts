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
    readonly subscriptionTitle: Locator;
    readonly subscriptionPrice: Locator;
    readonly subscriptionDescription: Locator;
    readonly subscribeBtn: Locator;
    readonly channelSubscribeBtn: Locator;
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
        this.subscriptionTitle = page.locator('[data-id="sub-title"]');
        this.subscriptionPrice = page.locator('[data-id="sub-price"]');
        this.subscriptionDescription = page.locator('[data-id="sub-description"]');
        this.subscribeBtn = this.subscriptionCard.getByRole('button', { name: 'Join' });
        this.channelSubscribeBtn = page.getByRole('button', { name: 'Subscribe', exact: true });
        this.registerLoginBtn = page.getByRole('button', { name: 'Login' });
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

    async assertSubscriptionCardVisible(name: string, description: string): Promise<void> {
        await expect(this.subscriptionCard, 'Subscription card is not visible').toBeVisible();
        await expect(this.subscriptionCard, 'Subscription card does not contain membership name').toContainText(name);
        await expect(this.subscriptionCard, 'Subscription card does not contain membership description').toContainText(description);
    }

    async clickRegisterLoginBtn(){
        await this.checkRegisterLoginBtn();
        await this.registerLoginBtn.click();
    }

    async clickButtonSubscribeNow(){
        await expect(this.subscribeBtn).toBeVisible();
        await expect(this.subscribeBtn).toBeEnabled();
        await this.subscribeBtn.click();
    }

    async checkRegisterLoginBtn(){
        await expect(this.registerLoginBtn).toBeVisible();
    }
    
    async checkButtonSubscribeNow(){
        await expect(this.subscribeBtn, 'Subscribe Now button is not visible').toBeVisible();
        await expect(this.subscribeBtn, 'Subscribe Now button is not enabled').toBeEnabled();
    }


    // PAID VIDEO

    async clickPayWith(){
        await expect(this.payWithBtn, 'Pay With button is not visible').toBeVisible();
        await expect(this.payWithBtn, 'Pay With button is not enabled').toBeEnabled();
        // force: true — после клика "Join" оверлей модалки может перехватывать pointer events
        await this.payWithBtn.click({ force: true });
        await this.page.waitForURL(/pay\.hero\.io/, { timeout: 30_000 });
    }

    async assertSubscriptionStatus(expectedStatus: string): Promise<void> {
        await expect(this.page.locator('body'), `Expected subscription status "${expectedStatus}" not found`).toContainText(expectedStatus);
    }

    async initiatePurchaseWithoutPayment(){
        await this.clickButtonSubscribeNow();
        await this.clickPayWith();
    }

    async purhcaseMembershipFromMembershipPageMockPayment(){
        await this.clickButtonSubscribeNow();
        await this.clickPayWith();
        const heroPay = new HeroPayPage(this.page);
        await heroPay.mockPayment();
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

    async waitForMembershipPage(): Promise<void> {
        await this.page.waitForURL(/membership/, { timeout: 15000 });
        await expect(this.subscriptionCard, 'Subscription card is not visible').toBeVisible({ timeout: 15000 });
    }

    async assertPaywallContent(name: string, description: string, price: string): Promise<void> {
        await expect(this.subscriptionTitle, 'Subscription title is not visible').toBeVisible();
        await expect(this.subscriptionTitle, `Subscription title does not contain "${name}"`).toContainText(name);
        await expect(this.subscriptionDescription, `Subscription description does not contain "${description}"`).toContainText(description);
        await expect(this.subscriptionPrice, `Subscription price does not contain "${price}"`).toContainText(price);
    }

    async assertLoginModalVisible(): Promise<void> {
        await expect(
            this.page.locator('body'),
            'Login modal message is not visible'
        ).toContainText('Please log in to your Web3.TV account using one of the login methods below');
    }

    async assertHeroPayInvoicePage(): Promise<void> {
        await expect(this.page, 'Not redirected to Hero Pay invoice page').toHaveURL(/test\.pay\.hero\.io\/invoice\/currency-list(\?.*)?$/);
    }

}