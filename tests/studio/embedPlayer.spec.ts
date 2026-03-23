import { test } from '@playwright/test';
import { EmbedPlayerPage } from '../../src/pages/components/EmbedPlayerPage';

test.describe('Embed player — horizontal video', () => {
    test('Embed player plays uploaded video', {
        annotation: [{ type: 'TC', description: 'EMBED-001' }],
    }, async ({ page }) => {
        const videoId = process.env.EMBED_VIDEO_ID!;

        await test.step('Open embed iframe and assert video is playing', async () => {
            const embedPlayer = await EmbedPlayerPage.open(page, videoId);
            await embedPlayer.assertEmbedVideoIsPlaying();
        });
    });

    test('Embed player has audio tracks for dubbed video', {
        annotation: [{ type: 'TC', description: 'EMBED-003' }],
    }, async ({ page }) => {
        const videoId = process.env.EMBED_VIDEO_WITH_DUBBING_ID!;

        await test.step('Open embed iframe and assert audio tracks are available', async () => {
            const embedPlayer = await EmbedPlayerPage.open(page, videoId);
            await embedPlayer.assertAudioTracksAvailable();
        });
    });

    test('Embed player has no hotspots', {
        annotation: [{ type: 'TC', description: 'EMBED-004' }],
    }, async ({ page }) => {
        const videoId = process.env.EMBED_VIDEO_WITH_DUBBING_ID!;

        await test.step('Open embed iframe and assert no hotspots are displayed', async () => {
            const embedPlayer = await EmbedPlayerPage.open(page, videoId);
            await embedPlayer.assertNoHotspots();
        });
    });
});

test.describe('Embed player — vertical short', () => {
    test('Embed player plays uploaded short', {
        annotation: [{ type: 'TC', description: 'EMBED-002' }],
    }, async ({ page }) => {
        const shortId = process.env.EMBED_SHORT_ID!;

        await test.step('Open embed iframe and assert short is playing', async () => {
            const embedPlayer = await EmbedPlayerPage.open(page, shortId, 'short');
            await embedPlayer.assertEmbedVideoIsPlaying();
        });
    });
});
