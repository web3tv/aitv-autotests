import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { ContentCreationFlow } from '../../src/flows/ContentCreationFlow';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';
import { AuthApi } from '../../src/api/AuthApi';

/** Opens the studio content page and waits for the videos list to load. */
async function openStudioContent(page: import('@playwright/test').Page): Promise<void> {
    const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/videos/studio-videos') && r.status() === 200,
        { timeout: 20_000 }
    );
    await page.goto(`${process.env.STUDIO_URL}/content`, { waitUntil: 'domcontentloaded' });
    await responsePromise;
}

test('Upload video', { tag: '@critical', annotation: { type: 'TC', description: 'UPLOAD-001' } }, async ({ page, request }) => {
    test.setTimeout(240_000);
    let user: { email: string, username: string };
    const title = `QA Movie ${Date.now()}`;

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Upload a public video through the full upload flow and verify on studio content page', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.createMovie({
            filePath: 'test-data/fixtures/video/5secVideo.mp4',
            title,
            visibility: 'public',
        });
        await flow.modal.closeSuccess();

        const studioContentPage = new StudioContentPage(page);
        await openStudioContent(page);
        await studioContentPage.clickVideosTab();
        await studioContentPage.assertVideoRowContainsTitle(title);

        const videoUrl = await studioContentPage.getFirstVideoUrl();
        expect(videoUrl, 'Video URL was not found on studio content page').toBeTruthy();
    });
});

test('Upload short video', { tag: '@critical', annotation: { type: 'TC', description: 'UPLOAD-005' } }, async ({ page, request }) => {
    // FIXME: the "Shorts" type radio stays unselected on the new upload modal (selectType('shorts')
    // never flips aria-checked to true). Un-fixme once the Shorts upload flow is fixed.
    test.fixme();
    test.setTimeout(240_000);
    let user: { email: string, username: string };
    const title = `QA Short ${Date.now()}`;

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Upload a public short and verify on studio content page', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.createShort({
            filePath: 'test-data/fixtures/video/shortsVideo.mp4',
            title,
            visibility: 'private',
        });
        await flow.modal.closeSuccess();

        const studioContentPage = new StudioContentPage(page);
        await openStudioContent(page);
        await studioContentPage.clickShortsTab();
        await studioContentPage.assertVideoRowContainsTitle(title);
    });
});

test('Publish video while still processing', { annotation: { type: 'TC', description: 'UPLOAD-013' } }, async ({ page, request }) => {
    // FIXME: the new stepped upload modal blocks Next/Publish until the source finishes
    // processing ("Video successfully uploaded"), so publishing *while still processing* is no
    // longer possible by design. Revisit this scenario once the expected behaviour is confirmed.
    test.fixme();
    test.setTimeout(180_000);
    const title = `QA Movie ${Date.now()}`;

    await test.step('Create user and login', async () => {
        const user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Publish a video and verify it is still processing on the content page', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.createMovie({
            filePath: 'test-data/fixtures/video/ENGLISH_VIDEO.mp4',
            title,
            visibility: 'public',
        });
        await flow.modal.closeSuccess();

        const studioContentPage = new StudioContentPage(page);
        await openStudioContent(page);
        await studioContentPage.clickVideosTab();
        await studioContentPage.checkVideoStatus('Pending...');
    });
});

test('Upload video >50mb workflow', { annotation: { type: 'TC', description: 'UPLOAD-006' } }, async ({ page, request }) => {
    test.setTimeout(270_000);
    const title = `QA Movie ${Date.now()}`;

    await test.step('Create user and login', async () => {
        const user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Upload a large video through the full upload flow and verify on studio page', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.createMovie({
            filePath: 'test-data/fixtures/video/Video_more50mb.mp4',
            title,
            visibility: 'unlisted',
        });
        await flow.modal.closeSuccess();

        const studioContentPage = new StudioContentPage(page);
        await openStudioContent(page);
        await studioContentPage.clickVideosTab();
        await studioContentPage.assertVideoRowContainsTitle(title);
    });
});
