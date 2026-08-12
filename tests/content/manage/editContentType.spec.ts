import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { VideoApi } from '../../../src/api/VideoApi';
import { ContentCreationFlow } from '../../../src/flows/ContentCreationFlow';
import { setupVideoViaApi, setupSeriesWithEpisodes } from '../../../src/utils/studioTestHelpers';

// Regression for W3-2906: saving the studio edit form used to drop the series
// binding (the FE didn't send seriesId in edit mode and the BE's `seriesProvided`
// flag was never true), so an episode's content type silently flipped from Series
// to Video. Each test seeds ITS OWN content (editing is a mutation — the shared
// fixture is off-limits), renames it via the real UI path (Studio → row
// "edit video" → modal → Save) and asserts the item's type in the studio listing
// stayed intact.

test.describe('Editing content keeps its content type', () => {

    test('Editing an episode title keeps the Series content type', {
        annotation: { type: 'TC', description: 'EDIT-001' },
    }, async ({ page, request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const newTitle = `Edited episode ${Date.now()}`;
        let token: string;
        let seriesId: string;
        let seriesSlug: string;
        let episodeId: string;
        let episodeTitle: string;

        await test.step('Seed a series with one episode via API and login as its owner', async () => {
            const seeded = await setupSeriesWithEpisodes(request, { episodeCount: 1 });
            token = seeded.token;
            seriesId = seeded.seriesId;
            seriesSlug = seeded.seriesSlug;
            episodeId = seeded.episodes[0].id;
            episodeTitle = seeded.episodes[0].title;
            await new AuthFlow(page).loginSuccess(seeded.user.email, process.env.USER_PASSWORD!, seeded.user.username);
        });

        await test.step('Edit the episode title via the studio edit modal', async () => {
            // API-seeded episodes carry no covers, and the edit form requires both before Next.
            await new ContentCreationFlow(page).editTitleViaStudio({ rowTitle: episodeTitle, newTitle, tab: 'all', uploadCovers: true });
        });

        await test.step('Verify the item is still an episode and stays inside its series', async () => {
            // The episode is tracked by id: the W3-2906 bug detached it from the series
            // (type flipped to video), and a title edit may also regenerate the slug.
            let editedEpisode: { slug: string; title: string } | undefined;
            await expect.poll(async () => {
                const episodes = await videoApi.getSeriesEpisodes(token, seriesSlug);
                editedEpisode = episodes.find((e) => e.id === episodeId);
                return editedEpisode?.title;
            }, {
                message: `Episode ${episodeId} is missing from series ${seriesSlug} or its title was not renamed`,
                timeout: 20_000,
            }).toBe(newTitle);
            expect(editedEpisode, 'Edited episode was not resolved from the series').toBeDefined();

            // Episodes are listed ONLY under type=episode; with the W3-2906 bug the item
            // detached from the series and moved to the standalone type=video listing.
            await expect.poll(async () => {
                const items = await videoApi.listStudioContent(token, 'episode');
                return items.find((i) => i.slug === editedEpisode!.slug)?.type;
            }, {
                message: `Studio type=episode listing does not show "${newTitle}" (slug=${editedEpisode!.slug})`,
                timeout: 30_000,
            }).toBe('episode');

            const standalone = await videoApi.listStudioContent(token, 'video');
            expect(
                standalone.find((i) => i.slug === editedEpisode!.slug),
                'The renamed episode leaked into the standalone type=video listing (W3-2906 symptom)',
            ).toBeUndefined();

            const playlists = await videoApi.listMyPlaylists(token);
            const series = playlists.find((p) => p.id === seriesId);
            expect(series?.type, 'The parent series is gone or its type changed').toBe('series');
        });
    });

    test('Editing a video title keeps the Video content type', {
        annotation: { type: 'TC', description: 'EDIT-002' },
    }, async ({ page, request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const newTitle = `Edited video ${Date.now()}`;
        let token: string;
        let videoName: string;

        await test.step('Seed a public video via API and login as its owner', async () => {
            const seeded = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `QA edit video ${Date.now()}`,
                categorySlug: 'education',
                genres: ['Action'],
            });
            token = seeded.token;
            videoName = seeded.videoName;
            await new AuthFlow(page).loginSuccess(seeded.user.email, process.env.USER_PASSWORD!, seeded.user.username);
        });

        await test.step('Edit the video title via the studio edit modal', async () => {
            await new ContentCreationFlow(page).editTitleViaStudio({ rowTitle: videoName, newTitle });
        });

        await test.step('Verify the item is still a standalone video', async () => {
            await expect.poll(async () => {
                const items = await videoApi.listStudioContent(token, 'video');
                return items.find((i) => i.title === newTitle)?.type;
            }, {
                message: `Studio listing does not show "${newTitle}" as type=video`,
                timeout: 20_000,
            }).toBe('video');
        });
    });

    test('Editing a Shorts title keeps the Short content type', {
        annotation: { type: 'TC', description: 'EDIT-003' },
    }, async ({ page, request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const newTitle = `Edited short ${Date.now()}`;
        let token: string;
        let videoName: string;

        await test.step('Seed a public short via API and login as its owner', async () => {
            const seeded = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `QA edit short ${Date.now()}`,
                contentType: 'short',
                genres: ['Action'],
            });
            token = seeded.token;
            videoName = seeded.videoName;
            await new AuthFlow(page).loginSuccess(seeded.user.email, process.env.USER_PASSWORD!, seeded.user.username);
        });

        await test.step('Edit the short title via the studio edit modal', async () => {
            await new ContentCreationFlow(page).editTitleViaStudio({ rowTitle: videoName, newTitle, tab: 'shorts' });
        });

        await test.step('Verify the item is still a short', async () => {
            await expect.poll(async () => {
                const items = await videoApi.listStudioContent(token, 'short');
                return items.find((i) => i.title === newTitle)?.type;
            }, {
                message: `Studio listing does not show "${newTitle}" as type=short`,
                timeout: 20_000,
            }).toBe('short');
        });
    });
});
