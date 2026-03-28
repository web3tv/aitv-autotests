import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class UserDropdownPage {
    
    readonly page: Page;

    readonly dropdown: Locator;
    readonly createChannelBtn: Locator;
    readonly logoutBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dropdown = page.locator('[aria-labelledby="profile-button"]');
        this.createChannelBtn =  page.getByRole('link', { name: 'Add Channel' });
        this.logoutBtn = page.getByRole('menuitem', { name: 'Sign out' })
    }

    async clickAddChannelBtn(){
        await expect(this.createChannelBtn, 'Add Channel button is not visible').toBeVisible();
        await expect(this.createChannelBtn, 'Add Channel button is not enabled').toBeEnabled();
        await this.createChannelBtn.click();
        await this.page.waitForURL('**/create-channel');
        await expect(this.page.getByText('Create Your Web3.TV ChannelSet')).toBeVisible();
    }

    async clickLogoutBtn(){
        await expect(this.logoutBtn, 'Sign out button is not visible').toBeVisible();
        await expect(this.logoutBtn, 'Sign out button is not enabled').toBeEnabled();
        await this.logoutBtn.click();
    }



}