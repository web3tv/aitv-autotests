import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { NotificationsPopupPage } from '../../src/pages/components/NotificationsPopupPage';
import { CommentsApi } from '../../src/api/CommentsApi';
import { SubscriptionApi } from '../../src/api/SubscriptionApi';
import { setupVideoViaApi } from '../../src/utils/studioTestHelpers';
import {
    createUserWithChannel,
    NotificationsTestUser,
    seedFollowers,
    waitForNotification,
    waitForUnseenCount,
} from '../../src/utils/notificationsTestHelpers';

// AITV header notifications popup (W3-2748). The popup is per-user, so every test
// seeds its own users/notifications via API (free follow → `channel_subscription`,
// comment reply → `comment_reply`, upload by a followed channel → `subscription`).
// The shared @qavischan fixture is never touched.

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
        await expect(popup.markAllAsReadBtn, '"Mark all as read" button is not visible').toBeVisible();
        await expect(popup.settingsGearBtn, 'Settings gear is not visible').toBeVisible();
        await expect(popup.showOlderBtn, '"Show older notifications" footer is not visible').toBeVisible();
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

test('Fresh user sees the empty state and disabled controls', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-003' },
}, async ({ page, request }) => {
    const popup = new NotificationsPopupPage(page);

    await test.step('Create user and login', async () => {
        await loginAs(page, await createUserWithChannel(request));
    });

    await test.step('Bell has no unread badge', async () => {
        await popup.assertNoBadge();
    });

    await test.step('Popup shows the empty state, Mark-all and Show-older are disabled', async () => {
        await popup.openPopup();
        await expect(popup.emptyState, 'Empty state "You\'re all caught up" is not shown').toBeVisible({ timeout: 15_000 });
        await expect(popup.markAllAsReadBtn, '"Mark all as read" must be disabled with 0 unread').toBeDisabled();
        await expect(popup.showOlderBtn, '"Show older notifications" stub must be disabled').toBeDisabled();
    });
});

test('Unread badge shows the unseen count and rows show unread dots', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-004' },
}, async ({ page, request }) => {
    test.setTimeout(180_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 3 followers → 3 unseen channel_subscription notifications', async () => {
        owner = await createUserWithChannel(request);
        await seedFollowers(request, owner.channelId, 3);
        await waitForUnseenCount(request, owner.token, 3);
    });

    await test.step('Login → badge shows "3"', async () => {
        await loginAs(page, owner);
        await popup.assertBadge('3');
    });

    await test.step('Popup renders 3 rows, each with an unread dot', async () => {
        await popup.openPopup();
        await expect(popup.rowAvatars, 'Expected 3 notification rows').toHaveCount(3, { timeout: 15_000 });
        await expect
            .poll(() => popup.countUnreadDots(), { message: 'Expected 3 unread dots', timeout: 10_000 })
            .toBe(3);
    });
});

test('Comment reply lands in Mentions, channel follow lands in For you', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-005' },
}, async ({ page, request }) => {
    test.setTimeout(180_000);
    const popup = new NotificationsPopupPage(page);
    const commentsApi = new CommentsApi(request);
    const subscriptionApi = new SubscriptionApi(request);
    const replyText = `Popup reply ${Date.now()}`;
    let owner: NotificationsTestUser;
    let replier: NotificationsTestUser;

    await test.step('Seed: reply to the owner\'s comment + follow the owner\'s channel', async () => {
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
        await subscriptionApi.followChannel(replier.token, owner.channelId);

        await waitForNotification(request, owner.token, (n) => n.type === 'comment_reply' && n.payload?.commentText === replyText);
        await waitForNotification(request, owner.token, (n) => n.type === 'channel_subscription');
    });

    await test.step('Login and open the popup', async () => {
        await loginAs(page, owner);
        await popup.openPopup();
    });

    await test.step('Both sections render with the right rows', async () => {
        await expect(popup.mentionsHeader, 'MENTIONS section header is not visible').toBeVisible({ timeout: 15_000 });
        await expect(popup.forYouHeader, 'FOR YOU section header is not visible').toBeVisible();
        await expect(popup.rowByText(`${replier.username} commented:`), 'Reply row is not shown in Mentions').toBeVisible();
        await expect(popup.rowByText(`“${replyText}”`), 'Reply text is not shown').toBeVisible();
        await expect(popup.rowByText('subscribed to your channel'), 'Follow row is not shown in For you').toBeVisible();
    });
});

test('Hovering an unread row marks it seen', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-006' },
}, async ({ page, request }) => {
    test.setTimeout(120_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 1 unseen follow notification and open the popup', async () => {
        owner = await createUserWithChannel(request);
        await seedFollowers(request, owner.channelId, 1);
        await waitForUnseenCount(request, owner.token, 1);
        await loginAs(page, owner);
        await popup.openPopup();
        await expect
            .poll(() => popup.countUnreadDots(), { message: 'Expected 1 unread dot before hover', timeout: 10_000 })
            .toBe(1);
    });

    await test.step('Hover the row → seen event fires, dot and badge disappear', async () => {
        const seenPromise = eventsResponse(page, 'seen');
        const row = popup.rowByText('subscribed to your channel');
        await expect(row, 'Follow notification row is not visible').toBeVisible({ timeout: 15_000 });
        await expect(row, 'Follow notification row is not enabled').toBeEnabled();
        await row.hover();
        await seenPromise;

        await expect
            .poll(() => popup.countUnreadDots(), { message: 'Unread dot did not disappear after hover', timeout: 10_000 })
            .toBe(0);
        await popup.assertNoBadge();
    });
});

