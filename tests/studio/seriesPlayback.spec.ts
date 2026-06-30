import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { setupSeriesWithEpisodes, SeriesSetupResult } from '../../src/utils/studioTestHelpers';
import { assertVideoPlays, seekToEnd } from '../../src/utils/videoPlayerHelper';

test('Series auto-advances to the next episode when an episode finishes', {
    tag: '@critical',
    annotation: { type: 'TC', description: 'SERIES-003' },
}, async ({ page, request }) => {
    test.setTimeout(300_000);
    let series!: SeriesSetupResult;
    const player = new VideoPlayerPage(page);

    await test.step('Create a series with two published episodes via API', async () => {
        series = await setupSeriesWithEpisodes(request, { episodeCount: 2 });
        expect(series.episodes.length, 'Series should have 2 episodes').toBe(2);
    });


    await test.step('Open episode 1 (in series context) and confirm it plays', async () => {
        const ep1 = series.episodes[0];
        await page.goto(`${ep1.watchUrl}?list=${series.seriesId}`, { waitUntil: 'domcontentloaded' });
        await expect(player.videoTitle, 'Episode 1 title is not shown').toContainText('Episode 1');
        await assertVideoPlays(page);
    });

    await test.step('Finish episode 1 → episode 2 auto-advances and plays', async () => {
        const ep2Path = new URL(series.episodes[1].watchUrl).pathname;

        await seekToEnd(page);
        await page.waitForURL((url) => url.pathname === ep2Path, { timeout: 30_000 });
        await page.waitForLoadState('domcontentloaded');

        await expect(player.videoTitle, 'Episode 2 title is not shown after auto-advance').toContainText('Episode 2');
        await assertVideoPlays(page);
    });
});
