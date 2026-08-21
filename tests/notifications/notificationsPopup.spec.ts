import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { NotificationsPopupPage } from '../../src/pages/components/NotificationsPopupPage';
import { NotificationsHistoryPage } from '../../src/pages/notifications/NotificationsHistoryPage';
import { AccountNotificationsTab } from '../../src/pages/account/AccountNotificationsTab';
import { CommentsApi } from '../../src/api/CommentsApi';
import { SubscriptionApi } from '../../src/api/SubscriptionApi';
import { VideoApi } from '../../src/api/VideoApi';
import { setupVideoViaApi } from '../../src/utils/studioTestHelpers';
import {
    createUserWithChannel,
    NotificationsTestUser,
    seedCommentReplies,
    waitForNotification,
    waitForUnseenCount,
} from '../../src/utils/notificationsTestHelpers';

// AITV header notifications popup (W3-2748, reworked by W3-2785 — unread-only popup +
// /notifications history page). The popup is per-user, so every test seeds its own
// users/notifications via API. Popup-mechanics tests (count, auto-seen, "9+") seed
// `comment_reply` notifications, which the backend still emits immediately — unlike
// follow/like, which W3-2848 now aggregates via an hourly cron (not producible in a
// functional run). The shared @qavischan fixture is never touched.
//
// W3-2785 semantics relied on below: opening the popup auto-marks every rendered row
// `seen` (one batched POST notifications/events) and refreshes the unread counter;
// "Clear All" is rendered only while that counter is > 0; the footer "Show older
// notifications" is a link to /notifications (the paginated history page).

async function loginAs(page: Page, user: NotificationsTestUser): Promise<void> {
    const authFlow = new AuthFlow(page);
    await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
}

/** Predicate for the batched/single POST notifications/events call carrying `event`. */
function eventsResponse(page: Page, event: 'seen' | 'clicked', timeout = 15_000) {
    return page.waitForResponse((r) => {
        if (!r.url().includes('notifications/events') || r.request().method() !== 'POST' || !r.ok()) return false;
        try {
            return r.request().postDataJSON()?.data?.some((e: { event: string }) => e.event === event);
        } catch {
            return false;
        }
    }, { timeout });
}

test('Bell opens the notifications popup with title and controls', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-001' },
}, async ({ page, request }) => {
    const popup = new NotificationsPopupPage(page);

    await test.step('Create user and login', async () => {
        await loginAs(page, await createUserWithChannel(request));
    });

    await test.step('Open the popup from the header bell', async () => {
        await popup.openPopup();
    });

    await test.step('Verify title and controls are rendered', async () => {
        await expect(popup.title, 'Popup title is not visible').toBeVisible();
        await expect(popup.settingsGearBtn, 'Settings gear is not visible').toBeVisible();
        await expect(popup.showAllLink, '"Show older notifications" footer is not visible').toBeVisible();
        // A fresh user has 0 unread → "Clear All" is not rendered at all (W3-2785).
        await expect(popup.clearAllBtn, '"Clear All" must not render with 0 unread').toHaveCount(0);
    });
});

test('Popup closes on Escape and on outside click', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-002' },
}, async ({ page, request }) => {
    const popup = new NotificationsPopupPage(page);

    await test.step('Create user and login', async () => {
        await loginAs(page, await createUserWithChannel(request));
    });

    await test.step('Open → Escape closes the popup', async () => {
        await popup.openPopup();
        await popup.closePopupWithEscape();
    });

    await test.step('Open → clicking outside (backdrop) closes the popup', async () => {
        await popup.openPopup();
        // Point far from the top-right popup; relies on the fixed 1920×1080 desktop
        // viewport and MUI's full-viewport Modal backdrop swallowing the click.
        await page.mouse.click(50, 700);
        await expect(popup.panel, 'Popup did not close on outside click').toBeHidden({ timeout: 10_000 });
    });
});

test('Fresh user sees the empty state, no Clear All and an active Show-older link', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-003' },
}, async ({ page, request }) => {
    const popup = new NotificationsPopupPage(page);

    await test.step('Create user and login', async () => {
        await loginAs(page, await createUserWithChannel(request));
    });

    await test.step('Bell has no unread badge', async () => {
        await popup.assertNoBadge();
    });

    await test.step('Popup shows the empty state, no "Clear All", "Show older" link is active', async () => {
        await popup.openPopup();
        await expect(popup.emptyState, 'Empty state "You\'re all caught up" is not shown').toBeVisible({ timeout: 15_000 });
        await expect(popup.clearAllBtn, '"Clear All" must not render with 0 unread').toHaveCount(0);
        await expect(popup.showAllLink, '"Show older notifications" link is not visible').toBeVisible();
        await expect(popup.showAllLink, '"Show older notifications" link is not enabled').toBeEnabled();
    });
});

