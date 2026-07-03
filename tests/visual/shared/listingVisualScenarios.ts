import { test, expect } from '@playwright/test';
import { ListingPage } from '../../../src/pages/components/ListingPage';

/**
 * Registers the listing-page visual tests (movies / series / shorts with the
 * dropdown open). Called by the desktop and mobile spec entry points with their
 * TC-id prefix. Screenshot names are identical across projects — Playwright
 * suffixes each baseline per project — so desktop and mobile share these bodies.
 *
 * This file is NOT a `*.spec.ts`, so no Playwright project collects it directly.
 */
export function registerListingVisualTests(idPrefix: string): void {

    // ── Movies ──

    test('Movies page with category dropdown open', {
        annotation: { type: 'TC', description: `${idPrefix}-001` },
    }, async ({ page }) => {
        const listingPage = new ListingPage(page);

        await test.step('Open movies page', async () => {
            await listingPage.open('/movies');
        });

        await test.step('Hide dynamic media', async () => {
            await listingPage.hideHeroAndCardMedia();
        });

        await test.step('Open category dropdown and take screenshot', async () => {
            await listingPage.openCategoryDropdown();
            await expect(page).toHaveScreenshot('listing-movies-category-open.png', {
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    // ── Series ──

    test('Series page with category dropdown open', {
        annotation: { type: 'TC', description: `${idPrefix}-002` },
    }, async ({ page }) => {
        const listingPage = new ListingPage(page);

        await test.step('Open series page', async () => {
            await listingPage.open('/series');
        });

        await test.step('Hide dynamic media', async () => {
            await listingPage.hideHeroAndCardMedia();
        });

        await test.step('Open category dropdown and take screenshot', async () => {
            await listingPage.openCategoryDropdown();
            await expect(page).toHaveScreenshot('listing-series-category-open.png', {
                maxDiffPixelRatio: 0.02,
            });
        });
    });

    // ── Shorts ──

    test('Shorts page with genres dropdown open', {
        annotation: { type: 'TC', description: `${idPrefix}-003` },
    }, async ({ page }) => {
        const listingPage = new ListingPage(page);

        await test.step('Open shorts page', async () => {
            await listingPage.open('/shorts');
        });

        await test.step('Assert category dropdown is disabled', async () => {
            await listingPage.assertCategoryDropdownDisabled();
        });

        await test.step('Hide dynamic media', async () => {
            await listingPage.hideShortsMedia();
        });

        await test.step('Open genres dropdown and take screenshot', async () => {
            await listingPage.openGenresDropdown();
            await expect(page).toHaveScreenshot('listing-shorts-genres-open.png', {
                maxDiffPixelRatio: 0.02,
            });
        });
    });
}
