import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export type ContentType = 'movie' | 'series' | 'shorts';
export type Visibility = 'public' | 'unlisted' | 'private';

const DEFAULT_COVER = 'test-data/fixtures/photo/cat.jpg';

/**
 * Page Object for the new stepped content-creation dialog (W3-2702):
 * Upload file -> Details (with Movie/Series/Shorts type selector) -> Finalize -> Success.
 *
 * All locators rely on the stable `aitv-upload-*` data-testid attributes that the
 * frontend exposes for this flow. The only step without a testid is the cover
 * crop modal, whose confirm button is matched by its accessible name ("Confirm").
 */
export class ContentUploadModal {
    readonly page: Page;

    // Dialog root
    readonly dialog: Locator;

    readonly modalClose: Locator;

    // Upload (dropzone) step
    readonly uploader: Locator;
    readonly dropzone: Locator;
    readonly selectFileBtn: Locator;
    readonly dropzoneFileInput: Locator;

    // Type selector
    readonly typeSelector: Locator;
    readonly typeMovie: Locator;
    readonly typeSeries: Locator;
    readonly typeShorts: Locator;

    // Details step (shared)
    readonly detailsStep: Locator;
    readonly autofillBtn: Locator;
    readonly titleInput: Locator;
    readonly descriptionEditor: Locator;
    readonly categoryContainer: Locator;
    readonly categoryInput: Locator;
    readonly genresContainer: Locator;
    readonly genresInput: Locator;

    // Movie / Series covers (two)
    readonly thumbHorizontal: Locator;
    readonly thumbHorizontalInput: Locator;
    readonly thumbVertical: Locator;
    readonly thumbVerticalInput: Locator;
    readonly cropConfirmBtn: Locator;

    // Series-specific
    readonly seriesFields: Locator;
    readonly seriesModeNew: Locator;
    readonly seriesModeEpisode: Locator;
    readonly seriesNameInput: Locator;
    readonly seriesEpisodeNumberContainer: Locator;
    readonly seriesEpisodeNumberInput: Locator;
    readonly seriesParentContainer: Locator;
    readonly seriesParentInput: Locator;

    // Shorts-specific
    readonly shortsThumbnail: Locator;
    readonly shortsThumbnailInput: Locator;
    readonly shortsAssociated: Locator;
    readonly shortsAssociatedToggle: Locator;
    readonly shortsAssociatedSelectContainer: Locator;
    readonly shortsAssociatedSelectInput: Locator;

    // Footer
    readonly footer: Locator;
    readonly cancelBtn: Locator;
    readonly saveDraftBtn: Locator;
    readonly nextBtn: Locator;
    readonly backBtn: Locator;
    readonly publishBtn: Locator;
    readonly processing: Locator;

    // Finalize step
    readonly finalizeStep: Locator;
    readonly visibilityPublic: Locator;
    readonly visibilityUnlisted: Locator;
    readonly visibilityPrivate: Locator;
    readonly scheduleToggle: Locator;
    readonly contentRatingContainer: Locator;
    readonly contentRatingInput: Locator;
    readonly hotspotsToggle: Locator;
    readonly preview: Locator;
    readonly previewPlay: Locator;

    // Success step
    readonly successRoot: Locator;
    readonly successClose: Locator;
    readonly successViewVideo: Locator;
    readonly successVisitStudio: Locator;
    readonly successUploadAnother: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dialog = page.getByRole('dialog');

        this.uploader = page.getByTestId('aitv-upload-uploader');
        this.dropzone = page.getByTestId('aitv-upload-dropzone');
        this.selectFileBtn = page.getByTestId('aitv-upload-select-file');
        this.dropzoneFileInput = page.getByTestId('aitv-upload-file-input');
        this.modalClose = page.getByTestId('aitv-upload-modal-close');

        this.typeSelector = page.getByTestId('aitv-upload-type-selector');
        this.typeMovie = page.getByTestId('aitv-upload-type-movie');
        this.typeSeries = page.getByTestId('aitv-upload-type-series');
        this.typeShorts = page.getByTestId('aitv-upload-type-shorts');

        this.detailsStep = page.getByTestId('aitv-upload-details-step');
        this.autofillBtn = page.getByTestId('aitv-upload-details-autofill');
        // The data-testids now sit directly on the input / file-input elements.
        this.titleInput = page.getByTestId('aitv-upload-details-title');
        this.descriptionEditor = page.locator('[data-id="description"] .ql-editor');
        this.categoryContainer = page.getByTestId('aitv-upload-details-category');
        this.categoryInput = this.categoryContainer;
        this.genresContainer = page.getByTestId('aitv-upload-details-genres');
        this.genresInput = this.genresContainer;

