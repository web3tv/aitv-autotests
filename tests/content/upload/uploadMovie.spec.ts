import { test } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AuthApi } from '../../../src/api/AuthApi';
import { ContentCreationFlow } from '../../../src/flows/ContentCreationFlow';
import { ContentUploadModal } from '../../../src/pages/studio/ContentUploadModal';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';

const LANDSCAPE_VIDEO = 'test-data/fixtures/video/5secVideo.mp4';
const VERTICAL_VIDEO = 'test-data/fixtures/video/shortsVideo.mp4';

test('Create a Movie through the full upload flow', {
    tag: '@critical',
    annotation: { type: 'TC', description: 'MOVIE-001' },
}, async ({ page, request }) => {
    test.setTimeout(240_000);
    let user: { email: string; username: string };
    const title = `QA Movie ${Date.now()}`;

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Create a public Movie end-to-end', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.createMovie({
            filePath: LANDSCAPE_VIDEO,
            title,
            description: 'QA autotest movie description',
            visibility: 'public',
        });
        await flow.modal.closeSuccess();
    });

    await test.step('Verify the Movie appears on the Movies tab', async () => {
        const content = new StudioContentPage(page);
        const responsePromise = page.waitForResponse(
            (r) => r.url().includes('studio-videos') && r.status() === 200,
            { timeout: 20_000 },
        );
        await page.goto(`${process.env.STUDIO_URL}/content`, { waitUntil: 'domcontentloaded' });
        await responsePromise;
        await content.clickVideosTab();
        await content.assertVideoRowContainsTitle(title);
    });
});

// W3-2714 (Horizontal shorts support): orientation no longer restricts the content
// type — any of Movie/Series/Shorts is selectable for both landscape and vertical
// files (the backend accepts an explicit `type` and no longer coerces by aspect ratio).
test('Any content type is selectable regardless of video orientation', {
    annotation: { type: 'TC', description: 'MOVIE-002' },
}, async ({ page, request }) => {
    test.setTimeout(180_000);
    let user: { email: string; username: string };

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Landscape video: all three types are selectable', async () => {
        const flow = new ContentCreationFlow(page);
        const modal = flow.modal as ContentUploadModal;
        await flow.openNewVideo();
        await modal.selectFile(LANDSCAPE_VIDEO);

        await modal.assertTypeAvailable('movie', true);
        await modal.assertTypeAvailable('series', true);
        await modal.assertTypeAvailable('shorts', true);

        // Shorts must actually accept the selection for a landscape file (W3-2714).
        await modal.selectType('shorts');
    });

    await test.step('Vertical video: all three types are selectable', async () => {
        // Reload to reset the modal state, then start a fresh upload.
        await page.reload({ waitUntil: 'domcontentloaded' });
        const flow = new ContentCreationFlow(page);
        const modal = flow.modal as ContentUploadModal;
        await flow.openNewVideo();
        await modal.selectFile(VERTICAL_VIDEO);

        await modal.assertTypeAvailable('movie', true);
        await modal.assertTypeAvailable('series', true);
        await modal.assertTypeAvailable('shorts', true);

        // Movie must actually accept the selection for a vertical file.
        await modal.selectType('movie');
    });
});

test('Upload video >50mb workflow', { annotation: { type: 'TC', description: 'UPLOAD-006' } }, async ({ page, request }) => {
    test.setTimeout(270_000);
    let user: { email: string; username: string };
    const title = `QA Movie ${Date.now()}`;

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Upload a large (>50mb) Movie end-to-end', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.createMovie({
            filePath: 'test-data/fixtures/video/Video_more50mb.mp4',
            title,
            visibility: 'unlisted',
        });
        await flow.modal.closeSuccess();
    });

    await test.step('Verify the large Movie appears on the Movies tab', async () => {
        const content = new StudioContentPage(page);
        const responsePromise = page.waitForResponse(
            (r) => r.url().includes('studio-videos') && r.status() === 200,
            { timeout: 20_000 },
        );
        await page.goto(`${process.env.STUDIO_URL}/content`, { waitUntil: 'domcontentloaded' });
        await responsePromise;
        await content.clickVideosTab();
        await content.assertVideoRowContainsTitle(title);
    });
});
