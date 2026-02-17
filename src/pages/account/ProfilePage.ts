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
        await this.confirmButton.click();
        await expect(this.confirmButton).toBeEnabled();
        await this.submitButton.click();
        await this.page.waitForResponse(res =>
            res.url().includes('/api/profile/update') &&
            res.status() === 200
        );

        await this.page.reload({ waitUntil: 'networkidle' });
        const newAvatarSrc = await this.profileAvatar.getAttribute('src');
        await expect(this.profileAvatar).not.toHaveAttribute('src', oldAvatarSrc!);
        const headerPage = new HeaderPage(this.page);
        await headerPage.clickUserIcon();
        await expect(this.userAvatarInHeader).toHaveAttribute('src', newAvatarSrc!);
    }
}