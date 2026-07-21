import { Page, Locator, Response, expect } from '@playwright/test';

/**
 * Global Search modal (W3-2692). Opened from the header search button; renders as a
 * full-screen MUI dialog overlay (`aitv-search-modal`) with NO route of its own — the
 * query and the active tab are component state, so there are no URL assertions here.
 *
 * The modal uses a 400 ms debounce on typing and, on the All tab, fires up to three
 * parallel `/api/search` calls (videos + shorts + channels). Use `waitForSearchResponse`
 * (registered BEFORE the trigger) to await the request for a specific `type`.
 *
 * Result determinism: the stand carries historical orphan content with duplicate/generic
 * titles, so every result-card lookup is anchored on BOTH the exact title AND the
 * `/@<handle>` channel link inside the card (see `resultCardByTitleAndChannel`).
 */
export class SearchModalPage {
    readonly page: Page;

    /** Header trigger (desktop + mobile share the same testid). */
    readonly trigger: Locator;
    readonly modal: Locator;
    readonly input: Locator;
    readonly clearBtn: Locator;
    readonly closeBtn: Locator;

    // Tabs
    readonly tabs: Locator;
    readonly tabAll: Locator;
    readonly tabMovies: Locator;
    readonly tabSeries: Locator;
    readonly tabShorts: Locator;
    readonly tabChannels: Locator;

    // Result grids + cards
    readonly resultsGrid: Locator;
    readonly resultCards: Locator;
    readonly shortsGrid: Locator;
    readonly shortCards: Locator;
    readonly channelsGrid: Locator;
    readonly channelCards: Locator;

    // States
    readonly emptyState: Locator;
    readonly resetBtn: Locator;
    readonly errorState: Locator;
    readonly retryBtn: Locator;

    // Section headings (empty-state recommendations + query sections)
    readonly recentlyAddedHeading: Locator;
    readonly shortsHeading: Locator;
    readonly continueWatchingHeading: Locator;
    readonly moviesOrSeriesHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        this.trigger = page.getByTestId('aitv-search-open');
        this.modal = page.getByTestId('aitv-search-modal');
        this.input = page.getByTestId('aitv-search-input');
        this.clearBtn = page.getByTestId('aitv-search-input-clear');
        this.closeBtn = page.getByTestId('aitv-search-close');

        this.tabs = page.getByTestId('aitv-search-tabs');
        this.tabAll = page.getByTestId('aitv-search-tab-all');
        this.tabMovies = page.getByTestId('aitv-search-tab-movies');
        this.tabSeries = page.getByTestId('aitv-search-tab-series');
        this.tabShorts = page.getByTestId('aitv-search-tab-shorts');
        this.tabChannels = page.getByTestId('aitv-search-tab-channels');

        this.resultsGrid = page.getByTestId('aitv-search-results-grid');
        this.resultCards = page.getByTestId('aitv-search-result-card');
        this.shortsGrid = page.getByTestId('aitv-search-shorts-grid');
        this.shortCards = page.getByTestId('aitv-search-short-card');
        this.channelsGrid = page.getByTestId('aitv-search-channels-grid');
        this.channelCards = page.getByTestId('aitv-search-channel-card');

        this.emptyState = page.getByTestId('aitv-search-empty');
        this.resetBtn = page.getByTestId('aitv-search-reset');
        this.errorState = page.getByTestId('aitv-search-error');
        this.retryBtn = page.getByTestId('aitv-search-retry');

