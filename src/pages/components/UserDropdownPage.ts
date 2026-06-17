import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class UserDropdownPage {

    readonly page: Page;

    readonly dropdown: Locator;
    readonly switchChannelBtn: Locator;
    readonly createChannelBtn: Locator;
    readonly studioLink: Locator;
    readonly purchasesLink: Locator;
    readonly accountLink: Locator;
    readonly supportLink: Locator;
    readonly logoutBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dropdown = page.locator('[aria-labelledby="aitv-profile-button"]');
        this.switchChannelBtn = page.locator('[data-id="aitv-profile-menu-switch-channel"]');
        this.createChannelBtn = page.locator('[data-id="aitv-profile-menu-create-channel"]');
        this.studioLink = page.locator('[data-id="aitv-profile-menu-studio"]');
        this.purchasesLink = page.locator('[data-id="aitv-profile-menu-purchases"]');
        this.accountLink = page.locator('[data-id="aitv-profile-menu-account"]');
        this.supportLink = page.locator('[data-id="aitv-profile-menu-support"]');
        this.logoutBtn = page.locator('[data-id="aitv-profile-menu-logout"]');
    }

    async clickAddChannelBtn() {
        await expect(this.createChannelBtn, 'Add Channel button is not visible').toBeVisible();
        await expect(this.createChannelBtn, 'Add Channel button is not enabled').toBeEnabled();
        await this.createChannelBtn.click();
        await this.page.waitForURL('**/create-channel');
        await expect(this.page.getByText('Create Your Ai.tv Channel')).toBeVisible();
    }

    async clickLogoutBtn() {
        await expect(this.logoutBtn, 'Log out button is not visible').toBeVisible();
        await expect(this.logoutBtn, 'Log out button is not enabled').toBeEnabled();
        await this.logoutBtn.click();
    }
}
