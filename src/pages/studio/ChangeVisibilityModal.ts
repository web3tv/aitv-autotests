import { Page, Locator, expect } from '@playwright/test';
import { collectResponses } from '../../utils/responseCollector';

export type ContentVisibility = 'public' | 'unlisted' | 'private';

/**
 * "Change visibility" modal for videos on the redesigned studio Content page (W3-2815).
 * Submit stays disabled while the chosen value equals the current one, and is blocked
 * altogether when a selected video has no category.
 */
export class ChangeVisibilityModal {
    readonly page: Page;

    readonly modal: Locator;
    readonly closeButton: Locator;
    readonly cancelButton: Locator;
    readonly submitButton: Locator;
    readonly error: Locator;
    readonly errorItems: Locator;
    readonly errorItemEdit: Locator;
    readonly success: Locator;
    readonly successStatus: Locator;
    readonly doneButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.modal = page.getByTestId('aitv-change-visibility-modal');
        this.closeButton = page.getByTestId('aitv-change-visibility-close');
        this.cancelButton = page.getByTestId('aitv-change-visibility-cancel');
        this.submitButton = page.getByTestId('aitv-change-visibility-submit');
        this.error = page.getByTestId('aitv-change-visibility-error');
        this.errorItems = page.getByTestId('aitv-change-visibility-error-item');
        this.errorItemEdit = page.getByTestId('aitv-change-visibility-error-item-edit');
        this.success = page.getByTestId('aitv-change-visibility-success');
        this.successStatus = page.getByTestId('aitv-change-visibility-success-status');
        this.doneButton = page.getByTestId('aitv-change-visibility-done');
    }

    async expectOpen() {
        await expect(this.modal, 'Change visibility modal is not visible').toBeVisible({ timeout: 15_000 });
    }

    async expectClosed() {
        await expect(this.modal, 'Change visibility modal should be closed').not.toBeVisible();
    }

    /** Parameterized: the option id depends on the visibility being chosen. */
    option(visibility: ContentVisibility): Locator {
        return this.page.getByTestId(`aitv-change-visibility-option-${visibility}`);
    }

    async selectOption(visibility: ContentVisibility) {
        const option = this.option(visibility);
        await expect(option, `Visibility option "${visibility}" is not visible`).toBeVisible();
        await option.click();
    }

    async expectSubmitDisabled() {
        await expect(this.submitButton, 'Submit button should be disabled').toBeDisabled();
    }

    async expectSubmitEnabled() {
        await expect(this.submitButton, 'Submit button should be enabled').toBeEnabled();
    }

    /** Waits for one video-update request per selected video. */
    async submitAndWaitUpdated(videoCount = 1) {
        const updates = collectResponses(
            this.page,
            r => /\/api\/videos\/update\//.test(r.url()) && r.request().method() === 'POST'
        );

        await expect(this.submitButton, 'Change visibility submit button is not visible').toBeVisible();
        await expect(this.submitButton, 'Change visibility submit button is not enabled').toBeEnabled();
        await this.submitButton.click();

        await updates.waitFor(videoCount);
    }

    async assertSuccess() {
        await expect(this.success, 'Change visibility success screen is not visible').toBeVisible({ timeout: 30_000 });
    }

    async cancel() {
        await expect(this.cancelButton, 'Cancel button is not visible').toBeVisible();
        await expect(this.cancelButton, 'Cancel button is not enabled').toBeEnabled();
        await this.cancelButton.click();
        await this.expectClosed();
    }
}
