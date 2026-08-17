import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { resolveSharedFixture, SharedFixture } from '../../fixtures/sharedFixture';
import {
    FIXTURE_EPISODE_TITLE,
    FIXTURE_SERIES_TITLE,
    FIXTURE_SHORT_TITLE,
    FIXTURE_VIDEO_TITLE,
} from '../../fixtures/videoSeed';

/**
 * Per-item kebab menu of the redesigned studio Content page (W3-2815).
 *
 * READ-ONLY: menus are opened on the shared `@qavischan` fixture and closed with Escape;
 * no menu action is ever executed.
 */
let fx: SharedFixture;
test.beforeAll(async () => { fx = await resolveSharedFixture(); });

const CONTENT_URL = () => `${process.env.STUDIO_URL}/content`;

test.describe('Studio Content page — item kebab menu', () => {

    test('Kebab items differ per content type', {
        annotation: { type: 'TC', description: 'STUDIO-028' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleCards.first(), 'Content listing did not load')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('A standalone video offers the full action set', async () => {
            await studioContent.openCardMenu(FIXTURE_VIDEO_TITLE);
            await studioContent.expectCardMenuItems([
                'add-to-series',
                'copy-link',
                'copy-embed-code',
                'analytics',
                'change-visibility',
                'delete',
            ]);
            await studioContent.closeCardMenu();
        });

        await test.step('An episode cannot be added to a series', async () => {
            await studioContent.openCardMenu(FIXTURE_EPISODE_TITLE);
            await studioContent.expectCardMenuItems(['copy-link', 'change-visibility', 'delete']);
            await studioContent.expectCardMenuItemsAbsent(['add-to-series']);
            await studioContent.closeCardMenu();
        });

        await test.step('A short has neither series nor analytics actions', async () => {
            await studioContent.openCardMenu(FIXTURE_SHORT_TITLE);
            await studioContent.expectCardMenuItems(['copy-link', 'copy-embed-code', 'change-visibility', 'delete']);
            await studioContent.expectCardMenuItemsAbsent(['add-to-series']);
            await studioContent.closeCardMenu();
        });
    });

    test('Manage episodes is offered but not actionable from the kebab', {
        annotation: { type: 'TC', description: 'STUDIO-029' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Content page', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await expect(studioContent.visibleCards.first(), 'Content listing did not load')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('The episode kebab renders Manage Episodes as disabled', async () => {
            await studioContent.openCardMenu(FIXTURE_EPISODE_TITLE);

            const manageEpisodes = studioContent.cardMenuItem('manage-episodes');
            await expect(manageEpisodes, 'Manage Episodes item is not visible').toBeVisible();
            await expect(manageEpisodes, 'Manage Episodes is expected to be disabled')
                .toHaveAttribute('aria-disabled', 'true');

            await studioContent.closeCardMenu();
        });
    });

    test('Series row links through to its episodes page', {
        annotation: { type: 'TC', description: 'STUDIO-030' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);

        await test.step('Login as the fixture owner and open the Series tab in the table view', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(`${CONTENT_URL()}?type=playlist&view=table`, { waitUntil: 'domcontentloaded' });

            await expect(studioContent.playlistRows.first(), 'Series rows did not load')
                .toBeVisible({ timeout: 20_000 });
        });

        await test.step('The Content link opens the playlist videos page', async () => {
            const seriesRow = studioContent.playlistRows.filter({ hasText: FIXTURE_SERIES_TITLE }).first();
            await expect(seriesRow, `Series row "${FIXTURE_SERIES_TITLE}" is not visible`).toBeVisible();

            const contentLink = seriesRow.getByRole('link', { name: 'Content' });
            await expect(contentLink, 'Series Content link is not visible').toBeVisible();
            await contentLink.click();

            await expect(page, 'Series episodes page did not open')
                .toHaveURL(new RegExp(`/content/playlist/${fx.seriesId}/[^/]+/videos`), { timeout: 20_000 });
        });
    });
});
