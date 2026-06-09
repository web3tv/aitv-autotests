import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class TestPopupsPage {
    readonly page: Page;

    readonly openLoginPopupBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.openLoginPopupBtn = page.getByRole('button', { name: /Open Login Popup/i });
    }

    async goto(): Promise<void> {
        await this.page.goto('https://web3tv2.dev/test-popups', { waitUntil: 'domcontentloaded' });
    }

    async clickOpenLoginPopup(): Promise<void> {
        await expect(this.openLoginPopupBtn, 'Open Login Popup button is not visible').toBeVisible();
        await expect(this.openLoginPopupBtn, 'Open Login Popup button is not enabled').toBeEnabled();
        await this.openLoginPopupBtn.click();
    }
}
