import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { setupVideoViaApi, VideoSetupResult } from '../../src/utils/studioTestHelpers';
import { resolveSharedFixture, SharedFixture } from '../fixtures/sharedFixture';

// Desktop-fullscreen action rail (W3-2794): like / dislike / comment / share buttons
// rendered ONLY while the player is in native fullscreen (document.fullscreenElement).
//
// Like/dislike/comment MUTATE the video's state, so those tests run against their OWN
// video seeded via API (never against the shared read-only `@qavischan` fixture).
// Share / guest / panel-lifecycle checks are read-only and reuse the shared fixture.

let fx: SharedFixture;
test.beforeAll(async () => { fx = await resolveSharedFixture(); });

test.describe.serial('Fullscreen rail actions on own video', () => {
    let setup: VideoSetupResult;

    test.beforeAll(async ({ request }) => {
        // Upload + transcode of the seeded video can exceed the default test timeout
        // (processing on dev stands is slow by design).
        test.setTimeout(240_000);
        setup = await setupVideoViaApi(request, { privacySetting: 'public' });
    });

    test('Like from the fullscreen rail sends rate and activates the icon', {
        annotation: { type: 'TC', description: 'FSRAIL-001' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const player = new VideoPlayerPage(page);

        await test.step('Login as the video owner', async () => {
            await authFlow.loginSuccess(setup.user.email, process.env.USER_PASSWORD!, setup.user.username);
        });

        await test.step('Open own video and enter fullscreen', async () => {
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await player.holdPaused();
            await player.enterFullscreen();
            await expect(player.fsActionRail, 'Fullscreen action rail is not visible').toBeVisible({ timeout: 10_000 });
        });

        await test.step('Click like → POST /videos/rate succeeds and the icon becomes active', async () => {
            const ratePromise = page.waitForResponse(
                (r) => {
                    if (!r.url().includes('/videos/rate') || r.request().method() !== 'POST' || !r.ok()) return false;
                    try { return r.request().postDataJSON()?.rating === 'like'; } catch { return false; }
                },
                { timeout: 15_000 }
            );
            await expect(player.fsLikeBtn, 'Like button is not visible').toBeVisible({ timeout: 10_000 });
            await expect(player.fsLikeBtn, 'Like button is not enabled').toBeEnabled();
            await player.fsLikeBtn.click();

            const rateResponse = await ratePromise;
            expect(rateResponse.request().postDataJSON(), 'rate request has a wrong payload')
                .toMatchObject({ rating: 'like' });
            await expect(player.fsLikeIconPath, 'Like icon did not become active (fill stayed "none")')
                .not.toHaveAttribute('fill', 'none');
        });
    });

    test('Dislike from the fullscreen rail overrides the like', {
        annotation: { type: 'TC', description: 'FSRAIL-002' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const player = new VideoPlayerPage(page);

        await test.step('Login as the video owner', async () => {
            await authFlow.loginSuccess(setup.user.email, process.env.USER_PASSWORD!, setup.user.username);
        });

        await test.step('Open own video (liked in FSRAIL-001) and enter fullscreen', async () => {
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await player.holdPaused();
            await player.enterFullscreen();
            await expect(player.fsActionRail, 'Fullscreen action rail is not visible').toBeVisible({ timeout: 10_000 });
        });

        await test.step('Click dislike → rate sent, dislike active, like reset', async () => {
            // Switching like→dislike fires TWO sequential rate POSTs ({rating:'none'} reset
            // first, then {rating:'dislike'}) — filter by payload to await the real one.
            const ratePromise = page.waitForResponse(
                (r) => {
                    if (!r.url().includes('/videos/rate') || r.request().method() !== 'POST' || !r.ok()) return false;
                    try { return r.request().postDataJSON()?.rating === 'dislike'; } catch { return false; }
                },
                { timeout: 15_000 }
            );
            await expect(player.fsDislikeBtn, 'Dislike button is not visible').toBeVisible({ timeout: 10_000 });
            await expect(player.fsDislikeBtn, 'Dislike button is not enabled').toBeEnabled();
            await player.fsDislikeBtn.click();

            await ratePromise;
            await expect(player.fsDislikeIconPath, 'Dislike icon did not become active (fill stayed "none")')
                .not.toHaveAttribute('fill', 'none');
            await expect(player.fsLikeIconPath, 'Like icon did not reset after dislike')
                .toHaveAttribute('fill', 'none');
        });
    });

    test('Comment panel opens in fullscreen and a comment is added', {
        annotation: { type: 'TC', description: 'FSRAIL-003' },
    }, async ({ page }) => {
        const authFlow = new AuthFlow(page);
        const player = new VideoPlayerPage(page);
        const commentText = `Fullscreen comment ${Date.now()}`;

        await test.step('Login as the video owner', async () => {
            await authFlow.loginSuccess(setup.user.email, process.env.USER_PASSWORD!, setup.user.username);
        });

        await test.step('Open own video and enter fullscreen', async () => {
            await page.goto(setup.videoUrl, { waitUntil: 'domcontentloaded' });
            await player.holdPaused();
            await player.enterFullscreen();
        });

        await test.step('Open the comments panel from the rail', async () => {
            await expect(player.fsCommentBtn, 'Comment button is not visible').toBeVisible({ timeout: 10_000 });
            await expect(player.fsCommentBtn, 'Comment button is not enabled').toBeEnabled();
            await player.fsCommentBtn.click();
            await expect(player.commentsPanel, 'Comments panel did not open in fullscreen').toBeVisible({ timeout: 10_000 });
        });

        await test.step('Post a comment → it appears in the panel', async () => {
            await expect(player.commentsPanelInput, 'Comment input is not visible in the panel').toBeVisible({ timeout: 10_000 });
            await expect(player.commentsPanelInput, 'Comment input is not enabled').toBeEnabled();
            await player.commentsPanelInput.fill(commentText);

            const createPromise = page.waitForResponse(
                (r) => r.url().includes('/comments/create') && r.request().method() === 'POST' && r.ok(),
                { timeout: 15_000 }
            );
            await expect(player.commentsPanelSubmitBtn, 'Comment submit button is not visible').toBeVisible({ timeout: 10_000 });
            await expect(player.commentsPanelSubmitBtn, 'Comment submit button is not enabled').toBeEnabled();
            await player.commentsPanelSubmitBtn.click();
            await createPromise;

            await expect(player.commentsPanelBody, 'Posted comment is not shown in the fullscreen panel')
                .toContainText(commentText, { timeout: 10_000 });
        });
    });
});

test.describe('Fullscreen rail — read-only checks on the shared fixture', () => {
    test('Share dialog opens from the fullscreen rail inside fullscreen', {
        annotation: { type: 'TC', description: 'FSRAIL-004' },
    }, async ({ page }) => {
        const player = new VideoPlayerPage(page);

        await test.step('Open the fixture video as guest and enter fullscreen', async () => {
            await page.goto(fx.videoUrl, { waitUntil: 'domcontentloaded' });
            await player.holdPaused();
            await player.enterFullscreen();
        });

        await test.step('Click share → dialog opens, portaled into the fullscreen element', async () => {
            await expect(player.fsShareBtn, 'Share button is not visible').toBeVisible({ timeout: 10_000 });
            await expect(player.fsShareBtn, 'Share button is not enabled').toBeEnabled();
            await player.fsShareBtn.click();

            await expect(player.shareDialog, 'Share dialog did not open from the fullscreen rail').toBeVisible({ timeout: 10_000 });
            await expect(player.shareCopyBtn, 'Copy button is not visible in the share dialog').toBeVisible();
            const portaledIntoFullscreen = await page.evaluate(() =>
                !!document.fullscreenElement?.contains(document.querySelector('[data-testid="aitv-share-dialog"]'))
            );
            expect(portaledIntoFullscreen, 'Share dialog is not rendered inside the fullscreen element').toBe(true);
        });
    });

    test('Guest clicking like in fullscreen gets the auth popup and no rate request', {
        annotation: { type: 'TC', description: 'FSRAIL-005' },
    }, async ({ page }) => {
        const player = new VideoPlayerPage(page);
        let rateRequestFired = false;
        page.on('request', (r) => {
            if (r.url().includes('/videos/rate')) rateRequestFired = true;
        });

        await test.step('Open the fixture video as guest and enter fullscreen', async () => {
            await page.goto(fx.videoUrl, { waitUntil: 'domcontentloaded' });
            await player.holdPaused();
            await player.enterFullscreen();
        });

        await test.step('Click like → auth-required popup opens instead of rating', async () => {
            await expect(player.fsLikeBtn, 'Like button is not visible').toBeVisible({ timeout: 10_000 });
            await expect(player.fsLikeBtn, 'Like button is not enabled').toBeEnabled();
            await player.fsLikeBtn.click();

            await expect(player.authRequiredPopupTitle, 'Auth-required popup did not open for guest')
                .toBeVisible({ timeout: 10_000 });
            expect(rateRequestFired, 'Guest like must not hit the rate endpoint').toBe(false);
        });
    });

    test('Comments panel closes when leaving fullscreen', {
        annotation: { type: 'TC', description: 'FSRAIL-006' },
    }, async ({ page }) => {
        const player = new VideoPlayerPage(page);

        await test.step('Open the fixture video as guest, enter fullscreen, open the comments panel', async () => {
            await page.goto(fx.videoUrl, { waitUntil: 'domcontentloaded' });
            await player.holdPaused();
            await player.enterFullscreen();
            await expect(player.fsCommentBtn, 'Comment button is not visible').toBeVisible({ timeout: 10_000 });
            await expect(player.fsCommentBtn, 'Comment button is not enabled').toBeEnabled();
            await player.fsCommentBtn.click();
            await expect(player.commentsPanel, 'Comments panel did not open in fullscreen').toBeVisible({ timeout: 10_000 });
        });

        await test.step('Exit fullscreen → the panel and the rail unmount', async () => {
            await player.exitFullscreen();
            await expect(player.commentsPanel, 'Comments panel is still mounted after fullscreen exit').toHaveCount(0);
            await expect(player.fsActionRail, 'Action rail is still mounted after fullscreen exit').toHaveCount(0);
        });
    });
});
