import { Page, Locator, expect } from '@playwright/test';
import { collectResponses } from '../../utils/responseCollector';

export type SeriesVisibility = 'public' | 'unlisted' | 'private';

/**
 * Two-step "Create Series" modal of the redesigned studio Content page (W3-2815):
 * details → visibility → success screen. There is no separate processing modal —
 * the submit button stays disabled while the request is in flight.
 */
export class CreateSeriesModal {
    readonly page: Page;

    readonly modal: Locator;
    readonly closeButton: Locator;
    readonly titleInput: Locator;
    readonly descriptionInput: Locator;
    readonly cancelButton: Locator;
    readonly continueButton: Locator;
    readonly submitButton: Locator;

    readonly success: Locator;
    readonly successCard: Locator;
    readonly successUrl: Locator;
    readonly copyLinkButton: Locator;
    readonly shareButton: Locator;
    readonly viewButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.modal = page.getByTestId('aitv-create-series-modal');
        this.closeButton = page.getByTestId('aitv-create-series-close');
        this.titleInput = page.getByTestId('aitv-create-series-title-input');
        this.descriptionInput = page.getByTestId('aitv-create-series-description-input');
        this.cancelButton = page.getByTestId('aitv-create-series-cancel');
        this.continueButton = page.getByTestId('aitv-create-series-continue');
        this.submitButton = page.getByTestId('aitv-create-series-submit');

        this.success = page.getByTestId('aitv-create-series-success');
        this.successCard = page.getByTestId('aitv-create-series-success-card');
        this.successUrl = page.getByTestId('aitv-create-series-success-url');
        this.copyLinkButton = page.getByTestId('aitv-create-series-copy-link');
        this.shareButton = page.getByTestId('aitv-create-series-share');
        this.viewButton = page.getByTestId('aitv-create-series-view');
    }

    async expectOpen() {
        await expect(this.modal, 'Create Series modal is not visible').toBeVisible({ timeout: 15_000 });
    }

    async expectClosed() {
        await expect(this.modal, 'Create Series modal should be closed').not.toBeVisible();
    }

    async fillDetails(title: string, description?: string) {
        await expect(this.titleInput, 'Series title input is not visible').toBeVisible();
        await expect(this.titleInput, 'Series title input is not enabled').toBeEnabled();
        await this.titleInput.fill(title);

        if (description !== undefined) {
            await expect(this.descriptionInput, 'Series description input is not visible').toBeVisible();
            await expect(this.descriptionInput, 'Series description input is not enabled').toBeEnabled();
            await this.descriptionInput.fill(description);
        }
    }

    async continueToVisibility() {
        await expect(this.continueButton, 'Continue button is not visible').toBeVisible();
        await expect(this.continueButton, 'Continue button is not enabled').toBeEnabled();
        await this.continueButton.click();
        await expect(this.submitButton, 'Visibility step did not open').toBeVisible();
    }

    /** Parameterized: the option id depends on the visibility being chosen. */
    visibilityOption(visibility: SeriesVisibility): Locator {
        return this.page.getByTestId(`aitv-create-series-visibility-${visibility}`);
    }

    async chooseVisibility(visibility: SeriesVisibility) {
        const option = this.visibilityOption(visibility);
        await expect(option, `Visibility option "${visibility}" is not visible`).toBeVisible();
        await option.click();
    }

    /**
     * Submits and waits for the playlist to be created plus one add-item request per video
     * (the FE adds videos sequentially, one request each).
     */
    async submitAndWaitCreated(videoCount = 1): Promise<{ privacyStatus: string; title: string }> {
        const createPromise = this.page.waitForResponse(
            r => r.url().includes('/api/playlists/create') && r.request().method() === 'POST',
            { timeout: 30_000 }
        );
        const addItems = collectResponses(
            this.page,
            r => r.url().includes('/api/playlists/add-item') && r.request().method() === 'POST'
        );

        await expect(this.submitButton, 'Create Series submit button is not visible').toBeVisible();
        await expect(this.submitButton, 'Create Series submit button is not enabled').toBeEnabled();
        await this.submitButton.click();

        const createResponse = await createPromise;
        await addItems.waitFor(videoCount);

        const payload = createResponse.request().postDataJSON();
        return { privacyStatus: payload?.privacyStatus, title: payload?.title };
    }

    async assertSuccess() {
        await expect(this.success, 'Create Series success screen is not visible').toBeVisible({ timeout: 30_000 });
        await expect(this.successCard, 'Create Series success card is not visible').toBeVisible();
    }

    async getSuccessUrl(): Promise<string> {
        await expect(this.successUrl, 'Series success URL is not visible').toBeVisible();
        return (await this.successUrl.innerText()).trim();
    }

    async cancel() {
        await expect(this.cancelButton, 'Cancel button is not visible').toBeVisible();
        await expect(this.cancelButton, 'Cancel button is not enabled').toBeEnabled();
        await this.cancelButton.click();
        await this.expectClosed();
    }
}
