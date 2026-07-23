import { test, expect } from '@playwright/test';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { assertVideoPlays, seekToEnd } from '../../src/utils/videoPlayerHelper';
import { resolveSharedFixture, SharedFixture } from '../fixtures/sharedFixture';

// READ-ONLY: uses the pre-seeded series on the shared `@qavischan` fixture (3 episodes)
// instead of uploading + processing episodes per run — previously the single most
// expensive setup. Content resolved at runtime (env-agnostic); re-seed if missing.
let fx: SharedFixture;
test.beforeAll(async () => { fx = await resolveSharedFixture(); });

test('Series auto-advances to the next episode when an episode finishes', {
    tag: '@critical',
    annotation: { type: 'TC', description: 'SERIES-003' },
}, async ({ page }) => {
    const player = new VideoPlayerPage(page);

    await test.step('Open episode 1 (in series context) and confirm it plays', async () => {
        await page.goto(`${fx.episodeUrls[0]}?list=${fx.seriesId}`, { waitUntil: 'domcontentloaded' });
        await expect(player.videoTitle, 'Episode 1 title is not shown').toContainText('Episode 1');
        await assertVideoPlays(page);
    });

    await test.step('Finish episode 1 → episode 2 auto-advances and plays', async () => {
        const ep2Path = new URL(fx.episodeUrls[1]).pathname;

        await seekToEnd(page);
        await page.waitForURL((url) => url.pathname === ep2Path, { timeout: 30_000 });
        await page.waitForLoadState('domcontentloaded');

        await expect(player.videoTitle, 'Episode 2 title is not shown after auto-advance').toContainText('Episode 2');
        await assertVideoPlays(page);
    });
});

test('Selecting an episode in the under-player episodes popup switches playback to it', {
    annotation: { type: 'TC', description: 'SERIES-004' },
}, async ({ page }) => {
    const player = new VideoPlayerPage(page);
    // The player redesign (W3-2794) removed the in-player Episodes panel; episodes are now
    // switched from the "Episode X / Y" selector in the series row UNDER the player, which
    // opens a popup. Robustness against the ~5s episodes auto-advancing mid-interaction
    // comes from the test DESIGN, not from pausing: we click a NON-adjacent episode (3) and
    // assert the exact destination (episodeUrls[2]). Even if episode 1 auto-advances to 2
    // while the popup is being opened, clicking item 3 still lands on episode 3 — so the
    // click, not auto-advance, is what's being verified. (`autoplay=false` is a best-effort
    // hint and is NOT relied on: the site player may ignore it and start playing.)
    const targetEpisode = 3;
    const targetPath = new URL(fx.episodeUrls[targetEpisode - 1]).pathname;

    await test.step('Open episode 1 in series context', async () => {
        await page.goto(`${fx.episodeUrls[0]}?list=${fx.seriesId}&autoplay=false`, { waitUntil: 'domcontentloaded' });
        await expect(player.videoTitle, 'Episode 1 title is not shown').toContainText('Episode 1');
    });

    await test.step('Open the episodes popup from the series row under the player', async () => {
        await player.openEpisodesPopup();
    });

    await test.step(`Select episode ${targetEpisode} → player navigates to it and plays`, async () => {
        await player.selectEpisodeFromPopup(targetEpisode);
        await page.waitForURL((url) => url.pathname === targetPath, { timeout: 30_000 });
        await page.waitForLoadState('domcontentloaded');

        await expect(player.videoTitle, `Episode ${targetEpisode} title is not shown after switch`)
            .toContainText(`Episode ${targetEpisode}`);
        await assertVideoPlays(page);
    });
});

test('"Next episode" pill under the player navigates to the next episode', {
    annotation: { type: 'TC', description: 'SERIES-005' },
}, async ({ page }) => {
    const player = new VideoPlayerPage(page);
    const ep2Path = new URL(fx.episodeUrls[1]).pathname;

    await test.step('Open episode 1 in series context and hold playback paused', async () => {
        await page.goto(`${fx.episodeUrls[0]}?list=${fx.seriesId}&autoplay=false`, { waitUntil: 'domcontentloaded' });
        await expect(player.videoTitle, 'Episode 1 title is not shown').toContainText('Episode 1');
        // Pin playback so the ~5s episode can't auto-advance before the pill is clicked —
        // unlike SERIES-004 there is no non-adjacent target here (the pill always points at
        // the IMMEDIATE next episode, which is exactly where auto-advance would also land).
        await player.holdPaused();
    });

    await test.step('Click the "next episode" pill → navigates to episode 2', async () => {
        await expect(player.seriesNextEpisodePill, '"Next episode" pill is not visible').toBeVisible({ timeout: 10_000 });
        await expect(player.seriesNextEpisodePill, '"Next episode" pill is not enabled').toBeEnabled();
        await player.seriesNextEpisodePill.click();
        await page.waitForURL((url) => url.pathname === ep2Path, { timeout: 30_000 });
        await page.waitForLoadState('domcontentloaded');

        await expect(player.videoTitle, 'Episode 2 title is not shown after clicking the pill').toContainText('Episode 2');
        await assertVideoPlays(page);
    });
});

test('Episode selector shows the "Episode X / Y" counter for the current episode', {
    annotation: { type: 'TC', description: 'SERIES-006' },
}, async ({ page }) => {
    const player = new VideoPlayerPage(page);
    const totalEpisodes = fx.episodeUrls.length;

    await test.step('Open episode 1 in series context → counter reads "Episode 1 / N"', async () => {
        await page.goto(`${fx.episodeUrls[0]}?list=${fx.seriesId}&autoplay=false`, { waitUntil: 'domcontentloaded' });
        await player.holdPaused();
        await expect(player.seriesEpisodeSelectorBtn, 'Episode 1 counter is wrong')
            .toContainText(`Episode 1 / ${totalEpisodes}`, { timeout: 10_000 });
    });

    await test.step('Open episode 2 in series context → counter reads "Episode 2 / N"', async () => {
        await page.goto(`${fx.episodeUrls[1]}?list=${fx.seriesId}&autoplay=false`, { waitUntil: 'domcontentloaded' });
        await player.holdPaused();
        await expect(player.seriesEpisodeSelectorBtn, 'Episode 2 counter is wrong')
            .toContainText(`Episode 2 / ${totalEpisodes}`, { timeout: 10_000 });
    });
});