        this.thumbHorizontal = page.getByTestId('aitv-upload-details-thumb-horizontal');
        this.thumbHorizontalInput = this.thumbHorizontal;
        this.thumbVertical = page.getByTestId('aitv-upload-details-thumb-vertical');
        this.thumbVerticalInput = this.thumbVertical;
        this.cropConfirmBtn = page.getByTestId('upload-image-crop-confirm');

        this.seriesFields = page.getByTestId('aitv-upload-series-fields');
        this.seriesModeNew = page.getByTestId('aitv-upload-series-mode-new');
        this.seriesModeEpisode = page.getByTestId('aitv-upload-series-mode-episode');
        this.seriesNameInput = page.getByTestId('aitv-upload-series-name');
        this.seriesEpisodeNumberContainer = page.getByTestId('aitv-upload-series-episode-number');
        this.seriesEpisodeNumberInput = this.seriesEpisodeNumberContainer;
        this.seriesParentContainer = page.getByTestId('aitv-upload-series-parent');
        this.seriesParentInput = this.seriesParentContainer;

        this.shortsThumbnail = page.getByTestId('aitv-upload-shorts-thumbnail');
        this.shortsThumbnailInput = this.shortsThumbnail;
        this.shortsAssociated = page.getByTestId('aitv-upload-shorts-associated');
        this.shortsAssociatedToggle = page.getByTestId('aitv-upload-shorts-associated-toggle');
        this.shortsAssociatedSelectContainer = page.getByTestId('aitv-upload-shorts-associated-select');
        this.shortsAssociatedSelectInput = this.shortsAssociatedSelectContainer;

        this.footer = page.getByTestId('aitv-upload-footer');
        this.cancelBtn = page.getByTestId('aitv-upload-footer-cancel');
        this.saveDraftBtn = page.getByTestId('aitv-upload-footer-save-draft');
        this.nextBtn = page.getByTestId('aitv-upload-footer-next');
        this.backBtn = page.getByTestId('aitv-upload-footer-back');
        this.publishBtn = page.getByTestId('aitv-upload-footer-publish');
        this.processing = page.getByTestId('aitv-upload-processing');

        this.finalizeStep = page.getByTestId('aitv-upload-finalize-step');
        this.visibilityPublic = page.getByTestId('aitv-upload-finalize-visibility-public');
        this.visibilityUnlisted = page.getByTestId('aitv-upload-finalize-visibility-unlisted');
        this.visibilityPrivate = page.getByTestId('aitv-upload-finalize-visibility-private');
        this.scheduleToggle = page.getByTestId('aitv-upload-finalize-schedule-toggle');
        this.contentRatingContainer = page.getByTestId('aitv-upload-finalize-content-rating');
        this.contentRatingInput = this.contentRatingContainer.locator('input').first();
        this.hotspotsToggle = page.getByTestId('aitv-upload-finalize-hotspots-toggle');
        this.preview = page.getByTestId('aitv-upload-finalize-preview');
        this.previewPlay = page.getByTestId('aitv-upload-finalize-preview-play');

