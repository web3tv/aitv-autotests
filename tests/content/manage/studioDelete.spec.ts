import { test, expect } from '@playwright/test';
import { VideoApi } from '../../../src/api/VideoApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { DeleteConfirmModal } from '../../../src/pages/studio/DeleteConfirmModal';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { setupSeriesWithEpisodes, setupVideoViaApi } from '../../../src/utils/studioTestHelpers';
import { resolveSharedFixture, SharedFixture } from '../../fixtures/sharedFixture';
import { FIXTURE_VIDEO_TITLE } from '../../fixtures/videoSeed';

/**
 * Delete flow of the redesigned studio Content page (W3-2815): kebab and bulk delete for
 * videos, bulk delete for series. Destructive tests seed their own channel; the cancel
 * case runs on the read-only `@qavischan` fixture and guards that no request is sent.
 */
const CONTENT_URL = () => `${process.env.STUDIO_URL}/content`;

test.describe('Studio Content page — delete', () => {

    test('Delete a video from its kebab menu', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'STUDIO-026' },
    }, async ({ page, request }) => {
        test.setTimeout(240_000);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const deleteConfirm = new DeleteConfirmModal(page);
        const password = process.env.USER_PASSWORD!;

        let videoTitle: string;
        let token: string;

        await test.step('Seed a published video and log in as its owner', async () => {
            const setup = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `DeleteMe_${Date.now()}`,
                waitForProcessing: true,
            });
            videoTitle = setup.videoName;
            token = setup.token;

            await authFlow.loginSuccess(setup.user.email, password, setup.user.username);
        });

        await test.step('Delete the video through the kebab menu', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.assertCardVisible(videoTitle!);

            await studioContent.openCardMenu(videoTitle!);
            await studioContent.clickCardMenuItem('delete');
            await deleteConfirm.expectOpen();
            await deleteConfirm.confirmAndWaitDeleted({ kind: 'video', count: 1 });
        });

        await test.step('The video is gone from the listing and the API', async () => {
            await studioContent.assertCardAbsent(videoTitle!);

            const videos = await videoApi.listStudioContent(token!, 'video');
            expect(videos.map(v => v.title), 'The deleted video is still listed')
                .not.toContain(videoTitle!);
        });
    });

    test('Bulk delete removes every selected video', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'BULK-007' },
    }, async ({ page, request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const deleteConfirm = new DeleteConfirmModal(page);
        const password = process.env.USER_PASSWORD!;

        let firstVideo: string;
        let secondVideo: string;
        let token: string;

        await test.step('Seed two published videos and log in as their owner', async () => {
            const setup1 = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `BulkDeleteOne_${Date.now()}`,
                waitForProcessing: true,
            });
            firstVideo = setup1.videoName;
            token = setup1.token;

            const setup2 = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `BulkDeleteTwo_${Date.now()}`,
                waitForProcessing: true,
                existingUser: setup1.user,
            });
            secondVideo = setup2.videoName;

            await authFlow.loginSuccess(setup1.user.email, password, setup1.user.username);
        });

        await test.step('Select both videos and delete them in bulk', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.selectCard(firstVideo!);
            await studioContent.selectCard(secondVideo!);
            await studioContent.expectSelectedCount(2);

            await studioContent.clickBulkAction(studioContent.bulkDelete, 'Bulk delete');
            await deleteConfirm.expectOpen();
            await deleteConfirm.confirmAndWaitDeleted({ kind: 'video', count: 2 });
        });

        await test.step('Both videos are gone and the bulk bar is hidden', async () => {
            await studioContent.assertCardAbsent(firstVideo!);
            await studioContent.assertCardAbsent(secondVideo!);
            await studioContent.expectBulkBarHidden();

            const videos = await videoApi.listStudioContent(token!, 'video');
            const titles = videos.map(v => v.title);
            expect(titles, 'The first video is still listed').not.toContain(firstVideo!);
            expect(titles, 'The second video is still listed').not.toContain(secondVideo!);
        });
    });

    test('Delete a series from the Series tab', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'PLAYLIST-004' },
    }, async ({ page, request }) => {
        test.setTimeout(300_000);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const deleteConfirm = new DeleteConfirmModal(page);
        const password = process.env.USER_PASSWORD!;

        let seriesTitle: string;
        let token: string;

        await test.step('Seed a series with one episode and log in as its owner', async () => {
            const series = await setupSeriesWithEpisodes(request, { episodeCount: 1, waitForProcessing: false });
            seriesTitle = series.seriesTitle;
            token = series.token;

            await authFlow.loginSuccess(series.user.email, password, series.user.username);
        });

        await test.step('Delete the series from the bulk bar', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.openSeriesTab();
            await studioContent.assertCardVisible(seriesTitle!);

            await studioContent.selectCard(seriesTitle!);
            await studioContent.clickBulkAction(studioContent.seriesBulkDelete, 'Series delete');

            await deleteConfirm.expectOpen();
            await deleteConfirm.confirmAndWaitDeleted({ kind: 'series', count: 1 });
        });

        await test.step('The series is gone from the tab and the API', async () => {
            await studioContent.assertCardAbsent(seriesTitle!);

            const playlists = await videoApi.listMyPlaylists(token!);
            expect(playlists.map(p => p.title), 'The deleted series is still listed')
                .not.toContain(seriesTitle!);
        });
    });

    test('Cancelling the delete confirmation keeps the content', {
        annotation: { type: 'TC', description: 'STUDIO-027' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const deleteConfirm = new DeleteConfirmModal(page);
        const fx: SharedFixture = await resolveSharedFixture();

        const deleteRequests: string[] = [];
        page.on('request', req => {
            if (req.method() === 'DELETE') deleteRequests.push(req.url());
        });

        await test.step('Login as the fixture owner and open the delete confirmation', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();

            await studioContent.openCardMenu(FIXTURE_VIDEO_TITLE);
            await studioContent.clickCardMenuItem('delete');
            await deleteConfirm.expectOpen();
        });

        await test.step('Cancel closes the modal and deletes nothing', async () => {
            await deleteConfirm.cancel();

            await studioContent.assertCardVisible(FIXTURE_VIDEO_TITLE);
            expect(deleteRequests, 'Cancelling must not send any delete request').toHaveLength(0);
        });
    });
});