test('Clicking a follow notification emits clicked and navigates to the studio', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-007' },
}, async ({ page, request }) => {
    test.setTimeout(120_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 1 follow notification and open the popup', async () => {
        owner = await createUserWithChannel(request);
        await seedFollowers(request, owner.channelId, 1);
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

test('Mark all as read clears dots, resets the badge and persists', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-008' },
}, async ({ page, request }) => {
    test.setTimeout(180_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 4 unseen follow notifications', async () => {
        owner = await createUserWithChannel(request);
        await seedFollowers(request, owner.channelId, 4);
        await waitForUnseenCount(request, owner.token, 4);
    });

    await test.step('Login → badge "4", popup shows 4 unread dots', async () => {
        await loginAs(page, owner);
        await popup.assertBadge('4');
        await popup.openPopup();
        await expect
            .poll(() => popup.countUnreadDots(), { message: 'Expected 4 unread dots', timeout: 10_000 })
            .toBe(4);
    });

    await test.step('Mark all as read → batched seen events, badge resets, button disables', async () => {
        const seenPromise = eventsResponse(page, 'seen');
        await expect(popup.markAllAsReadBtn, '"Mark all as read" is not visible').toBeVisible();
        await expect(popup.markAllAsReadBtn, '"Mark all as read" is not enabled').toBeEnabled();
        await popup.markAllAsReadBtn.click();
        const response = await seenPromise;
        expect(response.request().postDataJSON().data.length, 'All 4 notifications must be marked in one batch').toBe(4);

        await popup.assertNoBadge();
        await expect(popup.markAllAsReadBtn, '"Mark all as read" must disable after clearing').toBeDisabled({ timeout: 10_000 });
        await expect
            .poll(() => popup.countUnreadDots(), { message: 'Unread dots remained after mark-all', timeout: 10_000 })
            .toBe(0);
    });

    await test.step('Seen state persists after reload', async () => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await popup.assertNoBadge();
        await popup.openPopup();
        await expect
            .poll(() => popup.countUnreadDots(), { message: 'Unread dots reappeared after reload', timeout: 10_000 })
            .toBe(0);
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

    await test.step('Click the gear → /notifications', async () => {
        await expect(popup.settingsGearBtn, 'Settings gear is not visible').toBeVisible();
        await expect(popup.settingsGearBtn, 'Settings gear is not enabled').toBeEnabled();
        await popup.settingsGearBtn.click();
        await page.waitForURL(/\/notifications/, { timeout: 30_000 });
    });
});

test('"Show older notifications" footer is a disabled stub', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-010' },
}, async ({ page, request }) => {
    const popup = new NotificationsPopupPage(page);

    await test.step('Create user, login, open the popup', async () => {
        await loginAs(page, await createUserWithChannel(request));
        await popup.openPopup();
    });

    await test.step('Footer button is rendered but disabled (history page is out of v1)', async () => {
        await expect(popup.showOlderBtn, '"Show older notifications" is not visible').toBeVisible();
        await expect(popup.showOlderBtn, '"Show older notifications" stub must be disabled').toBeDisabled();
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
    let viewer: NotificationsTestUser;
    let videoSlugPath: string;

    await test.step('Viewer follows a channel, the channel uploads a video', async () => {
        viewer = await createUserWithChannel(request);
        const creator = await createUserWithChannel(request);
        await subscriptionApi.followChannel(viewer.token, creator.channelId);

        const setup = await setupVideoViaApi(request, {
            privacySetting: 'public',
            waitForProcessing: true,
            existingUser: { email: creator.email, username: creator.username },
        });
        videoSlugPath = new URL(setup.videoUrl).pathname;

        await waitForNotification(
            request,
            viewer.token,
            (n) => ['subscription', 'video_release', 'recommended_video'].includes(n.type),
            { maxAttempts: 40, intervalMs: 5000 }
        );
    });

    await test.step('Login → the upload notification is rendered in For you', async () => {
        await loginAs(page, viewer);
        await popup.openPopup();
        await expect(popup.forYouHeader, 'FOR YOU section header is not visible').toBeVisible({ timeout: 15_000 });
        await expect(
            popup.rowByText(/uploaded a new video|published a new video/),
            'Upload notification row is not shown'
        ).toBeVisible({ timeout: 15_000 });
    });

    await test.step('Click the row → navigates to the uploaded video', async () => {
        const row = popup.rowByText(/uploaded a new video|published a new video/);
        await expect(row, 'Upload notification row is not visible').toBeVisible({ timeout: 15_000 });
        await expect(row, 'Upload notification row is not enabled').toBeEnabled();
        await row.click();
        await page.waitForURL((url) => url.pathname === videoSlugPath, { timeout: 30_000 });
    });
});

test('Unread badge caps at "9+" beyond nine unseen notifications', {
    annotation: { type: 'TC', description: 'NOTIF-POPUP-012' },
}, async ({ page, request }) => {
    test.setTimeout(300_000);
    const popup = new NotificationsPopupPage(page);
    let owner: NotificationsTestUser;

    await test.step('Seed 10 unseen follow notifications', async () => {
        owner = await createUserWithChannel(request);
        await seedFollowers(request, owner.channelId, 10);
        await waitForUnseenCount(request, owner.token, 10);
    });

    await test.step('Login → badge shows "9+"', async () => {
        await loginAs(page, owner);
        await popup.assertBadge('9+');
    });
});
