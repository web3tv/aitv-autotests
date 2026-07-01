import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { StudioHeaderPage } from '../pages/components/StudioHeaderPage';
import { ContentUploadModal, Visibility } from '../pages/studio/ContentUploadModal';
import { ensureOnStudioDomain } from '../utils/studioNavigation';

const DEFAULT_COVER = 'test-data/fixtures/photo/cat.jpg';
const DEFAULT_DESCRIPTION = 'QA autotest description';

export interface MovieOptions {
    filePath: string;
    title: string;
    description?: string;
    horizontalCover?: string;
    verticalCover?: string;
    visibility?: Visibility;
}

export interface SeriesOptions {
    filePath: string;
    description?: string;
    seriesName?: string;
    parentSeriesName?: string;
    episodeNumber?: string;
    episodeTitle: string;
    horizontalCover?: string;
    verticalCover?: string;
    visibility?: Visibility;
}

export interface ShortsOptions {
    filePath: string;
    title: string;
    description?: string;
    cover?: string;
    visibility?: Visibility;
    associateWith?: string; // movie/series title to associate; omit to skip association
}

/**
 * Orchestrates the new Movie / Series / Shorts creation journeys (W3-2702) on top
 * of {@link ContentUploadModal}. Each `create*` method drives the dialog end-to-end
 * up to (and including) the Success screen, leaving it open for assertions.
 */
export class ContentCreationFlow {
    readonly page: Page;
    readonly header: StudioHeaderPage;
    readonly modal: ContentUploadModal;

    constructor(page: Page) {
        this.page = page;
        this.header = new StudioHeaderPage(page);
        this.modal = new ContentUploadModal(page);
    }

    /**
     * Opens the upload modal. The header "+" button now opens it directly (no submenu);
     * the content type (Movie/Series/Shorts) is chosen inside the modal after a file is added.
     */
    async openUploadModal(): Promise<void> {
        await ensureOnStudioDomain(this.page);
        await this.header.clickPlusBtn();
        await expect(this.modal.dropzone, 'Upload modal did not open from the "+" button').toBeVisible({ timeout: 15_000 });
    }

    async openNewVideo(): Promise<void> {
        await this.openUploadModal();
    }

    async openNewShort(): Promise<void> {
        await this.openUploadModal();
    }

    /** Full Movie creation: details + both covers + finalize + publish. Returns the movie title. */
    async createMovie(opts: MovieOptions): Promise<string> {
        const visibility = opts.visibility ?? 'public';
        await this.openNewVideo();
        await this.modal.selectFile(opts.filePath);
        await this.modal.selectType('movie');

        await this.modal.fillTitle(opts.title);
        await this.modal.fillDescription(opts.description ?? DEFAULT_DESCRIPTION);
        await this.modal.selectCategory();
        await this.modal.selectGenre();
        await this.modal.uploadHorizontalCover(opts.horizontalCover ?? DEFAULT_COVER);
        await this.modal.uploadVerticalCover(opts.verticalCover ?? DEFAULT_COVER);

        await this.modal.waitUploadProcessed();
        await this.modal.clickNext();

        await this.modal.assertOnFinalize();
        await this.modal.selectVisibility(visibility);
        await this.modal.clickPublish();
        await this.modal.assertSuccess();
        return opts.title;
    }

    /** Creates a brand-new Series (New Series mode) with its first episode. Returns the series name. */
    async createNewSeries(opts: SeriesOptions): Promise<string> {
        const visibility = opts.visibility ?? 'public';
        const seriesName = opts.seriesName ?? `QA Series ${Date.now()}`;
        await this.openNewVideo();
        await this.modal.selectFile(opts.filePath);
        await this.modal.selectType('series');
        await this.modal.setSeriesModeNew();

        // Episode number is auto-assigned (disabled "1") in New Series mode.
        await this.modal.fillSeriesName(seriesName);
        await this.modal.fillTitle(opts.episodeTitle);
        await this.modal.fillDescription(opts.description ?? DEFAULT_DESCRIPTION);
        await this.modal.selectCategory();
        await this.modal.selectGenre();
        await this.modal.uploadHorizontalCover(opts.horizontalCover ?? DEFAULT_COVER);
        await this.modal.uploadVerticalCover(opts.verticalCover ?? DEFAULT_COVER);

        await this.modal.waitUploadProcessed();
        await this.modal.clickNext();

        await this.modal.assertOnFinalize();
        await this.modal.selectVisibility(visibility);
        await this.modal.clickPublish();
        await this.modal.assertSuccess();
        return seriesName;
    }

    /** Adds a new Episode to an existing parent Series (New Episode mode). */
    async createSeriesEpisode(opts: SeriesOptions): Promise<void> {
        const visibility = opts.visibility ?? 'public';
        await this.openNewVideo();
        await this.modal.selectFile(opts.filePath);
        await this.modal.selectType('series');
        await this.modal.setSeriesModeEpisode();
        await this.modal.selectParentSeries(opts.parentSeriesName);

        // Episode number is auto-managed. Category/genres may be inherited from the parent
        // series (rendered disabled) — fill them only when they are still editable.
        await this.modal.fillTitle(opts.episodeTitle);
        await this.modal.fillDescription(opts.description ?? DEFAULT_DESCRIPTION);
        await this.modal.uploadHorizontalCover(opts.horizontalCover ?? DEFAULT_COVER);
        await this.modal.uploadVerticalCover(opts.verticalCover ?? DEFAULT_COVER);
        await this.modal.selectCategoryIfEditable();
        await this.modal.selectGenreIfEditable();

        await this.modal.waitUploadProcessed();
        await this.modal.clickNext();

        await this.modal.assertOnFinalize();
        await this.modal.selectVisibility(visibility);
        await this.modal.clickPublish();
        await this.modal.assertSuccess();
    }

    /** Full Shorts creation (single multi-aspect cover, locked Shorts category). Returns the title. */
    async createShort(opts: ShortsOptions): Promise<string> {
        const visibility = opts.visibility ?? 'public';
        await this.openNewShort();
        await this.modal.selectFile(opts.filePath);
        await this.modal.selectType('shorts');

        await this.modal.fillTitle(opts.title);
        await this.modal.fillDescription(opts.description ?? DEFAULT_DESCRIPTION);
        await this.modal.selectGenre();
        if (opts.associateWith !== undefined) {
            await this.modal.toggleAssociated();
            await this.modal.selectAssociated(opts.associateWith || undefined);
        }
        await this.modal.uploadShortsCover(opts.cover ?? DEFAULT_COVER);

        await this.modal.waitUploadProcessed();
        await this.modal.clickNext();

        await this.modal.assertOnFinalize();
        await this.modal.selectVisibility(visibility);
        await this.modal.clickPublish();
        await this.modal.assertSuccess();
        return opts.title;
    }
}
