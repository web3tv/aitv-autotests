import { test, expect } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { resolveSharedFixture, SharedFixture } from '../../fixtures/sharedFixture';
import {
    FIXTURE_SERIES_TITLE,
    FIXTURE_SHORT_TITLE,
    FIXTURE_VIDEO_TITLE,
} from '../../fixtures/videoSeed';

/**
 * Redesigned studio Content page (W3-2815): view toggle, tabs and empty states.
 *
 * READ-ONLY except STUDIO-023: the fixture owner's content is only listed and
 * filtered, never mutated. Grid and table markup are BOTH mounted at all times (the
 * toggle just flips CSS), so every assertion goes through the visibility-filtered
 * collections of StudioContentPage.
 */
let fx: SharedFixture;
test.beforeAll(async () => { fx = await resolveSharedFixture(); });

const CONTENT_URL = () => `${process.env.STUDIO_URL}/content`;

test.describe('Studio Content page — view modes and tabs', () => {

    test('Grid and table toggle swap the visible listing', {
        annotation: { type: 'TC', description: 'STUDIO-020' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
        });

        await test.step('Grid is the default view', async () => {
            await expect(studioContent.visibleCards.first(), 'Grid cards are not visible by default')
                .toBeVisible({ timeout: 20_000 });
            await expect(studioContent.visibleRows, 'Table rows must be hidden in the grid view')
                .toHaveCount(0);
        });

        await test.step('Switch to the table view', async () => {
            await expect(studioContent.tableViewButton, 'Table view toggle is not visible').toBeVisible();
            await expect(studioContent.tableViewButton, 'Table view toggle is not enabled').toBeEnabled();
            await studioContent.tableViewButton.click();

            await expect(studioContent.visibleRows.first(), 'Table rows are not visible after switching')
                .toBeVisible({ timeout: 15_000 });
            await expect(studioContent.visibleCards, 'Grid cards must be hidden in the table view')
                .toHaveCount(0);
            await expect(page, 'Table view is not reflected in the URL').toHaveURL(/view=table/);
        });

        await test.step('Switch back to the grid view', async () => {
            await studioContent.ensureGridView();
            await expect(studioContent.visibleRows, 'Table rows must be hidden again').toHaveCount(0);
            await expect(page, 'Grid view is not reflected in the URL').toHaveURL(/view=grid/);
        });
    });

    test('Selected view mode survives a reload and a fresh navigation', {
        annotation: { type: 'TC', description: 'STUDIO-021' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and switch to the table view', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });

            await expect(studioContent.tableViewButton, 'Table view toggle is not visible')
                .toBeVisible({ timeout: 20_000 });
            await expect(studioContent.tableViewButton, 'Table view toggle is not enabled').toBeEnabled();
            await studioContent.tableViewButton.click();
            await expect(studioContent.visibleRows.first(), 'Table rows are not visible').toBeVisible({ timeout: 15_000 });
        });

        await test.step('View mode is persisted to local storage', async () => {
            const stored = await page.evaluate(() => localStorage.getItem('aitv-studio-content-view'));
            expect(stored, 'View mode is not stored in local storage').toBe('table');
        });

        await test.step('Reload keeps the table view', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleRows.first(), 'Table view is lost after reload')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('Opening the page without the view param keeps the table view', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleRows.first(), 'Stored view mode is not restored')
                .toBeVisible({ timeout: 20_000 });
            await expect(studioContent.visibleCards, 'Grid cards must stay hidden').toHaveCount(0);
        });
    });

    test('Tabs filter the listing by content type', {
        annotation: { type: 'TC', description: 'STUDIO-022' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleCards.first(), 'Content listing did not load')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('Movies tab lists videos without the short', async () => {
            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 20_000 }
            );
            await studioContent.openMoviesTab();
            await responsePromise;

            await studioContent.assertCardVisible(FIXTURE_VIDEO_TITLE);
            await studioContent.assertCardAbsent(FIXTURE_SHORT_TITLE);
            await expect(page, 'Movies tab does not set the type query param').toHaveURL(/type=video/);
        });

        await test.step('Shorts tab lists the short only', async () => {
            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 20_000 }
            );
            await studioContent.openShortsTab();
            await responsePromise;

            await studioContent.assertCardVisible(FIXTURE_SHORT_TITLE);
            await studioContent.assertCardAbsent(FIXTURE_VIDEO_TITLE);
        });

        await test.step('Series tab lists the seeded series', async () => {
            // No response wait here: the series query is served from the react-query cache
            // when it was already fetched, so the listing is the only reliable signal.
            await studioContent.openSeriesTab();

            await studioContent.assertCardVisible(FIXTURE_SERIES_TITLE);
            await expect(page, 'Series tab does not set the type query param').toHaveURL(/type=playlist/);
        });

        await test.step('All tab lists videos, shorts and episodes together', async () => {
            // Returning to a previously visited tab is served from the react-query cache,
            // so no request is fired — the listing itself is the signal.
            await studioContent.openAllTab();

            await studioContent.assertCardVisible(FIXTURE_VIDEO_TITLE);
            await studioContent.assertCardVisible(FIXTURE_SHORT_TITLE);
        });
    });

    test('Series tab hides the filter control', {
        annotation: { type: 'TC', description: 'STUDIO-024' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.filterButton, 'Filter button is not visible on the All tab')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('Filter is gone on the Series tab while sort and search stay', async () => {
            await studioContent.openSeriesTab();
            await studioContent.assertCardVisible(FIXTURE_SERIES_TITLE);

            await expect(studioContent.filterButton, 'Filter button must not render on the Series tab')
                .toHaveCount(0);
            await expect(studioContent.sortButton, 'Sort button is not visible on the Series tab').toBeVisible();
            await expect(studioContent.searchInput, 'Search input is not visible on the Series tab').toBeVisible();
        });
    });

    test('Search with no matches shows the reset-filters state', {
        annotation: { type: 'TC', description: 'STUDIO-025' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleCards.first(), 'Content listing did not load')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('Search for a title that does not exist', async () => {
            const responsePromise = page.waitForResponse(
                r => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
                { timeout: 20_000 }
            );
            await studioContent.searchByText('zzzqqqnotexistingtitle123');
            await responsePromise;

            await expect(studioContent.noFilterResults, 'No-results state is not shown')
                .toBeVisible({ timeout: 15_000 });
            await expect(studioContent.visibleCards, 'No cards should be listed').toHaveCount(0);
            await expect(studioContent.emptyState, 'The empty-channel state must not be used for a filtered listing')
                .toHaveCount(0);
        });

        await test.step('Reset filters restores the listing', async () => {
            await expect(studioContent.resetFiltersButton, 'Reset filters button is not visible').toBeVisible();
            await expect(studioContent.resetFiltersButton, 'Reset filters button is not enabled').toBeEnabled();
            await studioContent.resetFiltersButton.click();

            await expect(studioContent.visibleCards.first(), 'Listing is not restored after reset')
                .toBeVisible({ timeout: 20_000 });
            await expect(studioContent.noFilterResults, 'No-results state should be gone').not.toBeVisible();
        });
    });

    test('Channel without content shows the empty state and disabled toolbar', {
        annotation: { type: 'TC', description: 'STUDIO-023' },
    }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const password = process.env.USER_PASSWORD!;

        await test.step('Create a fresh user with no uploads and log in', async () => {
            const user = await authApi.createUserFast();
            await authFlow.loginSuccess(user.email, password, user.username);
        });

        await test.step('Content page shows the empty state', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });

            await expect(studioContent.emptyState, 'Empty state is not visible')
                .toBeVisible({ timeout: 20_000 });
            await expect(studioContent.emptyUploadButton, 'Empty-state upload button is not visible').toBeVisible();
            await expect(studioContent.visibleCards, 'No cards should be listed for an empty channel')
                .toHaveCount(0);
        });

        await test.step('The empty state offers upload as the only next step', async () => {
            await expect(studioContent.emptyUploadButton, 'Empty-state upload button is not enabled').toBeEnabled();
            await expect(studioContent.bulkBar, 'The bulk bar must stay hidden on an empty listing')
                .not.toBeVisible();
        });
    });
});
