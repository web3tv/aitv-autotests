import { Page, Locator, expect } from '@playwright/test';

export type SeriesVisibilityOption = 'public' | 'unlisted' | 'private';

/**
 * "Change visibility" modal for series (W3-2815). On success the form body is replaced
 * by the shared change-visibility success screen (`aitv-change-visibility-success`),
 * which owns the Done button that finally closes the dialog.
 */
export class SeriesVisibilityModal {
    readonly page: Page;

    readonly modal: Locator;
    readonly closeButton: Locator;
    readonly cancelButton: Locator;
    readonly submitButton: Locator;
    readonly error: Locator;
    readonly success: Locator;
    readonly successStatus: Locator;
    readonly doneButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.modal = page.getByTestId('aitv-series-visibility-modal');
        this.closeButton = page.getByTestId('aitv-series-visibility-close');
        this.cancelButton = page.getByTestId('aitv-series-visibility-cancel');
        this.submitButton = page.getByTestId('aitv-series-visibility-submit');
        this.error = page.getByTestId('aitv-series-visibility-error');
        this.success = page.getByTestId('aitv-change-visibility-success');
        this.successStatus = page.getByTestId('aitv-change-visibility-success-status');
        this.doneButton = page.getByTestId('aitv-change-visibility-done');
    }

    async expectOpen() {
        await expect(this.modal, 'Series visibility modal is not visible').toBeVisible({ timeout: 15_000 });
    }

    async expectClosed() {
        await expect(this.modal, 'Series visibility modal should be closed').not.toBeVisible({ timeout: 30_000 });
    }

    async assertSuccess() {
        await expect(this.success, 'Series visibility success screen is not visible').toBeVisible({ timeout: 30_000 });
    }

    /** Closes the dialog from the success screen. */
    async done() {
        await expect(this.doneButton, 'Done button is not visible').toBeVisible();
        await expect(this.doneButton, 'Done button is not enabled').toBeEnabled();
        await this.doneButton.click();
        await this.expectClosed();
    }

    /** Parameterized: the option id depends on the visibility being chosen. */
    option(visibility: SeriesVisibilityOption): Locator {
        return this.page.getByTestId(`aitv-series-visibility-option-${visibility}`);
    }

    async selectOption(visibility: SeriesVisibilityOption) {
        const option = this.option(visibility);
        await expect(option, `Series visibility option "${visibility}" is not visible`).toBeVisible();
        await option.click();
    }

    async expectSubmitDisabled() {
        await expect(this.submitButton, 'Submit button should be disabled').toBeDisabled();
    }

    /** Submits and returns the privacyStatus actually sent to the playlists endpoint. */
    async submitAndWaitUpdated(): Promise<string> {
        const updatePromise = this.page.waitForResponse(
            r => r.url().includes('/api/playlists/update') && r.request().method() === 'PUT',
            { timeout: 30_000 }
        );

        await expect(this.submitButton, 'Series visibility submit button is not visible').toBeVisible();
        await expect(this.submitButton, 'Series visibility submit button is not enabled').toBeEnabled();
        await this.submitButton.click();

        const response = await updatePromise;
        return response.request().postDataJSON()?.privacyStatus;
    }

    async cancel() {
        await expect(this.cancelButton, 'Cancel button is not visible').toBeVisible();
        await expect(this.cancelButton, 'Cancel button is not enabled').toBeEnabled();
        await this.cancelButton.click();
        await this.expectClosed();
    }
}
