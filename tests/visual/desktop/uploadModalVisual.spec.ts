import { test, expect, request as playwrightRequest, Browser, Page } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { ContentCreationFlow } from '../../../src/flows/ContentCreationFlow';
import { ContentUploadModal } from '../../../src/pages/studio/ContentUploadModal';

/**
 * Visual regression for the stepped content-creation modal (W3-2702), three states:
 *   1. Details step right after the video is uploaded (empty form)
 *   2. Finalize step (after filling the form and pressing Next)
 *   3. Success step (after pressing Publish/Finish)
 *
 * Captured for every content type (Movie / Series / Shorts). Snapshots are generated
 * for the 1920×1080 desktop project only (visual-desktop-chromium).
 *
 * Only the dialog element is screenshotted (not the whole page) to keep the header /
 * backdrop out of frame. Non-deterministic regions are masked: the upload status line,
 * the finalize video preview (poster frame) and the success screen media / share link.
 */

const HORIZONTAL_VIDEO = 'test-data/fixtures/video/5secVideo.mp4';
// Shorts only accepts a vertical source, so the type radio stays disabled for a landscape clip.
const VERTICAL_VIDEO = 'test-data/fixtures/video/shortsVideo.mp4';
const FIXED_TITLE = 'QA Visual Upload';
const FIXED_DESCRIPTION = 'QA visual upload description';
const SERIES_NAME = 'QA Visual Series';

const SHOT_OPTS = { maxDiffPixelRatio: 0.02 } as const;

/** Dynamic upload-status line (spinner / percentage) shown on the Details step. */
const detailsMasks = (modal: ContentUploadModal) => [modal.processing];

/** Video player with a non-deterministic poster frame on the Finalize step. */
const finalizeMasks = (modal: ContentUploadModal) => [modal.preview];

/** Auto-generated per-video share link (random slug) on the Success screen. */
const successMasks = (modal: ContentUploadModal) => [modal.successShareUrl];

async function readyForShot(page: Page): Promise<void> {
    await page.evaluate(async () => { await document.fonts.ready; });
}

test.describe.configure({ mode: 'serial' });

// ─────────────────────────────────────────────────────────────── Movie

test.describe('Upload modal — Movie', () => {
    let page: Page;
    let modal: ContentUploadModal;

    test.beforeAll(async ({ browser }: { browser: Browser }) => {
        ({ page, modal } = await openUploadedModal(browser, 'movie'));
    });

    test.afterAll(async () => { await page.close(); });

    test('Movie — Details step, empty form', {
        annotation: { type: 'TC', description: 'VIS-UPL-001' },
    }, async () => {
        await test.step('Screenshot the empty Details form', async () => {
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-movie-details-empty.png', {
                ...SHOT_OPTS, mask: detailsMasks(modal),
            });
        });
    });

    test('Movie — Finalize step after Next', {
        annotation: { type: 'TC', description: 'VIS-UPL-002' },
    }, async () => {
        await test.step('Fill the Details form and upload covers', async () => {
            await modal.fillTitle(FIXED_TITLE);
            await modal.fillDescription(FIXED_DESCRIPTION);
            await modal.selectCategory();
            await modal.selectGenre();
            await modal.uploadHorizontalCover('test-data/fixtures/photo/cat.jpg');
            await modal.uploadVerticalCover('test-data/fixtures/photo/cat.jpg');
        });

        await test.step('Advance to Finalize and screenshot', async () => {
            await modal.clickNext();
            await modal.assertOnFinalize();
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-movie-finalize.png', {
                ...SHOT_OPTS, mask: finalizeMasks(modal),
            });
        });
    });

    test('Movie — Success step after Publish', {
        annotation: { type: 'TC', description: 'VIS-UPL-003' },
    }, async () => {
        await test.step('Publish and screenshot the Success screen', async () => {
            await modal.selectVisibility('public');
            await modal.clickPublish();
            await modal.assertSuccess();
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-movie-success.png', {
                ...SHOT_OPTS, mask: successMasks(modal),
            });
        });
    });
});

// ─────────────────────────────────────────────────────────────── Series

