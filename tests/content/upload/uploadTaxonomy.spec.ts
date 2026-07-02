import { test, expect } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { ContentCreationFlow } from '../../../src/flows/ContentCreationFlow';
import {
    EXPECTED_VIDEO_CATEGORIES,
    EXPECTED_EPISODE_CATEGORIES,
    EXPECTED_GENRES,
} from '../../../src/utils/videoTaxonomy';

/**
 * Verifies that the content-upload modal (W3-2702) displays exactly the categories
 * and genres defined by the W3-2729 taxonomy. Categories are content-type specific
 * (video vs episode); genres are shared. Assertions are exact — an extra or missing
 * option fails the test.
 */

const VIDEO = 'test-data/fixtures/video/5secVideo.mp4';

/** Order-independent exact-set comparison with a descriptive message. */
function expectSameSet(actual: string[], expected: readonly string[], what: string): void {
    expect(
        [...actual].sort(),
        `${what}: displayed options do not exactly match the expected W3-2729 list`,
    ).toEqual([...expected].sort());
}

test.describe('Upload modal taxonomy (W3-2729)', () => {
    test('Movie upload lists exactly the expected video categories', {
        annotation: { type: 'TC', description: 'CATEGORIES-UI-001' },
    }, async ({ page, request }) => {
        test.setTimeout(120_000);
        let options: string[] = [];

        await test.step('Create user and login', async () => {
            const user = await new AuthApi(request).createUserFast();
            await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
        });

        await test.step('Open the upload modal as a Movie and read the Category options', async () => {
            const flow = new ContentCreationFlow(page);
            await flow.openNewVideo();
            await flow.modal.selectFile(VIDEO);
            await flow.modal.selectType('movie');
            options = await flow.modal.collectCategoryOptions();
        });

        await test.step('Category options exactly match the expected video categories', async () => {
            expectSameSet(options, EXPECTED_VIDEO_CATEGORIES, 'Movie categories');
        });
    });

    test('Series upload lists exactly the expected episode categories', {
        annotation: { type: 'TC', description: 'CATEGORIES-UI-002' },
    }, async ({ page, request }) => {
        test.setTimeout(120_000);
        let options: string[] = [];

        await test.step('Create user and login', async () => {
            const user = await new AuthApi(request).createUserFast();
            await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
        });

        await test.step('Open the upload modal as a new Series and read the Category options', async () => {
            const flow = new ContentCreationFlow(page);
            await flow.openNewVideo();
            await flow.modal.selectFile(VIDEO);
            await flow.modal.selectType('series');
            await flow.modal.setSeriesModeNew();
            options = await flow.modal.collectCategoryOptions();
        });

        await test.step('Category options exactly match the expected episode categories', async () => {
            expectSameSet(options, EXPECTED_EPISODE_CATEGORIES, 'Series categories');
        });
    });

    test('Upload modal lists exactly the expected genres', {
        annotation: { type: 'TC', description: 'GENRES-UI-001' },
    }, async ({ page, request }) => {
        test.setTimeout(120_000);
        let options: string[] = [];

        await test.step('Create user and login', async () => {
            const user = await new AuthApi(request).createUserFast();
            await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
        });

        await test.step('Open the upload modal as a Movie and read the Genres options', async () => {
            const flow = new ContentCreationFlow(page);
            await flow.openNewVideo();
            await flow.modal.selectFile(VIDEO);
            await flow.modal.selectType('movie');
            options = await flow.modal.collectGenreOptions();
        });

        await test.step('Genre options exactly match the expected genres', async () => {
            expectSameSet(options, EXPECTED_GENRES, 'Genres');
        });
    });
});
