import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class UserDropdownPage {

    readonly page: Page;

    readonly dropdown: Locator;
    readonly closeBtn: Locator;
    readonly channelLink: Locator;
    readonly switchChannelBtn: Locator;
    readonly createChannelBtn: Locator;
    readonly logoutBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dropdown = page.locator('[aria-labelledby="aitv-profile-button"]');
        this.closeBtn = page.locator('[data-id="aitv-profile-menu-close"]');
        this.channelLink = page.locator('[data-id="aitv-profile-menu-channel-link"]');
        this.switchChannelBtn = page.locator('[data-id="aitv-profile-menu-switch-channel"]');
        this.createChannelBtn = page.locator('[data-id="aitv-profile-menu-create-channel"]');
        this.logoutBtn = page.getByRole('menuitem', { name: 'Log out' });
    }

    async clickAddChannelBtn(){
        await expect(this.createChannelBtn, 'Add Channel button is not visible').toBeVisible();
        await expect(this.createChannelBtn, 'Add Channel button is not enabled').toBeEnabled();
        await this.createChannelBtn.click();
        await this.page.waitForURL('**/create-channel');
        await expect(this.page.getByText('Create Your Ai.tv Channel')).toBeVisible();
    }

    async clickLogoutBtn(){
        await expect(this.logoutBtn, 'Sign out button is not visible').toBeVisible();
        await expect(this.logoutBtn, 'Sign out button is not enabled').toBeEnabled();
        await this.logoutBtn.click();
    }



}
