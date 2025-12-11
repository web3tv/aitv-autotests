import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class UserDropdownPage {
    
    readonly page: Page;

    readonly createChannelBtn: Locator;
    readonly logoutBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.createChannelBtn =  page.getByRole('button', { name: 'Add Channel' });
        this.logoutBtn = page.getByRole('menuitem', { name: 'Sign out' })
    }

    async clickAddChannelBtn(){
        await expect(this.createChannelBtn).toBeEnabled();
        await this.createChannelBtn.click();
        await expect(this.page.getByRole('dialog', { name: 'Create channel' })).toBeVisible();
    }
    
    async clickLogoutBtn(){
        await expect(this.logoutBtn).toBeEnabled();
        await this.logoutBtn.click();
    }



}