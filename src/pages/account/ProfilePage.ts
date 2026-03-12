import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { HeaderPage } from '../components/HeaderPage';

export class ProfilePage {

    readonly page: Page;

   

    // Messages
    readonly profileAvatar: Locator;
    readonly uploadImageButton: Locator;
    readonly confirmButton: Locator;
    readonly submitButton: Locator;
    readonly userAvatarInHeader: Locator;

    constructor(page: Page) {
        this.page = page;


        // user avatar
        this.profileAvatar = page.getByTestId('edit-profile-form').locator('img')
        // upload user avatar
        this.uploadImageButton = page.getByText('Upload Image');
        this.confirmButton = page.getByRole('button', { name: 'Confirm' });
        this.submitButton = page.getByRole('button', { name: 'Submit' });
        this.userAvatarInHeader = page.getByRole('img').first();
    }


    async uploadProfileAvatarAndConfirmNewAvatarDisplayed(){
        const oldAvatarSrc = await this.profileAvatar.getAttribute('src');
        await this.uploadImageButton.setInputFiles('test-data/fixtures/photo/cat.jpg');
        await expect(this.confirmButton, 'Confirm button is not visible').toBeVisible();
        await expect(this.confirmButton, 'Confirm button is not enabled').toBeEnabled();
        await this.confirmButton.click();
        await expect(this.submitButton, 'Submit button is not visible').toBeVisible();
        await expect(this.submitButton, 'Submit button is not enabled').toBeEnabled();
        const responsePromise = this.page.waitForResponse(res =>
            res.url().includes('/api/profile/update') &&
            res.status() === 200,
            { timeout: 30000 }
        );
        await this.submitButton.click();
        await responsePromise;

        await this.page.reload({ waitUntil: 'domcontentloaded' });
        const newAvatarSrc = await this.profileAvatar.getAttribute('src');
        await expect(this.profileAvatar, 'Avatar src should change after upload').not.toHaveAttribute('src', oldAvatarSrc!);
        const headerPage = new HeaderPage(this.page);
        await headerPage.clickUserIcon();
        await expect(this.userAvatarInHeader, 'Header avatar should match new avatar src').toHaveAttribute('src', newAvatarSrc!);
    }
}