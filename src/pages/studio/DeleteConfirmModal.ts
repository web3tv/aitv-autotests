import { Page, Locator, expect } from '@playwright/test';
import { collectResponses } from '../../utils/responseCollector';

/**
 * Delete confirmation modal of the redesigned studio Content page (W3-2815).
 * Videos and series hit different endpoints, and a bulk delete fires one request per item.
 */
export class DeleteConfirmModal {
    readonly page: Page;

    readonly modal: Locator;
    readonly closeButton: Locator;
    readonly cancelButton: Locator;
    readonly submitButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.modal = page.getByTestId('aitv-delete-confirm-modal');
        this.closeButton = page.getByTestId('aitv-delete-confirm-close');
        this.cancelButton = page.getByTestId('aitv-delete-confirm-cancel');
        this.submitButton = page.getByTestId('aitv-delete-confirm-submit');
    }

    async expectOpen() {
        await expect(this.modal, 'Delete confirmation modal is not visible').toBeVisible({ timeout: 15_000 });
    }

    async expectClosed() {
        await expect(this.modal, 'Delete confirmation modal should be closed').not.toBeVisible({ timeout: 30_000 });
    }

    async confirmAndWaitDeleted(options: { kind?: 'video' | 'series'; count?: number } = {}) {
        const { kind = 'video', count = 1 } = options;
        const matches = (url: string) => kind === 'video'
            ? /\/api\/videos\/delete\//.test(url)
            : url.includes('/api/playlists/delete');

        const deletes = collectResponses(
            this.page,
            r => matches(r.url()) && r.request().method() === 'DELETE'
        );

        await expect(this.submitButton, 'Delete confirm button is not visible').toBeVisible();
        await expect(this.submitButton, 'Delete confirm button is not enabled').toBeEnabled();
        await this.submitButton.click();

        await deletes.waitFor(count);
        await this.expectClosed();
    }

    async cancel() {
        await expect(this.cancelButton, 'Cancel button is not visible').toBeVisible();
        await expect(this.cancelButton, 'Cancel button is not enabled').toBeEnabled();
        await this.cancelButton.click();
        await this.expectClosed();
    }
}
