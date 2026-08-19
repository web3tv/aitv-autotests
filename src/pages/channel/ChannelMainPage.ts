import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ChannelMainPage {

    readonly page: Page;    


    readonly firstVideo: Locator;



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

    readonly registerLoginBtn: Locator;

    // Empty / unavailable states
    readonly body: Locator;
    readonly pageUnavailableText: Locator;

    constructor(page: Page) {
        this.page = page;

        this.firstVideo = page.locator('[data-id="video"]').first();


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
        this.registerLoginBtn = page.getByRole('button', { name: 'Login' });

        // Empty / unavailable states
        this.body = page.locator('body');
        this.pageUnavailableText = page.getByText('This page isn\'t available.');
    }


    // PUBLIC VIDEO/ SHORTS

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

    async checkPrivateVideoViaDirectLink(){
        await expect(this.pageUnavailableText, 'Page-unavailable message is not visible').toBeVisible();
    }

    // UNLISTED VIDEO


    async checkRegisterLoginBtn(){
        await expect(this.registerLoginBtn, 'Register login button is not visible').toBeVisible();
    }

    async assertLoginModalVisible(): Promise<void> {
        await expect(
            this.body,
            'Login modal message is not visible'
        ).toContainText('Please log in');
    }

}