import { test, expect } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { VideoApi } from '../../../src/api/VideoApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { CreateSeriesModal } from '../../../src/pages/studio/CreateSeriesModal';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { setupVideoViaApi } from '../../../src/utils/studioTestHelpers';
import { resolveSharedFixture, SharedFixture } from '../../fixtures/sharedFixture';
import { FIXTURE_VIDEO_TITLE } from '../../fixtures/videoSeed';

/**
 * "Create Series" flow of the redesigned studio Content page (W3-2815): a two-step modal
 * (details → visibility) that creates the playlist, attaches the selected videos one by
 * one, and ends on a success screen. Creation tests seed their own user; the
 * validation-only case reuses the read-only `@qavischan` fixture and never submits.
 */
const CONTENT_URL = () => `${process.env.STUDIO_URL}/content`;

test.describe('Studio Content page — create series', () => {

    test('Create a public series from a selected video', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'PLAYLIST-001' },
    }, async ({ page, request }) => {
        test.setTimeout(240_000);
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const createSeries = new CreateSeriesModal(page);
        const password = process.env.USER_PASSWORD!;

        const seriesTitle = `QA Series ${Date.now()}`;
        const seriesDescription = 'Series created from the studio content page';
        let videoTitle: string;
        let token: string;

        await test.step('Seed a published video and log in as its owner', async () => {
            const setup = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `SeriesSource_${Date.now()}`,
                waitForProcessing: true,
            });
            videoTitle = setup.videoName;
            token = setup.token;

            await authFlow.loginSuccess(setup.user.email, password, setup.user.username);
        });

        await test.step('Select the video and open the Create Series modal', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.selectCard(videoTitle!);

            await studioContent.clickBulkAction(studioContent.bulkCreateSeries, 'Create Series');
            await createSeries.expectOpen();
        });

        await test.step('Fill the details and pick the public visibility', async () => {
            await createSeries.fillDetails(seriesTitle, seriesDescription);
            await createSeries.continueToVisibility();
            await createSeries.chooseVisibility('public');
        });

        await test.step('Submit and verify the success screen', async () => {
            const payload = await createSeries.submitAndWaitCreated(1);
            expect(payload.privacyStatus, 'Series was created with an unexpected visibility').toBe('public');
            expect(payload.title, 'Series was created with an unexpected title').toBe(seriesTitle);

            await createSeries.assertSuccess();
        });

        await test.step('Verify the series exists with the video attached', async () => {
            const playlists = await videoApi.listMyPlaylists(token!);
            const created = playlists.find(p => p.title === seriesTitle);
            expect(created, `Series "${seriesTitle}" is missing in the playlists listing`).toBeTruthy();

            const episodes = await videoApi.getSeriesEpisodes(token!, created!.slug);
            expect(episodes.map(e => e.title), 'The selected video is not attached to the series')
                .toContain(videoTitle!);
        });
    });

    test('Create an unlisted series', {
        annotation: { type: 'TC', description: 'SERIES-UI-001' },
    }, async ({ page, request }) => {
        // POST /playlists/ answers 422 ("This value should be of type int|string") for
        // privacyStatus=unlisted, so the series is never created. Verified on dev2.
        test.fixme(true, 'Series do not support the Unlisted visibility on the backend');
        test.setTimeout(240_000);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const createSeries = new CreateSeriesModal(page);
        const password = process.env.USER_PASSWORD!;

        const seriesTitle = `QA Unlisted Series ${Date.now()}`;
        let videoTitle: string;

        await test.step('Seed a published video and log in as its owner', async () => {
            const setup = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `UnlistedSeriesSource_${Date.now()}`,
                waitForProcessing: true,
            });
            videoTitle = setup.videoName;

            await authFlow.loginSuccess(setup.user.email, password, setup.user.username);
        });

        await test.step('Create the series with the unlisted visibility', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.selectCard(videoTitle!);

            await studioContent.clickBulkAction(studioContent.bulkCreateSeries, 'Create Series');
            await createSeries.expectOpen();

            await createSeries.fillDetails(seriesTitle);
            await createSeries.continueToVisibility();
            await createSeries.chooseVisibility('unlisted');

            const payload = await createSeries.submitAndWaitCreated(1);
            expect(payload.privacyStatus, 'Series was not created as unlisted').toBe('unlisted');
            await createSeries.assertSuccess();
        });
    });

    test('Duplicate series title is rejected', {
        annotation: { type: 'TC', description: 'SERIES-UI-004' },
    }, async ({ page, request }) => {
        test.setTimeout(240_000);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const createSeries = new CreateSeriesModal(page);
        const password = process.env.USER_PASSWORD!;

        const seriesTitle = `QA Duplicate Series ${Date.now()}`;
        let videoTitle: string;
        let token: string;

        await test.step('Seed a video plus a series that already owns the title', async () => {
            const setup = await setupVideoViaApi(request, {
                privacySetting: 'public',
                title: `DuplicateSeriesSource_${Date.now()}`,
                waitForProcessing: true,
            });
            videoTitle = setup.videoName;
            token = setup.token;

            await videoApi.createSeries(token, { title: seriesTitle, channelId: setup.channelId });
            await authFlow.loginSuccess(setup.user.email, password, setup.user.username);
        });

        await test.step('A duplicate title does not pass the details step', async () => {
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();
            await studioContent.selectCard(videoTitle!);

            await studioContent.clickBulkAction(studioContent.bulkCreateSeries, 'Create Series');
            await createSeries.expectOpen();

            await createSeries.fillDetails(seriesTitle);
            // The title is validated on Continue, so the visibility step never opens.
            await expect(createSeries.continueButton, 'Continue button is not enabled').toBeEnabled();
            await createSeries.continueButton.click();

            await expect(createSeries.submitButton, 'A duplicate title must not reach the visibility step')
                .toHaveCount(0);
            await expect(createSeries.titleInput, 'The details step should stay open').toBeVisible();
        });

        await test.step('No second series was created', async () => {
            const playlists = await videoApi.listMyPlaylists(token!);
            const matching = playlists.filter(p => p.title === seriesTitle);
            expect(matching, 'A duplicate series was created').toHaveLength(1);
        });
    });

    test('Series title and description enforce their limits', {
        annotation: { type: 'TC', description: 'SERIES-UI-003' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const studioContent = new StudioContentPage(page);
        const createSeries = new CreateSeriesModal(page);
        const fx: SharedFixture = await resolveSharedFixture();

        await test.step('Login as the fixture owner and open the Create Series modal', async () => {
            await authFlow.loginSuccess(fx.ownerEmail, fx.password, fx.ownerUsername);
            await page.goto(CONTENT_URL(), { waitUntil: 'domcontentloaded' });
            await studioContent.waitForListing();

            await studioContent.selectCard(FIXTURE_VIDEO_TITLE);
            await studioContent.clickBulkAction(studioContent.bulkCreateSeries, 'Create Series');
            await createSeries.expectOpen();
        });

        await test.step('A one-character title cannot be submitted', async () => {
            await createSeries.fillDetails('A');
            await expect(createSeries.continueButton, 'Continue must be disabled for a 1-character title')
                .toBeDisabled();
        });

        await test.step('A two-character title unlocks the next step', async () => {
            await createSeries.fillDetails('AB');
            await expect(createSeries.continueButton, 'Continue must be enabled for a 2-character title')
                .toBeEnabled();
        });

        await test.step('Title and description are capped at 100 and 200 characters', async () => {
            await createSeries.fillDetails('X'.repeat(120), 'Y'.repeat(220));

            await expect(createSeries.titleInput, 'Series title is not capped at 100 characters')
                .toHaveValue('X'.repeat(100));
            await expect(createSeries.descriptionInput, 'Series description is not capped at 200 characters')
                .toHaveValue('Y'.repeat(200));
        });

        await test.step('Cancel closes the modal without creating anything', async () => {
            await createSeries.cancel();
        });
    });
});
