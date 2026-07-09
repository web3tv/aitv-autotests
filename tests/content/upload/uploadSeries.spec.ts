import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AuthApi } from '../../../src/api/AuthApi';
import { ContentCreationFlow } from '../../../src/flows/ContentCreationFlow';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { setupSeriesWithEpisodes } from '../../../src/utils/studioTestHelpers';

const LANDSCAPE_VIDEO = 'test-data/fixtures/video/5secVideo.mp4';

/** Opens Studio → Content → Series tab and asserts the series is listed. */
async function assertSeriesOnSeriesTab(page: import('@playwright/test').Page, seriesName: string) {
    const content = new StudioContentPage(page);
    const responsePromise = page.waitForResponse(
        (r) => r.url().includes('studio-videos') && r.status() === 200,
        { timeout: 20_000 },
    );
    await page.goto(`${process.env.STUDIO_URL}/content`, { waitUntil: 'domcontentloaded' });
    await responsePromise;
    await content.clickSeriesTab();
    await expect(
        page.getByRole('link', { name: seriesName }),
        `Series "${seriesName}" is not visible on the Series tab`,
    ).toBeVisible({ timeout: 15_000 });
}

// Independent tests: each creates its own user; SERIES-002 seeds its parent
// series via API instead of depending on SERIES-001 (no serial chain, no
// silent skip when the first test fails).
test.describe('Series creation flow', () => {

    test('Create a new Series with its first episode', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'SERIES-001' },
    }, async ({ page, request }) => {
        test.setTimeout(240_000);
        let seriesName: string;

        await test.step('Create user and login', async () => {
            const user = await new AuthApi(request).createUserFast();
            await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
        });

        await test.step('Create a new Series (New Series mode)', async () => {
            const flow = new ContentCreationFlow(page);
            seriesName = await flow.createNewSeries({
                filePath: LANDSCAPE_VIDEO,
                seriesName: `QA Series ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                episodeTitle: 'Pilot',
                visibility: 'public',
            });
            await flow.modal.closeSuccess();
        });

        await test.step('Verify the Series appears on the Series tab', async () => {
            await assertSeriesOnSeriesTab(page, seriesName);
        });
    });

    test('Add a new Episode to an existing Series', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'SERIES-002' },
    }, async ({ page, request }) => {
        test.setTimeout(240_000);
        let seriesName: string;

        await test.step('Seed a parent Series via API and login as its owner', async () => {
            const seeded = await setupSeriesWithEpisodes(request, {
                episodeCount: 1,
                filePath: LANDSCAPE_VIDEO,
                seriesTitle: `QA Series ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            });
            seriesName = seeded.seriesTitle;
            await new AuthFlow(page).loginSuccess(seeded.user.email, process.env.USER_PASSWORD!, seeded.user.username);
        });

        await test.step('Add a new Episode under the existing Series', async () => {
            const flow = new ContentCreationFlow(page);
            await flow.createSeriesEpisode({
                filePath: LANDSCAPE_VIDEO,
                parentSeriesName: seriesName,
                episodeTitle: 'Episode Two',
                visibility: 'public',
            });
            await flow.modal.closeSuccess();
        });

        await test.step('Verify the Series still appears on the Series tab', async () => {
            await assertSeriesOnSeriesTab(page, seriesName);
        });
    });
});
