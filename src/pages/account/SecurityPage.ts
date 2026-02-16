import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { HeaderPage } from '../components/HeaderPage';

export class SecurityPage {

    readonly page: Page;

   

    // Messages
    readonly profileAvatar: Locator;


    constructor(page: Page) {
        this.page = page;


        // user avatar
        this.profileAvatar = page.getByTestId('edit-profile-form').locator('img')
       
    }


    async setup2FA(email: string){
        await this.page.getByRole('button', { name: 'Set Up' }).click();
        await expect(this.page.locator('#check-password-2fa')).toContainText(`After enabling two-factor authorization you have to confirm every authorization using ${email}`);
        await this.page.getByRole('textbox', { name: 'Enter password' }).click();
        await this.page.getByRole('textbox', { name: 'Enter password' }).fill('Admin1@@');
        await this.page.getByRole('checkbox').check();
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/set') &&
            res.status() === 200
        );
        await expect(this.page.getByText('Setting updated!')).toBeVisible();
    }

    async disable2FA(email:string){
        await this.page.getByRole('button', { name: 'Set Up' }).click();
        await expect(this.page.locator('#check-password-2fa')).toContainText(`After enabling two-factor authorization you have to confirm every authorization using ${email}`);
        await this.page.getByRole('textbox', { name: 'Enter password' }).click();
        await this.page.getByRole('textbox', { name: 'Enter password' }).fill('Admin1@@');
        await this.page.getByRole('checkbox').uncheck();
        await this.page.getByRole('button', { name: 'Submit' }).click();
        await this.page.waitForResponse(res =>
            res.url().includes('/api/account/email-2fa/set') &&
            res.status() === 200
        );
        await expect(this.page.getByText('Setting updated!')).toBeVisible();
    }


}