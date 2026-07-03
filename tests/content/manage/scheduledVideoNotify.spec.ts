import { test, expect, type BrowserContext } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { VideoApi } from '../../../src/api/VideoApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AitvHomePage } from '../../../src/pages/components/AitvHomePage';

/**
 * Scheduled ("Coming Soon") video → notify-on-release → on-platform release
 * notification (W3-2641).
 *
 * An author schedules a video (publishedAt in the future). It appears in the AI.TV
 * home "Coming Soon" section. A subscriber clicks the card's "Notify on Release"
 * bell; when the cron publishes the video, that subscriber gets a `video_release`
 * notification in the header bell and the video leaves Coming Soon. A second
 * subscriber subscribes then unsubscribes and must NOT receive the notification.
 *
 * Long test: video upload + processing + up to +2 min until publishedAt + cron.
 */

const PUBLISH_DELAY_MS = 120_000; // publishedAt = now + 2 min (buffer to set up both subscribers)
const VIDEO_FIXTURE = 'test-data/fixtures/video/5secVideo.mp4';

test.describe.serial('Coming Soon scheduled video — release notification', () => {
    test.describe.configure({ timeout: 600_000 });

    const password = process.env.USER_PASSWORD!;
    let videoId: string;
    let videoTitle: string;
    let coverUuid: string;
    let subBToken: string;

    test('Subscribed user receives the release notification when a coming-soon video publishes', {
        annotation: { type: 'TC', description: 'AITV-001' },
    }, async ({ page, browser, request }) => {
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);

        let authorToken: string;
        let subA: { email: string; username: string };
        let subAToken: string;
        let subB: { email: string; username: string };

        await test.step('Create author and two subscribers via API', async () => {
            const author = await authApi.createAndVerifyUser();
            authorToken = await authApi.getUserToken(author.email, password);

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

        await test.step('Subscriber A subscribes to release via the Coming Soon bell', async () => {
            const authFlow = new AuthFlow(page);
            await authFlow.loginSuccess(subA.email, password, subA.username);

            const home = new AitvHomePage(page);
            await home.goto();
            await home.assertComingSoonSectionVisible();
            await home.waitForComingSoonCard(coverUuid);
            await home.subscribeToRelease(coverUuid, videoId);
        });

        await test.step('Subscriber B subscribes then unsubscribes via the Coming Soon bell', async () => {
            const contextB: BrowserContext = await browser.newContext();
            try {
                const pageB = await contextB.newPage();
                const authFlowB = new AuthFlow(pageB);
                await authFlowB.loginSuccess(subB.email, password, subB.username);

                const homeB = new AitvHomePage(pageB);
                await homeB.goto();
                await homeB.assertComingSoonSectionVisible();
                await homeB.waitForComingSoonCard(coverUuid);
                await homeB.subscribeToRelease(coverUuid, videoId);
                await homeB.unsubscribeFromRelease(coverUuid, videoId);
            } finally {
                await contextB.close();
            }
        });

        await test.step('Wait for the cron to publish the video', async () => {
            const published = await videoApi.waitForVideoPublished(videoId, authorToken); // up to ~200s
            expect(published, 'video should be published by the cron (privacy becomes public)').toBe(true);
        });

        await test.step('Subscriber A receives the video_release notification', async () => {
            // Authoritative check: on-platform notification scoped to our video id.
            const notified = await videoApi.waitForReleaseNotification(subAToken, videoId);
            expect(notified, 'subscriber A should have a video_release notification for the video').toBe(true);

            // UI check: the notification renders in the header bell popup.
            const home = new AitvHomePage(page);
            await home.assertReleaseNotificationVisible(/Published a new video/i);
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
    // published video and subscriber B (who subscribed then unsubscribed BEFORE publish in
    // AITV-001). Proving "unsubscribed user gets no notification" requires that exact prior
    // state, so this must run after AITV-001; it is not standalone by design.
    test('Unsubscribed user does not receive the release notification', {
        annotation: { type: 'TC', description: 'AITV-002' },
    }, async ({ request }) => {
        const videoApi = new VideoApi(request);

        await test.step('Subscriber B (unsubscribed before publish) has no video_release notification', async () => {
            expect(subBToken, 'subscriber B token from AITV-001').toBeTruthy();
            expect(videoId, 'video id from AITV-001').toBeTruthy();

            // Give any (erroneous) notification time to arrive, then assert none exists.
            let leaked = false;
            for (let i = 0; i < 5; i++) {
                const notifs = await videoApi.getNotifications(subBToken);
                leaked = notifs.some(n => n?.type === 'video_release' && n?.payload?.videoId === videoId);
                if (leaked) break;
                await new Promise(r => setTimeout(r, 3000));
            }
            expect(leaked, 'subscriber B unsubscribed before publish and must NOT be notified').toBe(false);
        });
    });
});
