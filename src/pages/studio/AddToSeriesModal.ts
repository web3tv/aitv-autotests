import { Page, Locator, expect } from '@playwright/test';
import { collectResponses } from '../../utils/responseCollector';

/**
 * "Add to Series" modal of the redesigned studio Content page (W3-2815).
 * The series list is client-side; the search box only renders when the channel has
 * more than four series. Videos are attached one request each, sequentially.
 */
export class AddToSeriesModal {
    readonly page: Page;

    readonly modal: Locator;
    readonly closeButton: Locator;
    readonly searchInput: Locator;
    readonly list: Locator;
    readonly items: Locator;
    readonly emptyState: Locator;
    readonly noResults: Locator;
    readonly cancelButton: Locator;
    readonly submitButton: Locator;
    readonly success: Locator;
    readonly successUrl: Locator;
    readonly viewButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.modal = page.getByTestId('aitv-add-to-series-modal');
        this.closeButton = page.getByTestId('aitv-add-to-series-close');
        this.searchInput = page.getByTestId('aitv-add-to-series-search');
        this.list = page.getByTestId('aitv-add-to-series-list');
        this.items = page.getByTestId('aitv-add-to-series-item');
        this.emptyState = page.getByTestId('aitv-add-to-series-empty');
        this.noResults = page.getByTestId('aitv-add-to-series-no-results');
        this.cancelButton = page.getByTestId('aitv-add-to-series-cancel');
        this.submitButton = page.getByTestId('aitv-add-to-series-submit');
        this.success = page.getByTestId('aitv-add-to-series-success');
        this.successUrl = page.getByTestId('aitv-add-to-series-success-url');
        this.viewButton = page.getByTestId('aitv-add-to-series-view');
    }

    async expectOpen() {
        await expect(this.modal, 'Add to Series modal is not visible').toBeVisible({ timeout: 15_000 });
    }

    async expectClosed() {
        await expect(this.modal, 'Add to Series modal should be closed').not.toBeVisible();
    }

    /** Parameterized: a series row can only be found by its title. */
    itemByTitle(title: string): Locator {
        return this.items.filter({ hasText: title }).first();
    }

    async chooseSeries(title: string) {
        const item = this.itemByTitle(title);
        await expect(item, `Series "${title}" is not listed`).toBeVisible({ timeout: 15_000 });
        await expect(item, `Series "${title}" is not enabled`).toBeEnabled();
        await item.click();
        await expect(this.submitButton, 'Submit button is not enabled after choosing a series').toBeEnabled();
    }

    async assertSeriesListed(title: string) {
        await expect(this.itemByTitle(title), `Series "${title}" should be listed`).toBeVisible();
    }

    async assertSeriesNotListed(title: string) {
        await expect(this.items.filter({ hasText: title }), `Series "${title}" should not be listed`)
            .toHaveCount(0);
    }

    async search(text: string) {
        await expect(this.searchInput, 'Series search input is not visible').toBeVisible();
        await expect(this.searchInput, 'Series search input is not enabled').toBeEnabled();
        await this.searchInput.fill(text);
    }

    /** Waits for one add-item request per video being attached. */
    async submitAndWaitAdded(videoCount = 1) {
        const addItems = collectResponses(
            this.page,
            r => r.url().includes('/api/playlists/add-item') && r.request().method() === 'POST'
        );

        await expect(this.submitButton, 'Add to Series submit button is not visible').toBeVisible();
        await expect(this.submitButton, 'Add to Series submit button is not enabled').toBeEnabled();
        await this.submitButton.click();

        await addItems.waitFor(videoCount);
    }

    async assertSuccess() {
        await expect(this.success, 'Add to Series success screen is not visible').toBeVisible({ timeout: 30_000 });
    }

    async cancel() {
        await expect(this.cancelButton, 'Cancel button is not visible').toBeVisible();
        await expect(this.cancelButton, 'Cancel button is not enabled').toBeEnabled();
        await this.cancelButton.click();
        await this.expectClosed();
    }
}