test('Unread badge shows the unseen count and the popup lists the rows', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-004' },
}, async ({ page, request }) => {
    test.setTimeout(180_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 3 unseen comment_reply notifications', async () => {
        owner = (await seedCommentReplies(request, 3)).owner;
        await waitForUnseenCount(request, owner.token, 3);
    });

    await test.step('Login → badge shows "3"', async () => {
        await loginAs(page, owner);
        await popup.assertBadge('3');
    });

    // The AITV skin marks unread rows with a row-background highlight, not a per-row
    // dot, so unread state is asserted via the bell badge (the unseen count); here we
    // only assert the popup lists all 3 rows.
    await test.step('Popup renders 3 rows', async () => {
        await popup.openPopup();
        await expect(popup.rowAvatars, 'Expected 3 notification rows').toHaveCount(3, { timeout: 15_000 });
    });
});

// Scope reduced (W3-2848): this originally also asserted "channel follow lands in For
// you", but follow (`channel_subscription`) notifications are now produced only by the
// hourly aggregation cron and cannot be seeded in a functional run — see the fixme'd
// NOTIF-POPUP-007. The comment_reply → Activity placement is kept and still seeded
// synchronously.
test('Comment reply lands in the Activity section', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-005' },
}, async ({ page, request }) => {
    test.setTimeout(180_000);
    const popup = new NotificationsPopupPage(page);
    const commentsApi = new CommentsApi(request);
    const replyText = `Popup reply ${Date.now()}`;
    let owner: NotificationsTestUser;
    let replier: NotificationsTestUser;

    await test.step('Seed: a reply to the owner\'s comment', async () => {
        owner = await createUserWithChannel(request);
        replier = await createUserWithChannel(request);

        const setup = await setupVideoViaApi(request, {
            privacySetting: 'public',
            waitForProcessing: false,
            existingUser: { email: owner.email, username: owner.username },
        });
        const parent = await commentsApi.createComment(owner.token, {
            videoId: setup.videoId,
            textOriginal: 'Parent comment for the reply notification',
        });
        await commentsApi.createComment(replier.token, {
            videoId: setup.videoId,
            textOriginal: replyText,
            parentId: parent.id,
            channelId: replier.channelId,
        });

        await waitForNotification(request, owner.token, (n) => n.type === 'comment_reply' && n.payload?.commentText === replyText);
    });

    await test.step('Login and open the popup', async () => {
        await loginAs(page, owner);
        await popup.openPopup();
    });

    await test.step('The reply renders in the Activity section', async () => {
        await expect(popup.activityHeader, 'ACTIVITY section header is not visible').toBeVisible({ timeout: 15_000 });
        await expect(popup.rowByText(replier.username), 'Reply row (replier username) is not shown').toBeVisible();
        await expect(popup.rowByText(replyText), 'Reply text is not shown').toBeVisible();
    });
});

// W3-2785: rows are no longer marked seen on hover — every row rendered in the popup is
// auto-marked seen as soon as the popup opens.
test('Opening the popup marks the rendered row seen and clears the badge', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-006' },
}, async ({ page, request }) => {
    test.setTimeout(120_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 1 unseen comment_reply notification → badge "1"', async () => {
        owner = (await seedCommentReplies(request, 1)).owner;
        await waitForUnseenCount(request, owner.token, 1);
        await loginAs(page, owner);
        await popup.assertBadge('1');
    });

    await test.step('Open the popup → the row renders, a seen event fires, the badge disappears', async () => {
        const seenPromise = eventsResponse(page, 'seen');
        await popup.openPopup();
        await expect(popup.rowAvatars.first(), 'Notification row is not visible').toBeVisible({ timeout: 15_000 });
        const response = await seenPromise;
        expect(response.request().postDataJSON().data.length, 'Exactly 1 notification must be marked seen').toBe(1);
        await popup.assertNoBadge();
    });
});

