import { Page, Locator, Response } from '@playwright/test';
import { expect } from '@playwright/test';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export type SocialLinkField = 'facebook' | 'twitter' | 'instagram' | 'tiktok';

/**
 * Profile editing on the redesigned /account page: the profile header (avatar, name,
 * bio) plus the "Edit" modal behind it (avatar upload + crop, bio, social links).
 * The legacy standalone /profile page is no longer reachable from the AI.TV UI.
 */
export class EditProfileModalPage {

    readonly page: Page;

    // Profile header on /account
    readonly profileHeader: Locator;
    readonly headerAvatar: Locator;
    readonly editProfileBtn: Locator;

    // Modal shell
    readonly modal: Locator;
    readonly closeBtn: Locator;
    readonly saveBtn: Locator;

    // Avatar
    readonly modalAvatar: Locator;
    readonly uploadImageBtn: Locator;
    readonly avatarInput: Locator;
    readonly avatarError: Locator;
    readonly cropConfirmBtn: Locator;
    readonly cropCancelBtn: Locator;

    // Biography
    readonly bioInput: Locator;
    readonly bioCounter: Locator;

    // Social links
    readonly facebookInput: Locator;
    readonly twitterInput: Locator;
    readonly instagramInput: Locator;
    readonly tiktokInput: Locator;

    constructor(page: Page) {
        this.page = page;

        this.profileHeader = page.getByTestId('aitv-account-profile-header');
        // the Avatar component renders an <img> only once an avatar is uploaded
        this.headerAvatar = this.profileHeader.locator('img');
        this.editProfileBtn = page.getByTestId('aitv-account-edit-profile-btn');

        this.modal = page.getByTestId('aitv-edit-profile-modal');
        this.closeBtn = page.getByTestId('aitv-edit-profile-close-btn');
        this.saveBtn = page.getByTestId('aitv-edit-profile-save-btn');

        this.modalAvatar = this.modal.locator('img');
        this.uploadImageBtn = page.getByTestId('aitv-edit-profile-upload-btn');
        // hidden input — driven via setInputFiles, never clicked
        this.avatarInput = page.getByTestId('aitv-edit-profile-avatar-input');
        this.avatarError = page.getByTestId('aitv-edit-profile-avatar-error');
        this.cropConfirmBtn = page.getByTestId('upload-image-crop-confirm');
        this.cropCancelBtn = page.getByTestId('upload-image-crop-cancel');

        this.bioInput = page.getByTestId('aitv-edit-profile-bio-input');
        this.bioCounter = this.modal.getByText(/^\d+\/\d+$/);

        this.facebookInput = page.getByTestId('aitv-edit-profile-social-facebook');
        this.twitterInput = page.getByTestId('aitv-edit-profile-social-twitter');
        this.instagramInput = page.getByTestId('aitv-edit-profile-social-instagram');
        this.tiktokInput = page.getByTestId('aitv-edit-profile-social-tiktok');
    }

    private getSocialInput(field: SocialLinkField): Locator {
        const map: Record<SocialLinkField, Locator> = {
            facebook: this.facebookInput,
            twitter: this.twitterInput,
            instagram: this.instagramInput,
            tiktok: this.tiktokInput,
        };
        return map[field];
    }

    /** Opens the Edit profile modal from the /account profile header. */
    async open(): Promise<void> {
        await expect(this.editProfileBtn, 'Edit profile button is not visible').toBeVisible();
        await expect(this.editProfileBtn, 'Edit profile button is not enabled').toBeEnabled();
        await this.editProfileBtn.click();
        await expect(this.modal, 'Edit profile modal did not open').toBeVisible();
    }

    async close(): Promise<void> {
        await expect(this.closeBtn, 'Modal close button is not visible').toBeVisible();
        await expect(this.closeBtn, 'Modal close button is not enabled').toBeEnabled();
        await this.closeBtn.click();
        await expect(this.modal, 'Edit profile modal did not close').toBeHidden();
    }

    async fillBio(text: string): Promise<void> {
        await expect(this.bioInput, 'Bio input is not visible').toBeVisible();
        await expect(this.bioInput, 'Bio input is not editable').toBeEditable();
        await this.bioInput.fill(text);
    }

    async clearBio(): Promise<void> {
        await this.fillBio('');
    }

    async fillSocialLink(field: SocialLinkField, value: string): Promise<void> {
        const input = this.getSocialInput(field);
        await expect(input, `${field} input is not visible`).toBeVisible();
        await expect(input, `${field} input is not editable`).toBeEditable();
        await input.fill(value);
    }

    async fillAllSocialLinks(links: Partial<Record<SocialLinkField, string>>): Promise<void> {
        for (const [field, value] of Object.entries(links)) {
            await this.fillSocialLink(field as SocialLinkField, value!);
        }
    }

    async clearAllSocialLinks(): Promise<void> {
        for (const field of ['facebook', 'twitter', 'instagram', 'tiktok'] as SocialLinkField[]) {
            await this.fillSocialLink(field, '');
        }
    }

    /** Picks a file and confirms the crop dialog — leaves the modal open, unsaved. */
    async uploadAvatar(filePath: string): Promise<void> {
        const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(PROJECT_ROOT, filePath);
        await expect(this.avatarInput, 'Avatar file input is not attached').toBeAttached();
        await this.avatarInput.setInputFiles(resolved);
        await expect(this.cropConfirmBtn, 'Crop confirm button is not visible').toBeVisible();
        await expect(this.cropConfirmBtn, 'Crop confirm button is not enabled').toBeEnabled();
        await this.cropConfirmBtn.click();
        await expect(this.cropConfirmBtn, 'Crop dialog did not close').toBeHidden();
    }

    /** Saves the form and returns the POST /api/profile/update response. */
    async saveAndGetResponse(): Promise<Response> {
        await expect(this.saveBtn, 'Save changes button is not visible').toBeVisible();
        await expect(this.saveBtn, 'Save changes button is not enabled').toBeEnabled();
        const responsePromise = this.page.waitForResponse(
            res => res.url().includes('/api/profile/update')
                && res.request().method() === 'POST'
                && res.status() === 200,
            { timeout: 30_000 }
        );
        await this.saveBtn.click();
        const response = await responsePromise;
        await expect(this.modal, 'Edit profile modal did not close after save').toBeHidden();
        return response;
    }

    async save(): Promise<void> {
        await this.saveAndGetResponse();
    }

    async assertBioValue(expected: string): Promise<void> {
        await expect(this.bioInput, `Bio should contain "${expected}"`).toHaveValue(expected);
    }

    async assertSocialLinkValue(field: SocialLinkField, expected: string): Promise<void> {
        const input = this.getSocialInput(field);
        await expect(input, `${field} should contain "${expected}"`).toHaveValue(expected);
    }

    async assertBioCounter(expected: string): Promise<void> {
        await expect(this.bioCounter, `Bio counter should show "${expected}"`).toHaveText(expected);
    }

    async assertSaveDisabled(): Promise<void> {
        await expect(this.saveBtn, 'Save changes button should be disabled').toBeDisabled();
    }

    /** src of the avatar shown in the /account profile header, null while the placeholder is rendered. */
    async getHeaderAvatarSrc(): Promise<string | null> {
        if (await this.headerAvatar.count() === 0) return null;
        return this.headerAvatar.getAttribute('src');
    }

    async assertHeaderBio(expected: string): Promise<void> {
        await expect(this.profileHeader, `Profile header should show bio "${expected}"`).toContainText(expected);
    }
}
