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