test.describe('Upload modal — Series', () => {
    let page: Page;
    let modal: ContentUploadModal;

    test.beforeAll(async ({ browser }: { browser: Browser }) => {
        ({ page, modal } = await openUploadedModal(browser, 'series'));
    });

    test.afterAll(async () => { await page.close(); });

    test('Series — Details step, empty form', {
        annotation: { type: 'TC', description: 'VIS-UPL-004' },
    }, async () => {
        await test.step('Screenshot the empty Details form', async () => {
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-series-details-empty.png', {
                ...SHOT_OPTS, mask: detailsMasks(modal),
            });
        });
    });

    test('Series — Finalize step after Next', {
        annotation: { type: 'TC', description: 'VIS-UPL-005' },
    }, async () => {
        await test.step('Fill the Details form and upload covers', async () => {
            await modal.fillSeriesName(SERIES_NAME);
            await modal.fillTitle(FIXED_TITLE);
            await modal.fillDescription(FIXED_DESCRIPTION);
            await modal.selectCategory();
            await modal.selectGenre();
            await modal.uploadHorizontalCover('test-data/fixtures/photo/cat.jpg');
            await modal.uploadVerticalCover('test-data/fixtures/photo/cat.jpg');
        });

        await test.step('Advance to Finalize and screenshot', async () => {
            await modal.clickNext();
            await modal.assertOnFinalize();
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-series-finalize.png', {
                ...SHOT_OPTS, mask: finalizeMasks(modal),
            });
        });
    });

    test('Series — Success step after Publish', {
        annotation: { type: 'TC', description: 'VIS-UPL-006' },
    }, async () => {
        await test.step('Publish and screenshot the Success screen', async () => {
            await modal.selectVisibility('public');
            await modal.clickPublish();
            await modal.assertSuccess();
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-series-success.png', {
                ...SHOT_OPTS, mask: successMasks(modal),
            });
        });
    });
});

// ─────────────────────────────────────────────────────────────── Shorts

test.describe('Upload modal — Shorts', () => {
    let page: Page;
    let modal: ContentUploadModal;

    test.beforeAll(async ({ browser }: { browser: Browser }) => {
        ({ page, modal } = await openUploadedModal(browser, 'shorts'));
    });

    test.afterAll(async () => { await page.close(); });

    test('Shorts — Details step, empty form', {
        annotation: { type: 'TC', description: 'VIS-UPL-007' },
    }, async () => {
        await test.step('Screenshot the empty Details form', async () => {
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-shorts-details-empty.png', {
                ...SHOT_OPTS, mask: detailsMasks(modal),
            });
        });
    });

    test('Shorts — Finalize step after Next', {
        annotation: { type: 'TC', description: 'VIS-UPL-008' },
    }, async () => {
        await test.step('Fill the Details form and upload the cover', async () => {
            await modal.fillTitle(FIXED_TITLE);
            await modal.fillDescription(FIXED_DESCRIPTION);
            await modal.selectGenre();
            await modal.uploadShortsCover('test-data/fixtures/photo/cat.jpg');
        });

        await test.step('Advance to Finalize and screenshot', async () => {
            await modal.clickNext();
            await modal.assertOnFinalize();
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-shorts-finalize.png', {
                ...SHOT_OPTS, mask: finalizeMasks(modal),
            });
        });
    });

    test('Shorts — Success step after Publish', {
        annotation: { type: 'TC', description: 'VIS-UPL-009' },
    }, async () => {
        await test.step('Publish and screenshot the Success screen', async () => {
            await modal.selectVisibility('public');
            await modal.clickPublish();
            await modal.assertSuccess();
            await readyForShot(page);
            await expect(modal.dialog).toHaveScreenshot('upload-shorts-success.png', {
                ...SHOT_OPTS, mask: successMasks(modal),
            });
        });
    });
});

/**
 * Creates a fresh creator, logs in on a dedicated page, opens the upload modal,
 * selects the fixture video + content type and waits for processing to finish.
 * Leaves the modal on the (empty) Details step, ready for the first screenshot.
 */
async function openUploadedModal(
    browser: Browser,
    type: 'movie' | 'series' | 'shorts',
): Promise<{ page: Page; modal: ContentUploadModal }> {
    const requestContext = await playwrightRequest.newContext();
    const user = await new AuthApi(requestContext).createUserFast();
    await requestContext.dispose();

    const page = await browser.newPage();
    await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);

    const flow = new ContentCreationFlow(page);
    await flow.openNewVideo();
    await flow.modal.selectFile(type === 'shorts' ? VERTICAL_VIDEO : HORIZONTAL_VIDEO);
    await flow.modal.selectType(type);
    if (type === 'series') await flow.modal.setSeriesModeNew();
    await flow.modal.waitUploadProcessed();

    return { page, modal: flow.modal };
}
