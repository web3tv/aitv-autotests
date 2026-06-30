import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { ContentCreationFlow } from '../../src/flows/ContentCreationFlow';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';

const LANDSCAPE_VIDEO = 'test-data/fixtures/video/5secVideo.mp4';

/**
 * Stateful, serial suite: the second test adds an episode to the series created
 * by the first test, so both steps must run as the SAME creator, in order.
 */
test.describe.serial('Series creation flow', () => {
    let user: { email: string; username: string };
    let seriesName: string;

    test.beforeEach(async ({ page, request }) => {
        if (!user) user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    test('Create a new Series with its first episode', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'SERIES-001' },
    }, async ({ page }) => {
        test.setTimeout(240_000);

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
        });
    });

    test('Add a new Episode to an existing Series', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'SERIES-002' },
    }, async ({ page }) => {
        test.setTimeout(240_000);
        test.skip(!seriesName, 'SERIES-001 must run first — parent series name is not set');

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
        });
    });
});
