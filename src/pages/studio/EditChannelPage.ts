import { Page, Locator, expect } from '@playwright/test';

export class EditChannelPage {
    readonly page: Page;

    readonly advancedTab: Locator;
    readonly defaultVideoDescriptionEditor: Locator;
    readonly saveBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        // The default video description moved to the "Advanced" tab of the redesigned
        // Edit channel page and is now a Quill rich-text editor (not a <textarea>).
        this.advancedTab = page.getByTestId('aitv-edit-channel-tab-advanced');
        this.defaultVideoDescriptionEditor = page
            .getByTestId('aitv-default-video-description-card')
            .locator('.ql-editor');
        // Save button reads "Publish changes" and only appears once the form is dirty.
        this.saveBtn = page.locator('[data-id="submit-btn"]');
    }

    async openAdvancedTab() {
        await expect(this.advancedTab, 'Advanced tab is not visible').toBeVisible();
        await expect(this.advancedTab, 'Advanced tab is not enabled').toBeEnabled();
        await this.advancedTab.click();
        await expect(this.defaultVideoDescriptionEditor, 'Default video description editor is not visible after opening Advanced tab').toBeVisible();
    }

    async fillDefaultVideoDescription(text: string) {
        await expect(this.defaultVideoDescriptionEditor, 'Default video description editor is not visible').toBeVisible();
        await expect(this.defaultVideoDescriptionEditor, 'Default video description editor is not editable').toBeEditable();
        await this.defaultVideoDescriptionEditor.fill(text);
    }

    async clearDefaultVideoDescription() {
        await expect(this.defaultVideoDescriptionEditor, 'Default video description editor is not visible').toBeVisible();
        await expect(this.defaultVideoDescriptionEditor, 'Default video description editor is not editable').toBeEditable();
        await this.defaultVideoDescriptionEditor.fill('');
    }

    // Publishes channel changes. The redesigned page no longer shows a success toast,
    // so the PUT /api/channels/edit response is the completion signal (registered
    // before the click to avoid a race).
    async saveChanges() {
        await expect(this.saveBtn, 'Publish changes button is not visible').toBeVisible();
        await expect(this.saveBtn, 'Publish changes button is not enabled').toBeEnabled();
        const responsePromise = this.page.waitForResponse(
            (r) => r.url().includes('/api/channels/edit') && r.request().method() === 'PUT' && r.status() === 200,
            { timeout: 15000 }
        );
        await this.saveBtn.click();
        await responsePromise;
    }

    async assertDefaultVideoDescriptionValue(expectedText: string) {
        await expect(this.defaultVideoDescriptionEditor, 'Default video description editor is not visible').toBeVisible();
        await expect(this.defaultVideoDescriptionEditor, `Default video description does not match "${expectedText}"`).toContainText(expectedText);
    }
}
