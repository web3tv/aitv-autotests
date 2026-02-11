import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HeroPayPage {

    readonly page: Page;    
    
    constructor(page: Page) {
        this.page = page;
    }

    async mockPayment(){
        await this.page.getByRole('link', { name: 'Tether USDT - TRON >' }).click();;
        const link = this.page.getByRole('link', { name: 'Mock Payment' });
        await link.evaluate(el => el.removeAttribute('target'));
        await link.click();
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.waitForTimeout(1000);
        await this.page.getByRole('link', { name: '+1 Confirmation' }).click();
        await this.page.waitForTimeout(1000);
        await this.page.evaluate(() => window.history.go(-3));
        await this.page.waitForTimeout(1000);
        await Promise.all([
            this.page.waitForLoadState('networkidle'),
            this.page.getByRole('link', { name: 'Return to Merchant' }).click()
            
        ]);
        await this.page.waitForTimeout(1000);
    }



}