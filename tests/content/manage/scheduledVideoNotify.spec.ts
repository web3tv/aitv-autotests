import { test, expect } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { VideoApi } from '../../../src/api/VideoApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AitvHomePage } from '../../../src/pages/components/AitvHomePage';

/**
 * Scheduled ("Coming Soon") video → on-platform release notification (W3-2641,
 * reworked in W3-2789).
 *
 * Since W3-2789 the `video_release` notification goes to the author channel's
 * FOLLOWERS that have the `videoReleases` settings toggle on. The per-video
 * "Notify on Release" bell on the Coming Soon card records a subscription but is
 * NOT consumed on publish — it only backs the bell state in the UI (AITV-003).
 *
 * An author schedules a video (publishedAt in the future). It appears in the AI.TV
 * home "Coming Soon" section. A follower of the channel gets a `video_release`
 * notification in the header bell when the cron publishes the video, and the video
 * leaves Coming Soon. A second user follows then unfollows and must NOT receive it.
 *
 * Long test: video upload + processing + up to +2 min until publishedAt + cron.
 */

const PUBLISH_DELAY_MS = 120_000; // publishedAt = now + 2 min (buffer to set up both followers)
const VIDEO_FIXTURE = 'test-data/fixtures/video/5secVideo.mp4';

test.describe.serial('Coming Soon scheduled video — release notification', () => {
    test.describe.configure({ timeout: 600_000 });

    const password = process.env.USER_PASSWORD!;
    let videoId: string;
    let videoTitle: string;
    let coverUuid: string;
    let subBToken: string;

    test('Channel follower receives the release notification when a coming-soon video publishes', {
        annotation: { type: 'TC', description: 'AITV-001' },
    }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);

        let authorToken: string;
        let channelId: string;
        let subA: { email: string; username: string };
        let subAToken: string;
        let subB: { email: string; username: string };

        await test.step('Create author and two followers via API', async () => {
            const author = await authApi.createAndVerifyUser();
            authorToken = await authApi.getUserToken(author.email, password);
            channelId = (await videoApi.getChannelInfo(authorToken)).id;

            subA = await authApi.createAndVerifyUser();
            subAToken = await authApi.getUserToken(subA.email, password);

            subB = await authApi.createAndVerifyUser();
            subBToken = await authApi.getUserToken(subB.email, password);
        });

        await test.step('Author uploads and schedules a coming-soon video (+2 min)', async () => {
            videoTitle = `ComingSoon_${Date.now()}`;
            const categoryId = await videoApi.getCategoryIdBySlug('education');
            const uploaded = await videoApi.uploadVideo(authorToken, VIDEO_FIXTURE, {
                title: videoTitle,
                privacySetting: 'private',
                waitForProcessing: true,
            });
            videoId = uploaded.id;

            const publishAt = new Date(Date.now() + PUBLISH_DELAY_MS).toISOString();
            // privacySetting 'public' here = "intended to go public at publishedAt". Because
            // publishedAt is in the future, the backend keeps the effective privacySettings
            // 'private' (coming-soon) until the publish cron flips it — see assertion below.
            await videoApi.updateVideo(authorToken, videoId, {
                title: videoTitle,
                description: 'Coming soon scheduled release test video',
                privacySetting: 'public',
                publishedAt: publishAt,
                categoryId,
                tags: ['Action', 'Adventure'],
            });

            const v = await videoApi.getVideoById(videoId, authorToken);
            expect(v, 'video should exist after scheduling').toBeTruthy();
            expect(v?.privacySettings, 'video should be coming-soon (not yet public)').toBe('private');
            expect(new Date(v?.publishedAt).getTime(), 'publishedAt should be in the future').toBeGreaterThan(Date.now());
        });

        await test.step('Resolve the coming-soon card cover UUID for the scheduled video', async () => {
            // Coming-soon cards carry no title/slug — locate ours by cover-picture UUID.
            let entry: { id: string; coverPicture: Record<string, string> | null } | undefined;
            for (let i = 0; i < 6; i++) {
                const list = await videoApi.getComingSoon(subAToken);
                entry = list.find(v => v.id === videoId);
                if (entry) break;
                await new Promise(r => setTimeout(r, 3000));
            }
            expect(entry, 'scheduled video should appear in GET /videos/coming-soon').toBeTruthy();
            coverUuid = AitvHomePage.coverUuid(entry!.coverPicture);
        });

        await test.step('Follower A follows the channel and enables release notifications', async () => {
            await videoApi.followChannel(subAToken, channelId);
            await videoApi.enableReleaseNotifications(subAToken);

            // UI presence check while we're pre-publish: the card renders in Coming Soon.
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(subA.email, password, subA.username);
            const home = new AitvHomePage(page);
            await home.goto();
            await home.assertComingSoonSectionVisible();
            await home.waitForComingSoonCard(coverUuid);
        });

        await test.step('User B follows the channel then unfollows before publish', async () => {
            const subBSubscriptionId = await videoApi.followChannel(subBToken, channelId);
            await videoApi.enableReleaseNotifications(subBToken);
            // Unfollow by SUBSCRIPTION id — unfollow by channelId hits an unscoped
            // backend lookup and can delete another user's follow (bug W3-2907).
            await videoApi.unfollowChannel(subBToken, subBSubscriptionId);
        });

        await test.step('Wait for the cron to publish the video', async () => {
            const published = await videoApi.waitForVideoPublished(videoId, authorToken); // up to ~200s
            expect(published, 'video should be published by the cron (privacy becomes public)').toBe(true);
        });

        await test.step('Follower A receives the video_release notification', async () => {
            // Authoritative check: on-platform notification scoped to our video id.
            const notified = await videoApi.waitForReleaseNotification(subAToken, videoId);
            expect(notified, 'follower A should have a video_release notification for the video').toBe(true);

            // UI check: the notification renders in the header bell popup as
            // "<author> released: <video title>".
            const home = new AitvHomePage(page);
            await home.assertReleaseNotificationVisible(new RegExp(`released:\\s*${videoTitle}`, 'i'));
        });

        await test.step('Published video is removed from Coming Soon', async () => {
            let stillPresent = true;
            for (let i = 0; i < 10; i++) {
                const list = await videoApi.getComingSoon(subAToken);
                stillPresent = list.some(v => v.id === videoId);
                if (!stillPresent) break;
                await new Promise(r => setTimeout(r, 3000));
            }
            expect(stillPresent, 'published video should no longer be in Coming Soon').toBe(false);
        });
    });

    // NB: intentionally coupled to AITV-001 via the serial describe — it reuses the same
    // published video and user B (who followed then unfollowed BEFORE publish in AITV-001).
    // Proving "unfollowed user gets no notification" requires that exact prior state, so
    // this must run after AITV-001; it is not standalone by design.
    test('Unfollowed user does not receive the release notification', {
        annotation: { type: 'TC', description: 'AITV-002' },
    }, async ({ request }) => {
        const videoApi = new VideoApi(request);

        await test.step('User B (unfollowed before publish) has no video_release notification', async () => {
            expect(subBToken, 'user B token from AITV-001').toBeTruthy();
            expect(videoId, 'video id from AITV-001').toBeTruthy();

            // Give any (erroneous) notification time to arrive, then assert none exists.
            let leaked = false;
            for (let i = 0; i < 5; i++) {
                const notifs = await videoApi.getNotifications(subBToken);
                leaked = notifs.some(n => n?.type === 'video_release' && n?.payload?.videoId === videoId);
                if (leaked) break;
                await new Promise(r => setTimeout(r, 3000));
            }
            expect(leaked, 'user B unfollowed before publish and must NOT be notified').toBe(false);
        });
    });
});