        // The section headings carry no testid and render as <p>. Anchor on a <p> with
        // exact text (anchored regex) — a plain exact-text match would also hit the tab
        // buttons, e.g. the "Shorts" tab collides with the "Shorts" section heading.
        this.recentlyAddedHeading = this.modal.locator('p').filter({ hasText: /^Recently added$/ });
        this.shortsHeading = this.modal.locator('p').filter({ hasText: /^Shorts$/ });
        this.continueWatchingHeading = this.modal.locator('p').filter({ hasText: /^Continue watching$/ });
        this.moviesOrSeriesHeading = this.modal.locator('p').filter({ hasText: /^Movies or series$/ });
    }

    /** Opens the modal via the header trigger and waits for it to be visible + input focused. */
    async open(): Promise<void> {
        await expect(this.trigger, 'Search trigger is not visible').toBeVisible({ timeout: 15_000 });
        await expect(this.trigger, 'Search trigger is not enabled').toBeEnabled();
        await this.trigger.click();
        await expect(this.modal, 'Search modal did not open').toBeVisible();
        await expect(this.input, 'Search input is not visible').toBeVisible();
    }

    /** Closes via the close button and waits for the modal to unmount. */
    async close(): Promise<void> {
        await expect(this.closeBtn, 'Search close button is not visible').toBeVisible();
        await expect(this.closeBtn, 'Search close button is not enabled').toBeEnabled();
        await this.closeBtn.click();
        await expect(this.modal, 'Search modal did not close').toBeHidden();
    }

    /** Closes via the Escape key and waits for the modal to unmount. */
    async closeViaEscape(): Promise<void> {
        await expect(this.modal, 'Search modal is not open to close').toBeVisible();
        await this.page.keyboard.press('Escape');
        await expect(this.modal, 'Search modal did not close on Escape').toBeHidden();
    }

    /** Types a query into the (debounced) input. Register `waitForSearchResponse` BEFORE calling. */
    async typeQuery(query: string): Promise<void> {
        await expect(this.input, 'Search input is not visible').toBeVisible();
        await expect(this.input, 'Search input is not enabled').toBeEnabled();
        await this.input.fill(query);
    }

    /** Clears the query via the clear button. */
    async clearQuery(): Promise<void> {
        await expect(this.clearBtn, 'Search clear button is not visible').toBeVisible();
        await expect(this.clearBtn, 'Search clear button is not enabled').toBeEnabled();
        await this.clearBtn.click();
    }

    /** Selects a result tab by name (reuses the constructor tab locators). */
    async selectTab(tab: 'all' | 'movies' | 'series' | 'shorts' | 'channels'): Promise<void> {
        const locator = {
            all: this.tabAll,
            movies: this.tabMovies,
            series: this.tabSeries,
            shorts: this.tabShorts,
            channels: this.tabChannels,
        }[tab];
        await expect(locator, `Search tab "${tab}" is not visible`).toBeVisible();
        await expect(locator, `Search tab "${tab}" is not enabled`).toBeEnabled();
        await locator.click();
    }

    /** Clicks the "Reset Search" button shown in the no-results state. */
    async clickReset(): Promise<void> {
        await expect(this.resetBtn, 'Reset Search button is not visible').toBeVisible();
        await expect(this.resetBtn, 'Reset Search button is not enabled').toBeEnabled();
        await this.resetBtn.click();
    }

    /**
     * Video result card(s) anchored on BOTH the exact title AND the `/@handle` channel
     * link inside the card — deterministic against the stand's duplicate-title orphans.
     * NOTE: the fixture intentionally seeds several public videos with the same title
     * (channel-grid population), so this can resolve to MORE THAN ONE card — use
     * `.first()` when asserting a single card.
     */
    resultCardByTitleAndChannel(title: string, handle: string): Locator {
        return this.resultCards
            .filter({ hasText: title })
            .filter({ has: this.page.locator(`a[href="/@${handle}"]`) });
    }

    /** Any video result card belonging to the given channel (its `/@handle` link). */
    resultCardByChannel(handle: string): Locator {
        return this.resultCards.filter({ has: this.page.locator(`a[href="/@${handle}"]`) });
    }

    /** A short result card anchored on exact title + channel link. */
    shortCardByTitleAndChannel(title: string, handle: string): Locator {
        return this.shortCards
            .filter({ hasText: title })
            .filter({ has: this.page.locator(`a[href="/@${handle}"]`) });
    }

    /**
     * The channel result card for a handle. The channel card is itself the `<a>` linking
     * to `/@handle` (not a container with a nested link), so match the card element that
     * also carries that href via `.and()`.
     */
    channelCardByHandle(handle: string): Locator {
        return this.channelCards.and(this.page.locator(`[href="/@${handle}"]`));
    }

    /**
     * Returns a promise that resolves when a `/api/search` call for the given `type`
     * completes with 200. Register it BEFORE the action that triggers the request
     * (typing / tab switch), then await it after.
     */
    waitForSearchResponse(type: 'videos' | 'shorts' | 'channels', timeout = 15_000): Promise<Response> {
        return this.page.waitForResponse(
            (r) =>
                r.url().includes('/api/search') &&
                r.url().includes(`type=${type}`) &&
                r.status() === 200,
            { timeout },
        );
    }
}
