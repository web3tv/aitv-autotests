import { test, expect } from '@playwright/test';
import { VideoApi } from '../../../src/api/VideoApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AddToSeriesModal } from '../../../src/pages/studio/AddToSeriesModal';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { setupSeriesWithEpisodes, setupVideoViaApi } from '../../../src/utils/studioTestHelpers';

/**
 * "Add to Series" flow of the redesigned studio Content page (W3-2815). Every test seeds
 * its own channel: the flow mutates content (a standalone video becomes an episode).
 */
const CONTENT_URL = () => `${process.env.STUDIO_URL}/content`;

test.describe('Studio Content page — add to series', () => {

    test('Add a standalone video to an existing series', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'PLAYLIST-002' },
    }, async ({ page, request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const addToSeries = new AddToSeriesModal(page);
        const password = process.env.USER_PASSWORD!;

        let seriesTitle: string;
        let seriesSlug: string;
        let videoTitle: string;
        let token: string;

        await test.step('Seed a series with one episode plus a standalone video', async () => {
            const series = await setupSeriesWithEpisodes(request, { episodeCount: 1 });
            seriesTitle = series.seriesTitle;
            seriesSlug = series.seriesSlug;
            token = series.token;

            const video = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `AddToSeriesSource_${Date.now()}`,
                waitForProcessing: true,
                existingUser: series.user,
            });
            videoTitle = video.videoName;

            await authFlow.loginSuccess(series.user.email, password, series.user.username);
        });

        await test.step('Open the Add to Series modal from the video kebab', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.openCardMenu(videoTitle!);
            await studioContent.clickCardMenuItem('add-to-series');
            await addToSeries.expectOpen();
        });

        await test.step('Pick the series and submit', async () => {
            await addToSeries.assertSeriesListed(seriesTitle!);
            await addToSeries.chooseSeries(seriesTitle!);
            await addToSeries.submitAndWaitAdded(1);
            await addToSeries.assertSuccess();
        });

        await test.step('The video is now an episode of the series', async () => {
            const episodes = await videoApi.getSeriesEpisodes(token!, seriesSlug!);
            expect(episodes.map(e => e.title), 'The video was not attached to the series')
                .toContain(videoTitle!);
        });
    });

    test('Bulk add two videos to a series', {
        annotation: { type: 'TC', description: 'BULK-009' },
    }, async ({ page, request }) => {
        test.setTimeout(360_000);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const addToSeries = new AddToSeriesModal(page);
        const password = process.env.USER_PASSWORD!;

        let seriesTitle: string;
        let seriesSlug: string;
        let firstVideo: string;
        let secondVideo: string;
        let token: string;

        await test.step('Seed a series with one episode plus two standalone videos', async () => {
            const series = await setupSeriesWithEpisodes(request, { episodeCount: 1 });
            seriesTitle = series.seriesTitle;
            seriesSlug = series.seriesSlug;
            token = series.token;

            const video1 = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `BulkAddOne_${Date.now()}`,
                waitForProcessing: true,
                existingUser: series.user,
            });
            firstVideo = video1.videoName;

            const video2 = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `BulkAddTwo_${Date.now()}`,
                waitForProcessing: true,
                existingUser: series.user,
            });
            secondVideo = video2.videoName;

            await authFlow.loginSuccess(series.user.email, password, series.user.username);
        });

        await test.step('Select both videos and open Add to Series from the bulk bar', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.selectCard(firstVideo!);
            await studioContent.selectCard(secondVideo!);
            await studioContent.expectSelectedCount(2);

            await studioContent.clickBulkAction(studioContent.bulkAddToSeries, 'Add to Series');
            await addToSeries.expectOpen();
        });

        await test.step('Submit and wait for both videos to be attached', async () => {
            await addToSeries.chooseSeries(seriesTitle!);
            await addToSeries.submitAndWaitAdded(2);
            await addToSeries.assertSuccess();
        });

        await test.step('Both videos are episodes of the series', async () => {
            const episodes = await videoApi.getSeriesEpisodes(token!, seriesSlug!);
            const titles = episodes.map(e => e.title);
            expect(titles, 'The first video was not attached').toContain(firstVideo!);
            expect(titles, 'The second video was not attached').toContain(secondVideo!);
        });
    });

    test('A private video can only be added to a private series', {
        annotation: { type: 'TC', description: 'SERIES-UI-011' },
    }, async ({ page, request }) => {
        // The privacy filter reads the studio listing with an exact one-element cache key
        // (`getQueryData(['videos-{channelId}-studio'])`), while the listing is cached under
        // a two-element key, so the selection is always empty and public series stay listed.
        test.fixme(true, 'Add to Series does not filter series by the selected video privacy');
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const addToSeries = new AddToSeriesModal(page);
        const password = process.env.USER_PASSWORD!;

        const publicSeriesTitle = `QA Public Series ${Date.now()}`;
        const privateSeriesTitle = `QA Private Series ${Date.now()}`;
        let videoTitle: string;

        await test.step('Seed a private video plus a public and a private series', async () => {
            const setup = await setupVideoViaApi(request, {
                privacySetting: 'private',
                title: `PrivateAddSource_${Date.now()}`,
                waitForProcessing: true,
            });
            videoTitle = setup.videoName;

            await videoApi.createSeries(setup.token, {
                title: publicSeriesTitle,
                channelId: setup.channelId,
                privacyStatus: 'public',
            });
            await videoApi.createSeries(setup.token, {
                title: privateSeriesTitle,
                channelId: setup.channelId,
                privacyStatus: 'private',
            });

            await authFlow.loginSuccess(setup.user.email, password, setup.user.username);
        });

        await test.step('Only the private series is offered', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.openCardMenu(videoTitle!);
            await studioContent.clickCardMenuItem('add-to-series');
            await addToSeries.expectOpen();

            await addToSeries.assertSeriesListed(privateSeriesTitle);
            await addToSeries.assertSeriesNotListed(publicSeriesTitle);
        });

        await test.step('Cancel leaves the video untouched', async () => {
            await addToSeries.cancel();
        });
    });
});
