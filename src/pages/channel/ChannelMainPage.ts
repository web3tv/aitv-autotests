import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { HeroPayPage } from '../heroPay/HeroPayPage';

export class ChannelMainPage {

    readonly page: Page;    


    readonly videos: Locator;
    readonly firstVideo: Locator;
    readonly firstShort: Locator;

    readonly exclusiveBadge: Locator;
    readonly lockedBadge: Locator;

    readonly avatar: Locator;
    readonly videoCount: Locator;
    readonly subscribersCount: Locator;
    readonly channelName: Locator;
    readonly channelHandle: Locator;
    readonly forYouHeading: Locator;
    readonly editChannelBtn: Locator;

    // 2026 channel redesign — the public channel view was rebuilt with new markup.
    // The identity hero carries no data-id attributes, so name/handle are matched by
    // role/text; the grid tiles are `aitv-video-card` (cover-only at rest). Viewer
    // state is told apart by the hero action button: visitors/anon see "Follow",
    // the owner sees "Edit"/"Share".
    readonly videoCards: Locator;
    readonly shortCards: Locator;
    readonly channelNameHeading: Locator;
    readonly followBtn: Locator;
    readonly editBtn: Locator;
    readonly shareBtn: Locator;




    // MEMBERSHIP

    readonly subscriptionCard: Locator;
    readonly subscriptionTitle: Locator;
    readonly subscriptionPrice: Locator;
    readonly subscriptionDescription: Locator;
    readonly subscribeBtn: Locator;
    readonly channelSubscribeBtn: Locator;
    readonly registerLoginBtn: Locator;
    readonly payWithBtn: Locator;

    // Empty / unavailable states
    readonly body: Locator;
    readonly noContentBlock: Locator;
    readonly pageUnavailableText: Locator;
    readonly pageUnavailableParagraph: Locator;