        this.successRoot = page.getByTestId('aitv-upload-success-root');
        this.successClose = page.getByTestId('aitv-upload-success-close');
        this.successViewVideo = page.getByTestId('aitv-upload-success-view-video');
        this.successVisitStudio = page.getByTestId('aitv-upload-success-visit-studio');
        this.successUploadAnother = page.getByTestId('aitv-upload-success-upload-another');
    }

    // ---------------------------------------------------------------- Upload step

    async selectFile(filePath: string): Promise<void> {
        await expect(this.dropzone, 'Upload dropzone is not visible').toBeVisible({ timeout: 15_000 });
        await this.dropzoneFileInput.setInputFiles(filePath);
        await expect(this.detailsStep, 'Details step did not appear after selecting the file').toBeVisible({ timeout: 30_000 });
    }

    /** Waits until the uploaded source finishes processing ("Video successfully uploaded"). */
    async waitUploadProcessed(timeout = 180_000): Promise<void> {
        await expect(this.processing, 'Upload processing status did not reach "Video successfully uploaded"')
            .toContainText('Video successfully uploaded', { timeout });
    }

    // ---------------------------------------------------------------- Type selector

    private typeRadio(type: ContentType): Locator {
        return type === 'movie' ? this.typeMovie : type === 'series' ? this.typeSeries : this.typeShorts;
    }

    async selectType(type: ContentType): Promise<void> {
        const radio = this.typeRadio(type);
        await expect(radio, `Type "${type}" radio is not visible`).toBeVisible();
        await expect(radio, `Type "${type}" radio is not enabled`).toBeEnabled();
        await radio.click();
        await expect(radio, `Type "${type}" radio was not selected`).toHaveAttribute('aria-checked', 'true');
    }

    async assertTypeAvailable(type: ContentType, available: boolean): Promise<void> {
        const radio = this.typeRadio(type);
        await expect(radio, `Type "${type}" radio is not visible`).toBeVisible();
        // Unavailable types are rendered dimmed (opacity 0.5) and never become aria-checked.
        // Polled so it survives the brief re-render right after a file is selected.
        await expect(async () => {
            const opacity = Number(await radio.evaluate((el) => getComputedStyle(el as HTMLElement).opacity));
            if (available) {
                expect(opacity, `Type "${type}" is expected to be selectable`).toBeGreaterThan(0.9);
            } else {
                expect(opacity, `Type "${type}" is expected to be disabled (dimmed)`).toBeLessThan(0.9);
            }
        }, `Type "${type}" availability did not settle`).toPass({ timeout: 10_000 });
    }

    // ---------------------------------------------------------------- Details step

    async fillTitle(title: string): Promise<void> {
        await expect(this.titleInput, 'Title input is not visible').toBeVisible();
        await expect(this.titleInput, 'Title input is not editable').toBeEditable();
        await this.titleInput.fill(title);
    }

    async fillDescription(description: string): Promise<void> {
        await expect(this.descriptionEditor, 'Description editor is not visible').toBeVisible();
        await expect(this.descriptionEditor, 'Description editor is not editable').toBeEditable();
        await this.descriptionEditor.click();
        await this.descriptionEditor.fill(description);
    }

    /** Opens a MUI Autocomplete and selects an option (the first one, or one matching `optionText`). */
    private async pickFromAutocomplete(input: Locator, name: string, optionText?: string): Promise<string> {
        await expect(input, `${name} input is not visible`).toBeVisible();
        await expect(input, `${name} input is not enabled`).toBeEnabled();
        await input.click();

        const listbox = this.page.locator('[role="listbox"]');
        const option = optionText
            ? listbox.getByRole('option', { name: optionText }).first()
            : listbox.getByRole('option').first();

        // Some option lists (e.g. Parent Series) load asynchronously, so keep the popup
        // open (re-opening with ArrowDown if it collapsed) until the option appears.
        await expect(async () => {
            if (!(await listbox.isVisible().catch(() => false))) await input.press('ArrowDown');
            await expect(option, `${name} option did not load`).toBeVisible({ timeout: 1500 });
        }, `${name} options list did not load a selectable option`).toPass({ timeout: 20_000 });

        const picked = (await option.textContent())?.trim() ?? '';
        await option.click();
        return picked;
    }

    async selectCategory(optionText?: string): Promise<string> {
        return this.pickFromAutocomplete(this.categoryInput, 'Category', optionText);
    }

    async selectGenre(optionText?: string): Promise<string> {
        const picked = await this.pickFromAutocomplete(this.genresInput, 'Genre', optionText);
        await this.page.keyboard.press('Escape');
        return picked;
    }

    /** Picks a category only if the field is still editable (it is inherited/locked for episodes). */
    async selectCategoryIfEditable(optionText?: string): Promise<void> {
        if (await this.categoryInput.isEnabled().catch(() => false)) await this.selectCategory(optionText);
    }

    /** Picks a genre only if the field is still editable (inherited/locked for episodes). */
    async selectGenreIfEditable(optionText?: string): Promise<void> {
        if (await this.genresInput.isEnabled().catch(() => false)) await this.selectGenre(optionText);
    }

    /** Uploads a cover image into a thumbnail slot and confirms the crop modal. */
    private async uploadCover(input: Locator, name: string, imagePath: string): Promise<void> {
        await input.setInputFiles(imagePath);
        await expect(this.cropConfirmBtn, `${name} crop confirm button did not appear`).toBeVisible({ timeout: 15_000 });
        await this.cropConfirmBtn.click();
        await expect(this.cropConfirmBtn, `${name} crop modal did not close after confirm`).toBeHidden({ timeout: 15_000 });
    }

    async uploadHorizontalCover(imagePath: string): Promise<void> {
        await this.uploadCover(this.thumbHorizontalInput, 'Horizontal cover', imagePath);
    }

    async uploadVerticalCover(imagePath: string): Promise<void> {
        await this.uploadCover(this.thumbVerticalInput, 'Vertical cover', imagePath);
    }

    async uploadShortsCover(imagePath: string = DEFAULT_COVER): Promise<void> {
        await this.uploadCover(this.shortsThumbnailInput, 'Shorts cover', imagePath);
    }

    // ---------------------------------------------------------------- Series-specific

    async setSeriesModeNew(): Promise<void> {
        await expect(this.seriesModeNew, '"New Series" mode is not visible').toBeVisible();
        await expect(this.seriesModeNew, '"New Series" mode is not enabled').toBeEnabled();
        await this.seriesModeNew.click();
        await expect(this.seriesNameInput, 'Series Name input did not appear in New Series mode').toBeVisible();
    }

    async setSeriesModeEpisode(): Promise<void> {
        await expect(this.seriesModeEpisode, '"New Episode" mode is not visible').toBeVisible();
        await expect(this.seriesModeEpisode, '"New Episode" mode is not enabled').toBeEnabled();
        await this.seriesModeEpisode.click();
        await expect(this.seriesParentContainer, 'Parent Series field did not appear in New Episode mode').toBeVisible();
    }

    async fillSeriesName(name: string): Promise<void> {
        await expect(this.seriesNameInput, 'Series Name input is not visible').toBeVisible();
        await this.seriesNameInput.fill(name);
    }

    async fillEpisodeNumber(value: string): Promise<void> {
        await expect(this.seriesEpisodeNumberInput, 'Episode Number input is not visible').toBeVisible();
        await this.seriesEpisodeNumberInput.fill(value);
    }

    async selectParentSeries(optionText?: string): Promise<string> {
        return this.pickFromAutocomplete(this.seriesParentInput, 'Parent Series', optionText);
    }

    // ---------------------------------------------------------------- Shorts-specific

    async assertCategoryLockedToShorts(): Promise<void> {
        await expect(this.categoryInput, 'Shorts category input is not visible').toBeVisible();
        await expect(this.categoryInput, 'Shorts category is expected to be disabled').toBeDisabled();
        await expect(this.categoryInput, 'Shorts category is expected to be pre-filled with "Shorts"').toHaveValue('Shorts');
    }

    async toggleAssociated(): Promise<void> {
        await expect(this.shortsAssociatedToggle, 'Associated movie/series toggle is not visible').toBeVisible();
        await expect(this.shortsAssociatedToggle, 'Associated movie/series toggle is not enabled').toBeEnabled();
        await this.shortsAssociatedToggle.click();
        await expect(this.shortsAssociatedSelectContainer, 'Associated movie/series select did not appear').toBeVisible();
    }

    async selectAssociated(optionText?: string): Promise<string> {
        return this.pickFromAutocomplete(this.shortsAssociatedSelectInput, 'Associated movie/series', optionText);
    }

    // ---------------------------------------------------------------- Footer navigation

    async clickNext(): Promise<void> {
        await expect(this.nextBtn, 'Next button is not visible').toBeVisible();
        await expect(this.nextBtn, 'Next button is not enabled').toBeEnabled();
        await this.nextBtn.click();
    }

    async clickBack(): Promise<void> {
        await expect(this.backBtn, 'Back button is not visible').toBeVisible();
        await expect(this.backBtn, 'Back button is not enabled').toBeEnabled();
        await this.backBtn.click();
    }

    async assertNextDisabled(): Promise<void> {
        await expect(this.nextBtn, 'Next button is expected to be disabled').toBeDisabled();
    }

    // ---------------------------------------------------------------- Finalize step

    async assertOnFinalize(): Promise<void> {
        await expect(this.finalizeStep, 'Finalize step is not visible').toBeVisible({ timeout: 15_000 });
    }

    async selectVisibility(visibility: Visibility): Promise<void> {
        const radio = visibility === 'public'
            ? this.visibilityPublic
            : visibility === 'unlisted'
                ? this.visibilityUnlisted
                : this.visibilityPrivate;
        await expect(radio, `Visibility "${visibility}" radio is not visible`).toBeVisible();
        await expect(radio, `Visibility "${visibility}" radio is not enabled`).toBeEnabled();
        await radio.click();
        await expect(radio, `Visibility "${visibility}" was not selected`).toHaveAttribute('aria-checked', 'true');
    }

    async clickPublish(): Promise<void> {
        await expect(this.publishBtn, 'Publish button is not visible').toBeVisible();
        await expect(this.publishBtn, 'Publish button is not enabled').toBeEnabled();
        await this.publishBtn.click();
    }

    // ---------------------------------------------------------------- Success step

    async assertSuccess(): Promise<void> {
        await expect(this.successRoot, 'Success screen is not visible').toBeVisible({ timeout: 30_000 });
        await expect(this.successRoot, 'Success screen does not show the confirmation text')
            .toContainText(/successfully (uploaded|published)/i);
    }

    async closeSuccess(): Promise<void> {
        await expect(this.successClose, 'Success close button is not visible').toBeVisible();
        await this.successClose.click();
    }
}
