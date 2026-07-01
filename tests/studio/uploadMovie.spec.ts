import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { ContentCreationFlow } from '../../src/flows/ContentCreationFlow';
import { ContentUploadModal } from '../../src/pages/studio/ContentUploadModal';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';

const LANDSCAPE_VIDEO = 'test-data/fixtures/video/5secVideo.mp4';

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

test('Shorts type is not selectable for a landscape video', {
    annotation: { type: 'TC', description: 'MOVIE-002' },
}, async ({ page, request }) => {
    test.setTimeout(120_000);
    let user: { email: string; username: string };

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Open upload, pick a landscape video and check type availability', async () => {
        const flow = new ContentCreationFlow(page);
        const modal = flow.modal as ContentUploadModal;
        await flow.openNewVideo();
        await modal.selectFile(LANDSCAPE_VIDEO);

        await modal.assertTypeAvailable('movie', true);
        await modal.assertTypeAvailable('series', true);
        await modal.assertTypeAvailable('shorts', false);

        // Clicking the dimmed Shorts type must not switch the form.
        await modal.typeShorts.click();
        await expect(modal.typeShorts, 'Shorts must stay unselected for a landscape video')
            .toHaveAttribute('aria-checked', 'false');
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
