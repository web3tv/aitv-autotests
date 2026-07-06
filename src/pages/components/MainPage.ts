import { Page, Locator } from '@playwright/test';


export class MainPage {
    readonly page: Page;

    readonly hero: Locator;
    readonly heroText: Locator;
    readonly heroImage: Locator;
    readonly heroVideo: Locator;
    readonly topCardImage: Locator;
    readonly videoCardImage: Locator;
    readonly categorySection: Locator;
    readonly topTitlesTodayHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Auto-rotating hero swiper — masked as a whole in visual tests (fixed CSS height, no reflow below).
        this.hero = page.locator('[data-id="aitv-hero"]');
        this.heroText = page.locator('[data-id="aitv-hero"] .MuiTypography-root');
        this.heroImage = page.locator('[data-id="aitv-hero"] img');
        this.heroVideo = page.locator('[data-id="aitv-hero"] video');
        this.topCardImage = page.locator('[data-id="aitv-top-card"] img');
        this.videoCardImage = page.locator('[data-id="aitv-video-card"] img');
        this.categorySection = page.locator('[data-id="aitv-category-section"]');
        this.topTitlesTodayHeading = page.getByText('Top titles today');
    }


    async visitMainPage(){
       await this.page.goto('');
    }


}