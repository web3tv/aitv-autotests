import { Page, Locator, Browser } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioContentPage {
    readonly page: Page;

    readonly firstVideoRaw : Locator;
    readonly firstVideoDescription: Locator;
    readonly firstVideoVisibility: Locator;
    readonly firstVideoStatus: Locator;
    readonly firstVideoStatusIcon: Locator;
    readonly shortsTab: Locator;
    readonly videosTab: Locator;
    readonly liveTab: Locator;
    readonly seriesTab: Locator;
    readonly firstVideoLink: Locator;
    readonly searchInput: Locator;
    readonly videoRows: Locator;

    readonly videoRowImages: Locator;
    readonly videoRowDates: Locator;
    readonly videoRowTitles: Locator;
    readonly videoRowDescriptions: Locator;

    readonly tableViewToggle: Locator;
    readonly gridViewToggle: Locator;

    // --- Redesigned page (W3-2815): tabs, cards, selection, bulk bar, empty states
    readonly allTabNew: Locator;
    readonly moviesTabNew: Locator;
    readonly seriesTabNew: Locator;
    readonly shortsTabNew: Locator;

    readonly gridViewButton: Locator;
    readonly tableViewButton: Locator;
    readonly filterButton: Locator;
    readonly sortButton: Locator;

    /** Grid cards currently rendered on screen (the hidden table tree is filtered out). */
    readonly visibleCards: Locator;
    /**
     * Table rows that own a selection checkbox — one per content item. The table renders a
     * second, checkbox-less copy of every row, so an unfiltered `video-row` count is doubled.
     */
    readonly visibleRows: Locator;
    readonly selectedCards: Locator;
    readonly tableSelectAll: Locator;

    readonly bulkBar: Locator;
    readonly bulkSelectAll: Locator;
    readonly bulkSelectAllLabel: Locator;
    readonly bulkDelete: Locator;
    readonly bulkChangeVisibility: Locator;
    readonly bulkAddToSeries: Locator;
    readonly bulkCreateSeries: Locator;
    readonly bulkMore: Locator;
    readonly bulkMenuAddToSeries: Locator;
    readonly bulkMenuCreateSeries: Locator;

    readonly seriesBulkDelete: Locator;
    readonly seriesBulkChangeVisibility: Locator;

    /** Per-card engagement counters (views/likes/dislikes/comments) — masked in visual runs. */
    readonly cardStats: Locator;
    readonly cardMenu: Locator;
    readonly emptyState: Locator;
    readonly emptyUploadButton: Locator;
    readonly noFilterResults: Locator;
    readonly resetFiltersButton: Locator;
    readonly playlistRows: Locator;

    constructor(page: Page) {
        this.page = page;

        // The content page has two view modes (grid = default, table); the row
        // locators below exist only in the table view — call ensureTableView() first.
        this.tableViewToggle = this.page.locator('[data-id="view-mode-toggle-table"]');
        this.gridViewToggle = this.page.locator('[data-id="view-mode-toggle-grid"]');

        this.firstVideoRaw = this.page.locator('[data-testid="video-row"]').first();
        this.firstVideoLink = this.firstVideoRaw.locator('a[aria-label]');
        this.firstVideoDescription = this.firstVideoRaw.locator('[data-id="video"]');
        this.firstVideoVisibility = this.page.locator('[data-testid="video-row"] [data-id="privacy-badge"]').first();
        this.firstVideoStatus = this.firstVideoRaw.locator('[data-id="date"]').first();
        this.firstVideoStatusIcon = this.page.locator('[data-testid="video-row"] [data-id="upload-status-badge"]').first();

        this.shortsTab = this.page.locator('[data-id="segmented-control-shorts"]');
        this.videosTab = this.page.locator('[data-id="segmented-control-movies"]');
        this.seriesTab = this.page.locator('[data-id="segmented-control-series"]');
        this.liveTab = this.page.locator('[data-id="live-tab"]');
        

        // The AI.TV skin renders `aitv-studio-search`, the legacy skin `studioSearchInput`
        // (Search.tsx picks one by the isAiTv flag) — match either so the POM is skin-agnostic.
        this.searchInput = this.page.locator(
            '[data-testid="aitv-studio-search"], [data-testid="studioSearchInput"]'
        );
        this.videoRows = this.page.locator('[data-testid="video-row"]');

        this.videoRowImages = this.page.locator('[data-id="image"]');
        this.videoRowDates = this.page.locator('[data-id="date"]');
        this.videoRowTitles = this.page.locator('[data-testid="video-row"] .title');
        this.videoRowDescriptions = this.page.locator('[data-testid="video-row"] .description');

        this.allTabNew = this.page.getByTestId('aitv-studio-tab-all');
        this.moviesTabNew = this.page.getByTestId('aitv-studio-tab-movies');
        this.seriesTabNew = this.page.getByTestId('aitv-studio-tab-series');
        this.shortsTabNew = this.page.getByTestId('aitv-studio-tab-shorts');

        this.gridViewButton = this.page.getByTestId('aitv-studio-view-grid');
        this.tableViewButton = this.page.getByTestId('aitv-studio-view-table');
        this.filterButton = this.page.getByTestId('aitv-studio-filter');
        this.sortButton = this.page.getByTestId('aitv-studio-sort');

        // Grid and table markup are both mounted at all times (the toggle only flips CSS),
        // so every collection has to be narrowed to what is actually on screen.
        this.visibleCards = this.page.locator('[data-testid="studio-card"]:visible');
        this.visibleRows = this.page.locator(
            '[data-testid="video-row"]:visible:has([data-testid="aitv-studio-row-checkbox"])'
        );
        this.selectedCards = this.page.locator('[data-testid="studio-card"][data-selected="true"]:visible');
        this.tableSelectAll = this.page.getByTestId('aitv-studio-table-select-all');
        this.playlistRows = this.page.locator('[data-id="playlist-row"]:visible');

        this.bulkBar = this.page.locator('[data-id="selected-actions-bar"]');
        this.bulkSelectAll = this.page.getByTestId('aitv-studio-select-all');
        this.bulkSelectAllLabel = this.page.getByTestId('aitv-studio-select-all-label');
        this.bulkDelete = this.page.getByTestId('aitv-studio-bulk-delete');
        this.bulkChangeVisibility = this.page.getByTestId('aitv-studio-bulk-change-visibility');
        this.bulkAddToSeries = this.page.getByTestId('aitv-studio-bulk-add-to-series');
        this.bulkCreateSeries = this.page.getByTestId('aitv-studio-bulk-create-series');
        this.bulkMore = this.page.getByTestId('aitv-studio-bulk-more');
        this.bulkMenuAddToSeries = this.page.getByTestId('aitv-studio-bulk-menu-add-to-series');
        this.bulkMenuCreateSeries = this.page.getByTestId('aitv-studio-bulk-menu-create-series');

        this.seriesBulkDelete = this.page.getByTestId('aitv-series-bulk-delete');
        this.seriesBulkChangeVisibility = this.page.getByTestId('aitv-series-bulk-change-visibility');

        this.cardStats = this.page.locator(
            '[data-id="views"], [data-id="likes"], [data-id="dislikes"], [data-id="comments"]'
        );
        this.cardMenu = this.page.getByTestId('studio-card-menu');
        this.emptyState = this.page.getByTestId('aitv-studio-empty-state');
        this.emptyUploadButton = this.page.getByTestId('aitv-studio-empty-upload');
        this.noFilterResults = this.page.locator('[data-id="studio-no-filter-results"]');
        this.resetFiltersButton = this.page.locator('[data-id="reset-filters-button"]');
    }

    async checkVideoDescription(description: any){
        await this.ensureTableView();
        await expect(this.firstVideoDescription, 'First video description does not contain expected text').toContainText(description);
    }
    async checkVideoVisibility(visibility: any){
        await this.ensureTableView();
        await expect(this.firstVideoVisibility, 'First video visibility does not contain expected text').toContainText(visibility);
    }

    async checkVideoStatus(status: string) {
        await this.ensureTableView();
        await expect(this.firstVideoStatusIcon, 'Video status icon is not visible').toBeVisible({ timeout: 10_000 });
        await this.firstVideoStatusIcon.hover();
        await expect(this.page.getByRole('tooltip', { name: status }), `Tooltip "${status}" is not visible`).toBeVisible();
    }



    async getFirstVideoUrl(): Promise<string> {
        await this.ensureTableView();
        await expect(this.firstVideoLink, 'First video link is not visible').toBeVisible();
        const href = await this.firstVideoLink.getAttribute('href');
        if (!href) throw new Error('First video link has no href');
        return href;
    }



    
    // TABS
    async clickShortsTab(){
       await expect(this.shortsTab, 'Shorts tab is not visible').toBeVisible();
       await expect(this.shortsTab, 'Shorts tab is not enabled').toBeEnabled();
       await this.shortsTab.click();
    }

    async clickVideosTab(){
        await expect(this.videosTab, 'Videos tab is not visible').toBeVisible();
       await expect(this.videosTab, 'Videos tab is not enabled').toBeEnabled();
       await this.videosTab.click();
    }

    async clickLiveTab(){
        await expect(this.liveTab, 'Live tab is not visible').toBeVisible();
       await expect(this.liveTab, 'Live tab is not enabled').toBeEnabled();
       await this.liveTab.click();
    }

    async clickSeriesTab(){
        await expect(this.seriesTab, 'Series tab is not visible').toBeVisible();
       await expect(this.seriesTab, 'Series tab is not enabled').toBeEnabled();
       await this.seriesTab.click();
    }

    async searchByText(text: string) {
        await expect(this.searchInput, 'Search input is not visible').toBeVisible();
        await expect(this.searchInput, 'Search input is not enabled').toBeEnabled();
        await this.searchInput.fill(text);
    }

    async clearSearch() {
        await expect(this.searchInput, 'Search input is not visible').toBeVisible();
        await expect(this.searchInput, 'Search input is not enabled').toBeEnabled();
        await this.searchInput.fill('');
    }

    /**
     * The redesigned content page defaults to the grid view (studio-card), where the
     * video-row table markup is hidden. Row-based assertions require the table view.
     */
    async ensureTableView() {
        await expect(this.tableViewToggle, 'Table view toggle is not visible').toBeVisible();
        if (await this.tableViewToggle.getAttribute('aria-pressed') !== 'true') {
            await expect(this.tableViewToggle, 'Table view toggle is not enabled').toBeEnabled();
            await this.tableViewToggle.click();
        }
    }

    async getVideoRowsCount(): Promise<number> {
        await this.ensureTableView();
        return await this.videoRows.count();
    }

    async assertVideoRowContainsTitle(title: string) {
        await this.ensureTableView();
        const row = this.videoRows.filter({ hasText: title });
        await expect(row.first(), `Video row with title "${title}" is not visible`).toBeVisible();
    }

    /**
     * Clicks the row-level "edit video" action for the row containing the given title
     * (opens the upload modal in edit mode via /studio/content?edit={id}).
     * Parameterized row locator — cannot live in the constructor.
     */
    async clickEditForRow(title: string) {
        await this.ensureTableView();
        // Exact-text match: a substring filter could hit the wrong row and edit foreign content.
        const row = this.videoRows.filter({ has: this.page.getByText(title, { exact: true }) }).first();
        await expect(row, `Video row with title "${title}" is not visible`).toBeVisible({ timeout: 15_000 });
        const editBtn = row.getByRole('button', { name: 'edit video' });
        await expect(editBtn, `Edit button for row "${title}" is not visible`).toBeVisible();
        await expect(editBtn, `Edit button for row "${title}" is not enabled`).toBeEnabled();
        await editBtn.click();
    }

    async assertNoVideoRows() {
        await this.ensureTableView();
        await expect(this.videoRows.first(), 'Video rows should not be visible').not.toBeVisible({ timeout: 5000 });
    }

    // ------------------------------------------------- Redesigned page (W3-2815)

    /** The grid is the default view; switch back to it after a table-view assertion. */
    async ensureGridView() {
        await expect(this.gridViewButton, 'Grid view toggle is not visible').toBeVisible();
        if (await this.gridViewButton.getAttribute('aria-pressed') !== 'true') {
            await expect(this.gridViewButton, 'Grid view toggle is not enabled').toBeEnabled();
            await this.gridViewButton.click();
        }
        await expect(this.visibleCards.first(), 'Grid cards are not visible').toBeVisible();
    }

    /**
     * Waits for the listing to actually render. The studio shell sits on a spinner for a
     * while under load, so acting on a card right after `goto` races the first paint.
     */
    async waitForListing(timeout = 45_000) {
        await expect(this.visibleCards.first(), 'Studio content listing did not load')
            .toBeVisible({ timeout });
    }

    /** Parameterized: a card cannot be addressed without its title. */
    cardByTitle(title: string): Locator {
        return this.visibleCards.filter({ hasText: title }).first();
    }

    async assertCardVisible(title: string) {
        await expect(this.cardByTitle(title), `Card "${title}" is not visible`).toBeVisible({ timeout: 15_000 });
    }

    async assertCardAbsent(title: string) {
        await expect(this.cardByTitle(title), `Card "${title}" should not be visible`)
            .not.toBeVisible({ timeout: 15_000 });
    }

    async selectCard(title: string) {
        const card = this.cardByTitle(title);
        await expect(card, `Card "${title}" is not visible`).toBeVisible({ timeout: 15_000 });
        const checkbox = card.getByTestId('aitv-studio-card-checkbox');
        await expect(checkbox, `Checkbox of card "${title}" is not visible`).toBeVisible();
        await expect(checkbox, `Checkbox of card "${title}" is not enabled`).toBeEnabled();
        await checkbox.click();
        await expect(card, `Card "${title}" is not marked as selected`).toHaveAttribute('data-selected', 'true');
    }

    async deselectCard(title: string) {
        const card = this.cardByTitle(title);
        const checkbox = card.getByTestId('aitv-studio-card-checkbox');
        await expect(checkbox, `Checkbox of card "${title}" is not visible`).toBeVisible();
        await checkbox.click();
        await expect(card, `Card "${title}" is still marked as selected`).toHaveAttribute('data-selected', 'false');
    }

    async selectRow(title: string) {
        const row = this.visibleRows.filter({ hasText: title }).first();
        await expect(row, `Row "${title}" is not visible`).toBeVisible({ timeout: 15_000 });
        const checkbox = row.getByTestId('aitv-studio-row-checkbox');
        await expect(checkbox, `Checkbox of row "${title}" is not visible`).toBeVisible();
        await expect(checkbox, `Checkbox of row "${title}" is not enabled`).toBeEnabled();
        await checkbox.click();
        await expect(row, `Row "${title}" is not marked as checked`).toHaveAttribute('data-checked', 'true');
    }

    /** The bulk bar carries no counter, so selection size is read off the cards themselves. */
    async expectSelectedCount(expected: number) {
        await expect(this.selectedCards, `Expected ${expected} selected card(s)`).toHaveCount(expected);
    }

    /** Clicks a bulk-bar action, asserting it is both visible and enabled first. */
    async clickBulkAction(action: Locator, name: string) {
        await expect(action, `${name} action is not visible`).toBeVisible();
        await expect(action, `${name} action is not enabled`).toBeEnabled();
        await action.click();
    }

    async expectBulkBarVisible() {
        await expect(this.bulkBar, 'Bulk actions bar is not visible').toBeVisible();
    }

    async expectBulkBarHidden() {
        await expect(this.bulkBar, 'Bulk actions bar should be hidden').not.toBeVisible();
    }

    async openCardMenu(title: string) {
        const card = this.cardByTitle(title);
        await expect(card, `Card "${title}" is not visible`).toBeVisible({ timeout: 15_000 });
        const trigger = card.getByTestId('studio-card-menu-trigger');
        await expect(trigger, `Kebab trigger of card "${title}" is not visible`).toBeVisible();
        await expect(trigger, `Kebab trigger of card "${title}" is not enabled`).toBeEnabled();
        await trigger.click();
        await expect(this.cardMenu, `Kebab menu of card "${title}" did not open`).toBeVisible();
    }

    /** Parameterized: the menu item id is only known at call time. */
    cardMenuItem(item: string): Locator {
        return this.page.getByTestId(`studio-card-menu-${item}`);
    }

    async clickCardMenuItem(item: string) {
        const menuItem = this.cardMenuItem(item);
        await expect(menuItem, `Kebab item "${item}" is not visible`).toBeVisible();
        await expect(menuItem, `Kebab item "${item}" is not enabled`).toBeEnabled();
        await menuItem.click();
    }

    async expectCardMenuItems(expected: string[]) {
        for (const item of expected) {
            await expect(this.cardMenuItem(item), `Kebab item "${item}" is not visible`).toBeVisible();
        }
    }

    async expectCardMenuItemsAbsent(unexpected: string[]) {
        for (const item of unexpected) {
            await expect(this.cardMenuItem(item), `Kebab item "${item}" should not be present`).toHaveCount(0);
        }
    }

    async closeCardMenu() {
        await this.page.keyboard.press('Escape');
        await expect(this.cardMenu, 'Kebab menu did not close').not.toBeVisible();
    }

    // --- Tabs of the redesigned page (each tab drives its own ?type= query param)

    async openAllTab() {
        await expect(this.allTabNew, 'All tab is not visible').toBeVisible();
        await expect(this.allTabNew, 'All tab is not enabled').toBeEnabled();
        await this.allTabNew.click();
    }

    async openMoviesTab() {
        await expect(this.moviesTabNew, 'Movies tab is not visible').toBeVisible();
        await expect(this.moviesTabNew, 'Movies tab is not enabled').toBeEnabled();
        await this.moviesTabNew.click();
    }

    async openSeriesTab() {
        await expect(this.seriesTabNew, 'Series tab is not visible').toBeVisible();
        await expect(this.seriesTabNew, 'Series tab is not enabled').toBeEnabled();
        await this.seriesTabNew.click();
    }

    async openShortsTab() {
        await expect(this.shortsTabNew, 'Shorts tab is not visible').toBeVisible();
        await expect(this.shortsTabNew, 'Shorts tab is not enabled').toBeEnabled();
        await this.shortsTabNew.click();
    }
}