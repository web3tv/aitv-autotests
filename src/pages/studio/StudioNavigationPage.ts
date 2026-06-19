import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioNavigationPage {
    readonly page: Page;
    readonly nav: Locator;

    constructor(page: Page) {
        this.page = page;
        this.nav = page.locator('[data-id="aitv-navigation"]');
    }

    async assertVisible(): Promise<void> {
        await expect(this.nav, 'Studio navigation is not visible').toBeVisible();
    }
}
