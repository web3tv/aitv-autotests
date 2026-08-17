import { test, expect } from '@playwright/test';
import { VideoApi } from '../../../src/api/VideoApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { ChangeVisibilityModal } from '../../../src/pages/studio/ChangeVisibilityModal';
import { SeriesVisibilityModal } from '../../../src/pages/studio/SeriesVisibilityModal';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { setupSeriesWithEpisodes, setupVideoViaApi } from '../../../src/utils/studioTestHelpers';
import { resolveSharedFixture, SharedFixture } from '../../fixtures/sharedFixture';
import { FIXTURE_VIDEO_TITLE } from '../../fixtures/videoSeed';

/**
 * "Change visibility" flow of the redesigned studio Content page (W3-2815). The video
 * variant ends on a success screen; the series variant has none and just closes.
 * Mutating tests seed their own channel.
 */
const CONTENT_URL = () => `${process.env.STUDIO_URL}/content`;

test.describe('Studio Content page — change visibility', () => {

    test('Change a video from public to private via the kebab menu', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'VISCHG-001' },
    }, async ({ page, request }) => {
        test.setTimeout(240_000);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const changeVisibility = new ChangeVisibilityModal(page);
        const password = process.env.USER_PASSWORD!;

        let videoTitle: string;
        let videoId: string;
        let token: string;

        await test.step('Seed a public video and log in as its owner', async () => {
            const setup = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `VisibilitySource_${Date.now()}`,
                waitForProcessing: true,
            });
            videoTitle = setup.videoName;
            videoId = setup.videoId;
            token = setup.token;

            await authFlow.loginSuccess(setup.user.email, password, setup.user.username);
        });

        await test.step('Switch the video to private', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.openCardMenu(videoTitle!);
            await studioContent.clickCardMenuItem('change-visibility');
            await changeVisibility.expectOpen();

            await changeVisibility.selectOption('private');
            await changeVisibility.submitAndWaitUpdated(1);
            await changeVisibility.assertSuccess();
        });

        await test.step('The new visibility is persisted', async () => {
            const video = await videoApi.getVideoById(videoId!, token!);
            expect(video?.privacySettings, 'Video visibility was not changed to private').toBe('private');
        });
    });

    test('Bulk change visibility for two videos', {
        annotation: { type: 'TC', description: 'BULK-008' },
    }, async ({ page, request }) => {
        test.setTimeout(300_000);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const changeVisibility = new ChangeVisibilityModal(page);
        const password = process.env.USER_PASSWORD!;

        let firstVideo: string;
        let secondVideo: string;

        await test.step('Seed two public videos and log in as their owner', async () => {
            const setup1 = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `BulkVisibilityOne_${Date.now()}`,
                waitForProcessing: true,
            });
            firstVideo = setup1.videoName;

            const setup2 = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `BulkVisibilityTwo_${Date.now()}`,
                waitForProcessing: true,
                existingUser: setup1.user,
            });
            secondVideo = setup2.videoName;

            await authFlow.loginSuccess(setup1.user.email, password, setup1.user.username);
        });

        await test.step('Switch both videos to unlisted', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.selectCard(firstVideo!);
            await studioContent.selectCard(secondVideo!);
            await studioContent.expectSelectedCount(2);

            await studioContent.clickBulkAction(studioContent.bulkChangeVisibility, 'Bulk change visibility');
            await changeVisibility.expectOpen();

            await changeVisibility.selectOption('unlisted');
            await changeVisibility.submitAndWaitUpdated(2);
            await changeVisibility.assertSuccess();
        });
    });

    test('Submit stays disabled while the current visibility is selected', {
        annotation: { type: 'TC', description: 'VISCHG-002' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const changeVisibility = new ChangeVisibilityModal(page);
        const fx: SharedFixture = await resolveSharedFixture();

        await test.step('Login as the fixture owner and open the modal for a public video', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();

            await studioContent.openCardMenu(FIXTURE_VIDEO_TITLE);
            await studioContent.clickCardMenuItem('change-visibility');
            await changeVisibility.expectOpen();
        });

        await test.step('The current value cannot be re-submitted', async () => {
            await changeVisibility.expectSubmitDisabled();
        });

        await test.step('Choosing a different value enables the submit', async () => {
            await changeVisibility.selectOption('private');
            await changeVisibility.expectSubmitEnabled();
        });

        await test.step('Going back to the current value disables it again', async () => {
            await changeVisibility.selectOption('public');
            await changeVisibility.expectSubmitDisabled();
        });

        await test.step('Cancel leaves the fixture untouched', async () => {
            await changeVisibility.cancel();
        });
    });

    test('Change a series from public to private', {
        annotation: { type: 'TC', description: 'PLAYLIST-005' },
    }, async ({ page, request }) => {
        test.setTimeout(300_000);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const seriesVisibility = new SeriesVisibilityModal(page);
        const password = process.env.USER_PASSWORD!;

        let seriesTitle: string;

        await test.step('Seed a public series and log in as its owner', async () => {
            const series = await setupSeriesWithEpisodes(request, { episodeCount: 1, waitForProcessing: false });
            seriesTitle = series.seriesTitle;

            await authFlow.loginSuccess(series.user.email, password, series.user.username);
        });

        await test.step('Switch the series to private', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.openSeriesTab();
            await studioContent.assertCardVisible(seriesTitle!);

            await studioContent.selectCard(seriesTitle!);
            await studioContent.clickBulkAction(studioContent.seriesBulkChangeVisibility, 'Series change visibility');
            await seriesVisibility.expectOpen();

            await seriesVisibility.selectOption('private');
            const privacyStatus = await seriesVisibility.submitAndWaitUpdated();
            expect(privacyStatus, 'Series was not updated to private').toBe('private');
        });

        await test.step('The success screen closes the dialog', async () => {
            await seriesVisibility.assertSuccess();
            await seriesVisibility.done();
        });
    });

    test('Change a series to unlisted', {
        annotation: { type: 'TC', description: 'VISCHG-010' },
    }, async ({ page, request }) => {
        // The backend rejects privacyStatus=unlisted for playlists with 422
        // ("This value should be of type int|string") on both POST /playlists/ and
        // PUT /playlists/, while the UI still offers the option. Verified on dev2.
        test.fixme(true, 'Series do not support the Unlisted visibility on the backend');
        test.setTimeout(300_000);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const seriesVisibility = new SeriesVisibilityModal(page);
        const password = process.env.USER_PASSWORD!;

        let seriesTitle: string;

        await test.step('Seed a public series and log in as its owner', async () => {
            const series = await setupSeriesWithEpisodes(request, { episodeCount: 1, waitForProcessing: false });
            seriesTitle = series.seriesTitle;

            await authFlow.loginSuccess(series.user.email, password, series.user.username);
        });

        await test.step('Switch the series to unlisted', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.openSeriesTab();
            await studioContent.selectCard(seriesTitle!);

            await studioContent.clickBulkAction(studioContent.seriesBulkChangeVisibility, 'Series change visibility');
            await seriesVisibility.expectOpen();

            await seriesVisibility.selectOption('unlisted');
            const privacyStatus = await seriesVisibility.submitAndWaitUpdated();
            expect(privacyStatus, 'Series was not updated to unlisted').toBe('unlisted');

            await seriesVisibility.assertSuccess();
        });
    });
});