// BLOCKED (W3-2848): this asserts a FOLLOW notification's click → /studio navigation,
// but follow (`channel_subscription`) notifications are now produced only by the hourly
// `notifications:aggregate-grouped` cron — they cannot be seeded synchronously in a
// functional run. A comment_reply row navigates to the video, not the studio, so it is
// not a substitute. Re-enable once a follow notification can be produced on demand.
test.fixme('Clicking a follow notification emits clicked and navigates to the studio', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-007' },
}, async ({ page, request }) => {
    test.setTimeout(120_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 1 follow notification and open the popup', async () => {
        owner = (await seedCommentReplies(request, 1)).owner;
        await waitForUnseenCount(request, owner.token, 1);
        await loginAs(page, owner);
        await popup.openPopup();
    });

    await test.step('Click the row → clicked event + navigation to /studio', async () => {
        const clickedPromise = eventsResponse(page, 'clicked');
        const row = popup.rowByText('subscribed to your channel');
        await expect(row, 'Follow notification row is not visible').toBeVisible({ timeout: 15_000 });
        await expect(row, 'Follow notification row is not enabled').toBeEnabled();
        await row.click();
        await clickedPromise;
        await page.waitForURL(/\/studio/, { timeout: 30_000 });
    });
});

// W3-2785: the explicit "Clear All" sweep is not exercised — the popup auto-loads all
// unseen pages and marks every rendered row seen on open, so the unread counter drops to
// 0 and the button unmounts before a test could click it. This covers the bulk auto-seen
// path instead: one batched events call, badge reset, "Clear All" gone, seen persists.
test('Opening the popup marks all unread rows seen in one batch and persists', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-008' },
}, async ({ page, request }) => {
    test.setTimeout(180_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 4 unseen comment_reply notifications', async () => {
        owner = (await seedCommentReplies(request, 4)).owner;
        await waitForUnseenCount(request, owner.token, 4);
    });

    await test.step('Login → badge "4"', async () => {
        await loginAs(page, owner);
        await popup.assertBadge('4');
    });

    await test.step('Open the popup → 4 rows, one batched seen call, badge resets, "Clear All" unmounts', async () => {
        const seenPromise = eventsResponse(page, 'seen');
        await popup.openPopup();
        await expect(popup.rowAvatars, 'Expected 4 notification rows').toHaveCount(4, { timeout: 15_000 });
        const response = await seenPromise;
        expect(response.request().postDataJSON().data.length, 'All 4 notifications must be marked in one batch').toBe(4);

        await popup.assertNoBadge();
        await expect(popup.clearAllBtn, '"Clear All" must unmount once the unread counter is 0').toHaveCount(0, { timeout: 10_000 });
    });

    await test.step('Seen state persists after reload', async () => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await popup.assertNoBadge();
    });
});

test('Settings gear navigates to the notification settings page', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-009' },
}, async ({ page, request }) => {
    const popup = new NotificationsPopupPage(page);

    await test.step('Create user, login, open the popup', async () => {
        await loginAs(page, await createUserWithChannel(request));
        await popup.openPopup();
    });

    await test.step('Click the gear → notification settings (/account?tab=notifications)', async () => {
        await expect(popup.settingsGearBtn, 'Settings gear is not visible').toBeVisible();
        await expect(popup.settingsGearBtn, 'Settings gear is not enabled').toBeEnabled();
        await popup.settingsGearBtn.click();
        await page.waitForURL(/\/account\?tab=notifications/, { timeout: 30_000 });
    });
});

test('"Show older notifications" footer opens the notifications history page', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-010' },
}, async ({ page, request }) => {
    const popup = new NotificationsPopupPage(page);
    const history = new NotificationsHistoryPage(page);

    await test.step('Create user, login, open the popup', async () => {
        await loginAs(page, await createUserWithChannel(request));
        await popup.openPopup();
    });

    await test.step('Click the footer link → /notifications', async () => {
        await expect(popup.showAllLink, '"Show older notifications" is not visible').toBeVisible();
        await expect(popup.showAllLink, '"Show older notifications" is not enabled').toBeEnabled();
        await popup.showAllLink.click();
        await history.assertOpened();
    });

    await test.step('History page renders header, Settings link and the empty state for a fresh user', async () => {
        await expect(history.title, 'History page title is not visible').toBeVisible();
        await expect(history.subtitle, 'History page subtitle is not visible').toBeVisible();
        await expect(history.emptyState, 'History empty state is not shown for a fresh user').toBeVisible({ timeout: 15_000 });
        await expect(history.pagination, 'Pagination must not render for an empty history').toHaveCount(0);
    });
});

