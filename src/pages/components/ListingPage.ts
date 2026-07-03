import { Page, Locator, expect } from '@playwright/test';


/**
 * Listing pages (/movies, /series, /shorts) — new homepage-like layout with a
 * category/genre selector bar (W3-2669).
 *
 * The selector bar holds two dropdowns: the category one ("All Movies" /
 * "All Series" / "All Shorts") and the "Genres" one. On /shorts the category
 * dropdown is disabled (single category), so only "Genres" can be opened there.
 *
 * The open dropdown renders differently per breakpoint: a MUI Menu popover on
 * desktop and a bottom-sheet MUI Drawer on mobile. Both are portalled to <body>
 * as a `MuiModal-root`; the closed one stays mounted with `MuiModal-hidden`.
 */
export class ListingPage {
    readonly page: Page;

    readonly listingSelectorBar: Locator;
    readonly categoryDropdownTrigger: Locator;
    readonly genresDropdownTrigger: Locator;
    readonly dropdownMenu: Locator;

    constructor(page: Page) {
        this.page = page;

        this.listingSelectorBar = page.locator('[data-id="aitv-listing-selector-bar"]');
        // The bar holds two listbox triggers with no data-id: the category one
        // (label varies per page: "All Movies"/"All Series"/"All Shorts") and the
        // "Genres" one. Genres is matched by its stable accessible name so a
        // reordering fails loudly; the category one is the remaining first trigger.
        this.genresDropdownTrigger = this.listingSelectorBar.getByRole('button', { name: 'Genres' });
        this.categoryDropdownTrigger = this.listingSelectorBar
            .locator('button[aria-haspopup="listbox"]')
            .first();
        // The currently open dropdown surface — a Menu paper on desktop or a
        // Drawer paper on mobile (the closed one keeps `MuiModal-hidden`).
        this.dropdownMenu = page.locator(
            '.MuiModal-root:not(.MuiModal-hidden) .MuiMenu-paper, '
            + '.MuiModal-root:not(.MuiModal-hidden) .MuiDrawer-paper',
        );
    }

    /**
     * Open a listing page and wait until the selector bar is rendered.
     * We intentionally do NOT wait for `networkidle`: these pages autoplay video
     * previews (hero + shorts grid) that keep the network busy, and all dynamic
     * media is hidden before the screenshot anyway.
     */
    async open(path: string): Promise<void> {
        await this.page.goto(path, { waitUntil: 'domcontentloaded' });
        await expect(this.listingSelectorBar, 'Listing selector bar is not visible').toBeVisible();
        await this.page.evaluate(async () => { await document.fonts.ready; });
    }

    async openCategoryDropdown(): Promise<void> {
        await this.openDropdown(this.categoryDropdownTrigger, 'Category');
    }

    async openGenresDropdown(): Promise<void> {
        await this.openDropdown(this.genresDropdownTrigger, 'Genres');
    }

    /**
     * Click a dropdown trigger and wait until its menu is open. The listing
     * pages keep hydrating (autoplay grid), which can swallow the first click,
     * so retry the click until `aria-expanded` flips and the menu is visible.
     */
    private async openDropdown(trigger: Locator, name: string): Promise<void> {
        await expect(trigger, `${name} dropdown trigger is not visible`).toBeVisible();
        await expect(trigger, `${name} dropdown trigger is not enabled`).toBeEnabled();
        await expect(async () => {
            if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
                await trigger.click();
            }
            await expect(this.dropdownMenu, `${name} dropdown menu did not open`).toBeVisible({ timeout: 2000 });
        }).toPass({ timeout: 15000 });
    }

    async assertCategoryDropdownDisabled(): Promise<void> {
        await expect(this.categoryDropdownTrigger, 'Category dropdown trigger is not visible').toBeVisible();
        await expect(this.categoryDropdownTrigger, 'Category dropdown trigger should be disabled').toBeDisabled();
    }

    /**
     * Hide dynamic hero + card content so screenshots are deterministic. Hero
     * text is hidden (not Playwright-masked) so no overlay box is painted — on
     * mobile the dropdown opens as a bottom sheet over the hero, and a mask box
     * would cover the very menu we want to capture.
     */
    async hideHeroAndCardMedia(): Promise<void> {
        await this.page.addStyleTag({
            content: `
                [data-id="aitv-hero"] img,
                [data-id="aitv-hero"] video,
                [data-id="aitv-hero"] .MuiTypography-root,
                [data-id="aitv-top-card"] img,
                [data-id="aitv-video-card"] img { visibility: hidden !important; }
            `,
        });
    }

    /**
     * Hide the whole shorts grid cards. Hiding just the thumbnail image is not
     * enough: once the poster image is hidden the short starts autoplaying its
     * video, so the entire `aitv-short-card` container must be hidden to keep
     * the screenshot deterministic.
     */
    async hideShortsMedia(): Promise<void> {
        await this.page.addStyleTag({
            content: `
                [data-id="aitv-short-card"] { visibility: hidden !important; }
            `,
        });
    }
}