// Since W3-2789 the bell does NOT deliver notifications (delivery is follower-based, see
// above) — this covers only that the bell UI toggles and its state persists server-side.
test.describe('Coming Soon card — Notify on Release bell', () => {
    test.describe.configure({ timeout: 300_000 });

    test('Bell subscribes/unsubscribes and the state persists', {
        annotation: { type: 'TC', description: 'AITV-003' },
    }, async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const password = process.env.USER_PASSWORD!;

        let viewerToken: string;
        let videoId: string;
        let coverUuid: string;

        await test.step('Author schedules a coming-soon video; create a viewer', async () => {
            const author = await authApi.createAndVerifyUser();
            const authorToken = await authApi.getUserToken(author.email, password);

            const viewer = await authApi.createAndVerifyUser();
            viewerToken = await authApi.getUserToken(viewer.email, password);

            const videoTitle = `ComingSoon_${Date.now()}`;
            const categoryId = await videoApi.getCategoryIdBySlug('education');
            const uploaded = await videoApi.uploadVideo(authorToken, VIDEO_FIXTURE, {
                title: videoTitle,
                privacySetting: 'private',
                waitForProcessing: true,
            });
            videoId = uploaded.id;

            // Far-future publishedAt: the video must stay coming-soon for the whole test.
            await videoApi.updateVideo(authorToken, videoId, {
                title: videoTitle,
                description: 'Coming soon bell-toggle test video',
                privacySetting: 'public',
                publishedAt: new Date(Date.now() + 600_000).toISOString(),
                categoryId,
                tags: ['Action', 'Adventure'],
            });

            let entry: { id: string; coverPicture: Record<string, string> | null } | undefined;
            for (let i = 0; i < 6; i++) {
                const list = await videoApi.getComingSoon(viewerToken);
                entry = list.find(v => v.id === videoId);
                if (entry) break;
                await new Promise(r => setTimeout(r, 3000));
            }
            expect(entry, 'scheduled video should appear in GET /videos/coming-soon').toBeTruthy();
            coverUuid = AitvHomePage.coverUuid(entry!.coverPicture);

            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(viewer.email, password, viewer.username);
        });

        await test.step('Bell subscribes → state persists in the coming-soon listing', async () => {
            const home = new AitvHomePage(page);
            await home.goto();
            await home.assertComingSoonSectionVisible();
            await home.waitForComingSoonCard(coverUuid);
            await home.subscribeToRelease(coverUuid, videoId);

            const entry = (await videoApi.getComingSoon(viewerToken)).find(v => v.id === videoId);
            expect(entry?.isNotifyOnReleaseSubscribed, 'bell subscription should persist server-side').toBe(true);
        });

        await test.step('Bell unsubscribes → state cleared in the coming-soon listing', async () => {
            const home = new AitvHomePage(page);
            await home.unsubscribeFromRelease(coverUuid, videoId);

            const entry = (await videoApi.getComingSoon(viewerToken)).find(v => v.id === videoId);
            expect(entry?.isNotifyOnReleaseSubscribed, 'bell unsubscription should persist server-side').toBe(false);
        });
    });
});
