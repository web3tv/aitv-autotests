import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { HeaderPage } from '../components/HeaderPage';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export type SocialLinkField = 'facebook' | 'twitter' | 'instagram' | 'tiktok';

export class ProfilePage {

    readonly page: Page;

    // Avatar
    readonly profileAvatar: Locator;
    readonly uploadImageButton: Locator;
    readonly confirmButton: Locator;
    readonly submitButton: Locator;
    readonly userAvatarInHeader: Locator;

    // Biography
    readonly biographyInput: Locator;
    readonly biographyCharCounter: Locator;

    // Social Links
    readonly facebookInput: Locator;
    readonly twitterInput: Locator;
    readonly instagramInput: Locator;
    readonly tiktokInput: Locator;
    readonly facebookCharCounter: Locator;
    readonly twitterCharCounter: Locator;
    readonly instagramCharCounter: Locator;
    readonly tiktokCharCounter: Locator;

    constructor(page: Page) {
        this.page = page;

        // user avatar (img only appears after avatar is uploaded; new users show SVG fallback)
        this.profileAvatar = page.locator('[data-id="upload-avatar"] img');
        // hidden file input inside the avatar upload label
        this.uploadImageButton = page.locator('[data-id="upload-avatar"] input[type="file"]');
        this.confirmButton = page.getByRole('button', { name: 'Confirm' });
        this.submitButton = page.getByRole('button', { name: 'Submit' });
        this.userAvatarInHeader = page.locator('#profile-button img');

        // Biography
        this.biographyInput = page.locator('textarea[name="biography"]');
        this.biographyCharCounter = page.locator('textarea[name="biography"]').locator('..').locator('..').locator('..').locator('~ p');

        // Social Links
        this.facebookInput = page.locator('input[name="facebookUrl"]');
        this.twitterInput = page.locator('input[name="twitterUsername"]');
        this.instagramInput = page.locator('input[name="instagramUsername"]');
        this.tiktokInput = page.locator('input[name="tiktokUsername"]');
        this.facebookCharCounter = page.locator('input[name="facebookUrl"]').locator('..').locator('..').locator('..').locator('~ p');
        this.twitterCharCounter = page.locator('input[name="twitterUsername"]').locator('..').locator('..').locator('..').locator('~ p');
        this.instagramCharCounter = page.locator('input[name="instagramUsername"]').locator('..').locator('..').locator('..').locator('~ p');
        this.tiktokCharCounter = page.locator('input[name="tiktokUsername"]').locator('..').locator('..').locator('..').locator('~ p');
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

    async fillBiography(text: string): Promise<void> {
        await expect(this.biographyInput, 'Biography input is not visible').toBeVisible();
        await expect(this.biographyInput, 'Biography input is not editable').toBeEditable();
        await this.biographyInput.clear();
        await this.biographyInput.fill(text);
    }

    async clearBiography(): Promise<void> {
        await expect(this.biographyInput, 'Biography input is not visible').toBeVisible();
        await this.biographyInput.clear();
    }

    async fillSocialLink(field: SocialLinkField, value: string): Promise<void> {
        const input = this.getSocialInput(field);
        await expect(input, `${field} input is not visible`).toBeVisible();
        await expect(input, `${field} input is not editable`).toBeEditable();
        await input.clear();
        await input.fill(value);
    }

    async clearSocialLink(field: SocialLinkField): Promise<void> {
        const input = this.getSocialInput(field);
        await expect(input, `${field} input is not visible`).toBeVisible();
        await input.clear();
    }

    async fillAllSocialLinks(links: Partial<Record<SocialLinkField, string>>): Promise<void> {
        for (const [field, value] of Object.entries(links)) {
            await this.fillSocialLink(field as SocialLinkField, value!);
        }
    }

    async clearAllSocialLinks(): Promise<void> {
        for (const field of ['facebook', 'twitter', 'instagram', 'tiktok'] as SocialLinkField[]) {
            await this.clearSocialLink(field);
        }
    }

    async submitProfileAndWaitForResponse(): Promise<void> {
        await expect(this.submitButton, 'Submit button is not visible').toBeVisible();
        await expect(this.submitButton, 'Submit button is not enabled').toBeEnabled();
        const responsePromise = this.page.waitForResponse(
            res => res.url().includes('/api/profile/update') && res.status() === 200,
            { timeout: 30000 }
        );
        await this.submitButton.click();
        await responsePromise;
    }

    async submitProfileAndGetResponse(): Promise<import('@playwright/test').Response> {
        await expect(this.submitButton, 'Submit button is not visible').toBeVisible();
        await expect(this.submitButton, 'Submit button is not enabled').toBeEnabled();
        const responsePromise = this.page.waitForResponse(
            res => res.url().includes('/api/profile/update') && res.status() === 200,
            { timeout: 30000 }
        );
        await this.submitButton.click();
        return await responsePromise;
    }

    async assertBiographyValue(expected: string): Promise<void> {
        await expect(this.biographyInput, `Biography should contain "${expected}"`).toHaveValue(expected);
    }

    async assertSocialLinkValue(field: SocialLinkField, expected: string): Promise<void> {
        const input = this.getSocialInput(field);
        await expect(input, `${field} should contain "${expected}"`).toHaveValue(expected);
    }

    async assertBiographyCharCounter(expected: string): Promise<void> {
        await expect(this.biographyCharCounter, `Biography counter should show "${expected}"`).toHaveText(expected);
    }

    async assertSocialLinkCharCounter(field: SocialLinkField, expected: string): Promise<void> {
        const counterMap: Record<SocialLinkField, Locator> = {
            facebook: this.facebookCharCounter,
            twitter: this.twitterCharCounter,
            instagram: this.instagramCharCounter,
            tiktok: this.tiktokCharCounter,
        };
        await expect(counterMap[field], `${field} counter should show "${expected}"`).toHaveText(expected);
    }

    async uploadAvatarAndSubmit(filePath: string): Promise<void> {
        const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(PROJECT_ROOT, filePath);
        await this.uploadImageButton.setInputFiles(resolved);
        await expect(this.confirmButton, 'Confirm button is not visible').toBeVisible();
        await expect(this.confirmButton, 'Confirm button is not enabled').toBeEnabled();
        await this.confirmButton.click();
        await expect(this.submitButton, 'Submit button is not visible').toBeVisible();
        await expect(this.submitButton, 'Submit button is not enabled').toBeEnabled();
        const responsePromise = this.page.waitForResponse(
            res => res.url().includes('/api/profile/update') && res.status() === 200,
            { timeout: 30000 }
        );
        await this.submitButton.click();
        await responsePromise;
    }

    async getAvatarSrc(): Promise<string | null> {
        const imgCount = await this.profileAvatar.count();
        if (imgCount === 0) return null;
        return this.profileAvatar.getAttribute('src');
    }
}
