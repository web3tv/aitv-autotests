import { Page, Locator, expect } from '@playwright/test';

export class EditChannelPage {
    readonly page: Page;

    readonly defaultVideoDescriptionEditor: Locator;
    readonly saveBtn: Locator;
    readonly successToast: Locator;

    constructor(page: Page) {
        this.page = page;

        this.defaultVideoDescriptionEditor = page.locator('[data-id="default-video-description"] .ql-editor');
        this.saveBtn = page.getByRole('button', { name: 'Save' });
        this.successToast = page.getByText('Channel successfully updated');
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

    async clickSave() {
        await expect(this.saveBtn, 'Save button is not visible').toBeVisible();
        await expect(this.saveBtn, 'Save button is not enabled').toBeEnabled();
        await this.saveBtn.click();
    }

    async assertSuccessToast() {
        await expect(this.successToast, 'Success toast "Channel successfully updated" is not visible').toBeVisible();
    }

    async assertDefaultVideoDescriptionValue(expectedText: string) {
        await expect(this.defaultVideoDescriptionEditor, 'Default video description editor is not visible').toBeVisible();
        await expect(this.defaultVideoDescriptionEditor, `Default video description does not match "${expectedText}"`).toContainText(expectedText);
    }
}