    constructor(page: Page) {
        this.page = page;

        this.videos = page.locator('[data-id="video"]');
        this.firstVideo = page.locator('[data-id="video"]').first();
        this.firstShort = page.locator('[data-id="clip"]').first();

        this.avatar = page.locator('[data-id="avatar"]');
        this.videoCount = page.locator('[data-id="count"]');
        this.subscribersCount = page.locator('[data-id="subscribers"]');
        this.channelName = page.locator('[data-id="name"]');
        this.channelHandle = page.locator('[data-id="handle"]');
        this.forYouHeading = page.getByRole('heading', { name: 'For you' });
        this.editChannelBtn = page.getByRole('button', { name: 'Edit channel' });

        // 2026 redesign locators. `.first()` guards against the per-tile hover
        // overlays that also expose Follow/Edit controls — the hero button is first
        // in DOM order.
        this.videoCards = page.locator('[data-id="aitv-video-card"]');
        // Short tiles auto-play on the channel page → mask in visual snapshots.
        this.shortCards = page.locator('[data-id="aitv-short-card"]');
        this.channelNameHeading = page.getByRole('heading', { level: 1 });
        this.followBtn = page.getByRole('button', { name: 'Follow', exact: true }).first();
        this.editBtn = page.getByRole('button', { name: 'Edit', exact: true }).first();
        this.shareBtn = page.getByRole('button', { name: 'Share', exact: true }).first();

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

        // Empty / unavailable states
        this.body = page.locator('body');
        this.noContentBlock = page.locator('div').filter({ hasText: /^This channel doesn`t have any content$/ });
        this.pageUnavailableText = page.getByText('This page isn\'t available.');
        this.pageUnavailableParagraph = page.getByRole('paragraph');
    }


    // PUBLIC VIDEO/ SHORTS

    async checkVideoIsExist(name: string){
        await expect(this.firstVideo, 'First video does not contain expected text').toContainText(name);
    }

    async clickFirstVideo(){
        await expect(this.firstVideo, 'First video is not visible').toBeVisible();
        await this.firstVideo.click();
    }

    async checkShortsIsExist(name: string){
        await expect(this.firstShort, 'First short does not contain expected text').toContainText(name);
    }

    async clickFirstShort(){
        await expect(this.firstShort, 'First short is not visible').toBeVisible();
        await this.firstShort.click();
    }

    // PUBLIC VIDEO — 2026 redesign. Grid cards are cover-only anchors
    // (`<a data-id="aitv-video-card" href="/video/<category>/<slug>">`) — the title is
    // not rendered at rest, so a video is identified by its watch-URL path, not text.

    /** Card in the channel grid linking to a specific watch URL (parameterized locator). */
    private videoCardByHref(watchUrl: string): Locator {
        return this.page.locator(`[data-id="aitv-video-card"][href="${new URL(watchUrl).pathname}"]`);
    }

    /** Assert a video IS listed on the channel grid. */
    async assertVideoOnChannel(watchUrl: string){
        await expect(this.videoCardByHref(watchUrl), 'Expected video is not listed on the channel')
            .toBeVisible({ timeout: 15_000 });
    }

    /** Assert a video is NOT listed, while the (non-empty) grid has rendered — used for
     *  private/unlisted videos on a channel that also has public content. */
    async assertVideoAbsentOnChannel(watchUrl: string){
        await expect(this.videoCards.first(), 'Channel grid did not render')
            .toBeVisible({ timeout: 15_000 });
        await expect(this.videoCardByHref(watchUrl), 'Hidden video should not appear on the channel')
            .toHaveCount(0);
    }



    //PRIVATE VIDEO

    async checkChannelWithoutVideo(){
        await expect(this.noContentBlock, 'No-content block is not visible').toBeVisible();
        await expect(this.firstVideo, 'First video count mismatch').toHaveCount(0);
    }

    async checkPrivateVideoOnChannelPage(){
        await expect(this.body, 'No-content message is not shown').toContainText('This channel doesn`t have any content');
    }

    async checkPrivateVideoViaDirectLink(){
        await expect(this.pageUnavailableText, 'Page-unavailable message is not visible').toBeVisible();
        await expect(this.pageUnavailableParagraph, 'Page-unavailable paragraph text mismatch').toContainText('This page isn\'t available. Sorry about that. Try searching for something else.');
    }

    // UNLISTED VIDEO

    async checkUnlistedVideoNotAvailable(){
        await expect(this.body, 'No-content message is not shown').toContainText('This channel doesn`t have any content');
    }


    // PAID VIDEO ON MEMBERSHIP PAGE

    async assertSubscriptionCardVisible(name: string, description: string): Promise<void> {
        await expect(this.subscriptionCard, 'Subscription card is not visible').toBeVisible();
        await expect(this.subscriptionCard, 'Subscription card does not contain membership name').toContainText(name);
        await expect(this.subscriptionCard, 'Subscription card does not contain membership description').toContainText(description);
    }

    async clickRegisterLoginBtn(){
        await this.checkRegisterLoginBtn();
        await expect(this.registerLoginBtn, 'Login button is not enabled').toBeEnabled();
        await this.registerLoginBtn.click();
    }

    async clickButtonSubscribeNow(){
        await expect(this.subscribeBtn, 'Subscribe button is not visible').toBeVisible();
        await expect(this.subscribeBtn, 'Subscribe button is not enabled').toBeEnabled();
        await this.subscribeBtn.click();
    }

    async checkRegisterLoginBtn(){
        await expect(this.registerLoginBtn, 'Register login button is not visible').toBeVisible();
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
        await expect(this.body, `Expected subscription status "${expectedStatus}" not found`).toContainText(expectedStatus);
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
        let attempt = 0;
        const start = Date.now();
        while (Date.now() < deadline) {
            const body = await this.body.innerText();
            if (body.includes('Active') && !body.includes('Inactive')) break;
            attempt++;
            console.log(`[subscription poll] attempt ${attempt}, elapsed: ${Math.round((Date.now() - start) / 1000)}s`);
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await this.page.waitForTimeout(5_000);
        }
    }

    async checkPaidVideoAttributes(){
        await this.checkExclusiveContentBadge();
        await this.checkLockedBadge();
    }

    async checkExclusiveContentBadge(){
        await expect(this.firstVideo, 'First video tile is not visible').toBeVisible();
        await this.firstVideo.hover();
        await expect(this.exclusiveBadge, 'Exclusive badge is not visible').toBeVisible();; 
    }

    async checkLockedBadge(){
        await expect(this.lockedBadge, 'Locked badge is not visible').toBeVisible();
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
            this.body,
            'Login modal message is not visible'
        ).toContainText('Please log in to your Web3.TV account using one of the login methods below');
    }

    async assertHeroPayInvoicePage(): Promise<void> {
        await expect(this.page, 'Not redirected to Hero Pay invoice page').toHaveURL(/test\.pay\.hero\.io\/invoice\/currency-list(\?.*)?$/);
    }

}