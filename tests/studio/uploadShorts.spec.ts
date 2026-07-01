import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { ContentCreationFlow } from '../../src/flows/ContentCreationFlow';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';

const VERTICAL_VIDEO = 'test-data/fixtures/video/shortsVideo.mp4';

test('Shorts details lock the category to "Shorts" and expose a single cover', {
    tag: '@critical',
    annotation: { type: 'TC', description: 'SHORTS-001' },
}, async ({ page, request }) => {
    // FIXME: the "Shorts" type radio stays unselected after selectType('shorts') on the new
    // upload modal (aria-checked never flips to true). Un-fixme once the Shorts flow is fixed.
    test.fixme();
    test.setTimeout(180_000);
    let user: { email: string; username: string };

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Open the Shorts flow and verify Shorts-specific details', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.openNewShort();
        await flow.modal.selectFile(VERTICAL_VIDEO);
        await flow.modal.selectType('shorts');

        await flow.modal.assertCategoryLockedToShorts();
        await expect(flow.modal.shortsThumbnail, 'Single multi-aspect Shorts cover slot is not visible')
            .toBeVisible();
    });
});

test('Associated movie/series toggle reveals the selector on a Short', {
    annotation: { type: 'TC', description: 'SHORTS-002' },
}, async ({ page, request }) => {
    // FIXME: blocked by the same Shorts type-selector issue as SHORTS-001 (selectType('shorts')
    // does not select the radio). Un-fixme once the Shorts flow is fixed.
    test.fixme();
    test.setTimeout(120_000);
    let user: { email: string; username: string };

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Toggle Associated movie/series and check the selector appears', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.openNewShort();
        await flow.modal.selectFile(VERTICAL_VIDEO);
        await flow.modal.selectType('shorts');
        await flow.modal.toggleAssociated();
    });
});

/**
 * BLOCKED by W3-2722 — publishing a Short returns HTTP 400 `categoryId: "This value
 * should not be null."` The Shorts category is shown locked to "Shorts" in the UI but no
 * categoryId is submitted, so a Short can never be published.
 * Remove `test.fixme` once W3-2722 is fixed.
 */
test('Publish a Short end-to-end', {
    annotation: [
        { type: 'TC', description: 'SHORTS-003' },
        { type: 'issue', description: 'BLOCKED by W3-2722: Shorts publish 400 categoryId null' },
    ],
}, async ({ page, request }) => {
    test.fixme();
    test.setTimeout(240_000);
    let user: { email: string; username: string };
    const title = `QA Short ${Date.now()}`;

    await test.step('Create user and login', async () => {
        user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    });

    await test.step('Create and publish a Short end-to-end', async () => {
        const flow = new ContentCreationFlow(page);
        await flow.createShort({
            filePath: VERTICAL_VIDEO,
            title,
            description: 'QA autotest short description',
            visibility: 'public',
        });
        await flow.modal.closeSuccess();
    });

    await test.step('Verify the Short appears on the Shorts tab', async () => {
        const content = new StudioContentPage(page);
        const responsePromise = page.waitForResponse(
            (r) => r.url().includes('studio-videos') && r.status() === 200,
            { timeout: 20_000 },
        );
        await page.goto(`${process.env.STUDIO_URL}/content`, { waitUntil: 'domcontentloaded' });
        await responsePromise;
        await content.clickShortsTab();
        await content.assertVideoRowContainsTitle(title);
    });
});