test('Upload by a followed channel produces a For-you notification that opens the video', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-011' },
}, async ({ page, request }) => {
    // The only transcode-heavy case: the notification fires once the uploaded video is
    // processed/published, and processing on dev stands is slow by design.
    test.setTimeout(420_000);
    const popup = new NotificationsPopupPage(page);
    const subscriptionApi = new SubscriptionApi(request);
    const videoApi = new VideoApi(request);
    let viewer: NotificationsTestUser;
    let videoSlugPath: string;

    await test.step('Viewer follows a channel, the channel uploads a video', async () => {
        viewer = await createUserWithChannel(request);
        const creator = await createUserWithChannel(request);
        await subscriptionApi.followChannel(viewer.token, creator.channelId);
        // Release notifications are gated by the `videoReleases` toggle (W3-2789) —
        // set it explicitly so the test does not rely on the backend default.
        await videoApi.enableReleaseNotifications(viewer.token);

        const setup = await setupVideoViaApi(request, {
            privacySetting: 'public',
            waitForProcessing: true,
            existingUser: { email: creator.email, username: creator.username },
        });
        videoSlugPath = new URL(setup.videoUrl).pathname;

        // A public upload is published by the same hourly-independent publishing cron
        // (setPublished only runs there), which fires `video_release` to the channel's
        // followers once processing completes.
        await waitForNotification(
            request,
            viewer.token,
            (n) => n.type === 'video_release',
            { maxAttempts: 40, intervalMs: 5000 }
        );
    });

    await test.step('Login → the release notification is rendered in For you', async () => {
        await loginAs(page, viewer);
        await popup.openPopup();
        await expect(popup.forYouHeader, 'FOR YOU section header is not visible').toBeVisible({ timeout: 15_000 });
        // The release row reads "<creator> released: <title>" (W3-2789 wording).
        await expect(
            popup.rowByText(/released:/i),
            'Release notification row is not shown'
        ).toBeVisible({ timeout: 15_000 });
    });

    await test.step('Click the row → navigates to the released video', async () => {
        const row = popup.rowByText(/released:/i);
        await expect(row, 'Release notification row is not visible').toBeVisible({ timeout: 15_000 });
        await expect(row, 'Release notification row is not enabled').toBeEnabled();
        await row.click();
        await page.waitForURL((url) => url.pathname === videoSlugPath, { timeout: 30_000 });
    });
});

test('Unread badge caps at "9+" beyond nine unseen notifications', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-012' },
}, async ({ page, request }) => {
    // Seeding 10 comment_reply notifications creates 11 users; on the per-IP registration
    // rate limit (W3-2908) the burst backs off, so allow a generous budget.
    test.setTimeout(420_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 10 unseen comment_reply notifications', async () => {
        owner = (await seedCommentReplies(request, 10)).owner;
        await waitForUnseenCount(request, owner.token, 10);
    });

    await test.step('Login → badge shows "9+"', async () => {
        await loginAs(page, owner);
        await popup.assertBadge('9+');
    });
});

test('Notification settings toggles default ON and persist', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-013' },
}, async ({ page, request }) => {
    const settings = new AccountNotificationsTab(page);
    let user: NotificationsTestUser;

    await test.step('Open /account?tab=notifications → all website toggles default ON', async () => {
        user = await createUserWithChannel(request);
        await loginAs(page, user);
        await settings.goto();
        await settings.assertToggle(settings.videoReleasesToggle, true, 'Video Releases');
        await settings.assertToggle(settings.commentMentionsToggle, true, 'Comment Mentions');
        await settings.assertToggle(settings.subscriptionsToggle, true, 'Subscriptions');
        await settings.assertToggle(settings.allEmailsToggle, true, 'All Emails');
    });

    await test.step('Toggle Video Releases OFF → persists after reload, others untouched', async () => {
        await settings.toggle(settings.videoReleasesToggle, 'Video Releases');
        await settings.assertToggle(settings.videoReleasesToggle, false, 'Video Releases');

        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(settings.tab, 'Notifications tab did not re-render').toBeVisible({ timeout: 15_000 });
        await settings.assertToggle(settings.videoReleasesToggle, false, 'Video Releases');
        // The UI PUTs the full settings object, so the other toggles stay ON.
        await settings.assertToggle(settings.subscriptionsToggle, true, 'Subscriptions');
    });

    await test.step('Toggle Video Releases back ON → persists after reload', async () => {
        await settings.toggle(settings.videoReleasesToggle, 'Video Releases');
        await settings.assertToggle(settings.videoReleasesToggle, true, 'Video Releases');

        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(settings.tab, 'Notifications tab did not re-render').toBeVisible({ timeout: 15_000 });
        await settings.assertToggle(settings.videoReleasesToggle, true, 'Video Releases');
    });
});
