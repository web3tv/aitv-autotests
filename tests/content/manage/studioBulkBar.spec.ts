import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { resolveSharedFixture, SharedFixture } from '../../fixtures/sharedFixture';
import { FIXTURE_EPISODE_TITLE, FIXTURE_SERIES_TITLE, FIXTURE_VIDEO_TITLE } from '../../fixtures/videoSeed';

/**
 * Bulk selection bar of the redesigned studio Content page (W3-2815).
 *
 * READ-ONLY: selection is toggled on the shared `@qavischan` fixture and no bulk action
 * is ever submitted. The bar carries no counter, so the selection size is asserted on
 * the cards themselves (`data-selected`).
 */
let fx: SharedFixture;
test.beforeAll(async () => { fx = await resolveSharedFixture(); });

const CONTENT_URL = () => `${process.env.STUDIO_URL}/content`;

test.describe('Studio Content page — bulk selection bar', () => {

    test('Selecting content shows the bulk bar and deselecting hides it', {
        annotation: { type: 'TC', description: 'BULK-001' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleCards.first(), 'Content listing did not load')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('The bulk bar is hidden while nothing is selected', async () => {
            await studioContent.expectBulkBarHidden();
        });

        await test.step('Selecting a card in the grid shows the bulk bar', async () => {
            await studioContent.selectCard(FIXTURE_VIDEO_TITLE);
            await studioContent.expectBulkBarVisible();
            await studioContent.expectSelectedCount(1);
        });

        await test.step('Deselecting the card hides the bulk bar again', async () => {
            await studioContent.deselectCard(FIXTURE_VIDEO_TITLE);
            await studioContent.expectSelectedCount(0);
            await studioContent.expectBulkBarHidden();
        });

        await test.step('Selecting a row in the table view shows the bulk bar', async () => {
            await studioContent.ensureTableView();
            await studioContent.selectRow(FIXTURE_VIDEO_TITLE);
            await studioContent.expectBulkBarVisible();
        });
    });

    test('Select all marks every listed item', {
        annotation: { type: 'TC', description: 'BULK-002' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleCards.first(), 'Content listing did not load')
                .toBeVisible({ timeout: 20_000 });
        });

        let listedCards: number;

        await test.step('Select one card to reveal the bulk bar', async () => {
            listedCards = await studioContent.visibleCards.count();
            expect(listedCards, 'The fixture channel must list some content').toBeGreaterThan(1);

            await studioContent.selectCard(FIXTURE_VIDEO_TITLE);
            await studioContent.expectBulkBarVisible();
        });

        await test.step('The label extends the selection to every card', async () => {
            // The two halves of the control do different things: the label selects all,
            // while the checkbox clears the selection.
            await expect(studioContent.bulkSelectAllLabel, 'Select all label is not visible').toBeVisible();
            await expect(studioContent.bulkSelectAllLabel, 'Select all label is not enabled').toBeEnabled();
            await studioContent.bulkSelectAllLabel.click();

            await studioContent.expectSelectedCount(listedCards);
        });

        await test.step('The checkbox clears the selection', async () => {
            await expect(studioContent.bulkSelectAll, 'Select all checkbox is not visible').toBeVisible();
            await expect(studioContent.bulkSelectAll, 'Select all checkbox is not enabled').toBeEnabled();
            await studioContent.bulkSelectAll.click();

            await studioContent.expectSelectedCount(0);
            await studioContent.expectBulkBarHidden();
        });
    });

    test('Series actions are disabled when the selection contains an episode', {
        annotation: { type: 'TC', description: 'BULK-003' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleCards.first(), 'Content listing did not load')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('Selecting a standalone video keeps every action available', async () => {
            await studioContent.selectCard(FIXTURE_VIDEO_TITLE);

            await expect(studioContent.bulkAddToSeries, 'Add to Series must be enabled for a standalone video')
                .toBeEnabled();
            await expect(studioContent.bulkCreateSeries, 'Create Series must be enabled for a standalone video')
                .toBeEnabled();
        });

        await test.step('Adding an episode to the selection disables the series actions', async () => {
            await studioContent.selectCard(FIXTURE_EPISODE_TITLE);
            await studioContent.expectSelectedCount(2);

            await expect(studioContent.bulkAddToSeries, 'Add to Series must be disabled when an episode is selected')
                .toBeDisabled();
            await expect(studioContent.bulkCreateSeries, 'Create Series must be disabled when an episode is selected')
                .toBeDisabled();
        });

        await test.step('Delete stays available for the mixed selection', async () => {
            await expect(studioContent.bulkDelete, 'Delete must stay enabled for any selection').toBeEnabled();
        });

        await test.step('An episode alone also disables the series actions', async () => {
            await studioContent.deselectCard(FIXTURE_VIDEO_TITLE);
            await studioContent.expectSelectedCount(1);

            await expect(studioContent.bulkAddToSeries, 'Add to Series must be disabled for an episode')
                .toBeDisabled();
            await expect(studioContent.bulkCreateSeries, 'Create Series must be disabled for an episode')
                .toBeDisabled();
        });
    });

    test('Series tab exposes only delete and change visibility', {
        annotation: { type: 'TC', description: 'BULK-005' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Series tab', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleCards.first(), 'Content listing did not load')
                .toBeVisible({ timeout: 20_000 });

            await studioContent.openSeriesTab();
            await studioContent.assertCardVisible(FIXTURE_SERIES_TITLE);
        });

        await test.step('Selecting a series shows the series-specific bulk actions', async () => {
            await studioContent.selectCard(FIXTURE_SERIES_TITLE);
            await studioContent.expectBulkBarVisible();

            await expect(studioContent.seriesBulkDelete, 'Series delete action is not visible').toBeVisible();
            await expect(studioContent.seriesBulkChangeVisibility, 'Series visibility action is not visible')
                .toBeVisible();
        });

        await test.step('Video-only actions are not rendered for series', async () => {
            await expect(studioContent.bulkAddToSeries, 'Add to Series must not render on the Series tab')
                .toHaveCount(0);
            await expect(studioContent.bulkCreateSeries, 'Create Series must not render on the Series tab')
                .toHaveCount(0);
            await expect(studioContent.bulkMore, 'The overflow menu must not render on the Series tab')
                .toHaveCount(0);
        });
    });
});
