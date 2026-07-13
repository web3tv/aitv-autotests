import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';
import { createMailHelper, assertEmailBasics } from '../../src/utils/mailHelper';

/**
 * Pre-subscribed ("Coming Soon") видео → email-уведомление о публикации (W3-2662).
 * Поток: автор грузит видео и переводит его в coming-soon (publishedAt в будущем),
 * подписчик включает email-уведомления и pre-subscribe'ится; крон публикации
 * (раз в минуту) публикует видео по наступлении publishedAt → подписчику уходит
 * письмо "Video released". Проверяем факт публикации и контент письма.
 *
 * Тест долгий: загрузка+обработка видео + буфер до publishedAt + до 60с на крон.
 */

const PUBLISH_DELAY_MS = 70_000; // буфер от schedule до publishedAt (> времени на pre-subscribe)

test.describe.serial('Coming Soon video — release email notification', { tag: '@emails' }, () => {
    test.describe.configure({ timeout: 480_000 });

    test('Pre-subscribed user receives release email when coming-soon video publishes', {
        annotation: { type: 'TC', description: 'EMAIL-006' },
    }, async ({ request }) => {
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const mailHelper = createMailHelper(request);
        const password = process.env.USER_PASSWORD!;

        let authorToken: string;
        let subToken: string;
        let subMailToken: string;
        let videoId: string;
        let videoTitle: string;
        let channelHandle: string;

        await test.step('Create author and subscriber via API', async () => {
            const author = await authApi.createAndVerifyUser();
            authorToken = await authApi.getUserToken(author.email, password);

            const sub = await authApi.createAndVerifyUser();
            subToken = await authApi.getUserToken(sub.email, password);
            subMailToken = sub.mailToken;

            const channel = await videoApi.getChannelInfo(authorToken);
            channelHandle = channel.handle;
        });

        await test.step('Author uploads video and schedules it as coming-soon', async () => {
            videoTitle = `ComingSoon_${Date.now()}`;
            const uploaded = await videoApi.uploadVideo(authorToken, 'test-data/fixtures/video/5secVideo.mp4', {
                title: videoTitle,
                privacySetting: 'private',
                waitForProcessing: true,
            });
            videoId = uploaded.id;

            const publishAt = new Date(Date.now() + PUBLISH_DELAY_MS).toISOString();
            await videoApi.updateVideo(authorToken, videoId, {
                title: videoTitle,
                description: 'Coming soon release test video',
                privacySetting: 'public',
                publishedAt: publishAt,
            });

            const v = await videoApi.getVideoById(videoId, authorToken);
            // coming-soon: текущее privacy ещё private, публичность применится при публикации (publishedAt в будущем)
            expect(v?.privacySettings, 'video should be coming-soon (not yet public)').toBe('private');
            expect(new Date(v?.publishedAt).getTime(), 'publishedAt should be in the future').toBeGreaterThan(Date.now());
        });

        await test.step('Subscriber enables release notifications and pre-subscribes', async () => {
            await videoApi.enableReleaseNotifications(subToken);
            await videoApi.subscribeToVideoRelease(subToken, videoId);
        });

        await test.step('Wait for cron to publish the video', async () => {
            // публикация = крон применил отложенный public: privacySettings переходит private -> public
            let published = false;
            for (let i = 0; i < 40; i++) { // до ~200с (publishedAt 70с + крон до 60с + запас)
                const v = await videoApi.getVideoById(videoId, authorToken);
                if (v?.privacySettings === 'public') { published = true; break; }
                await new Promise(r => setTimeout(r, 5000));
            }
            expect(published, 'video should be published by the cron (privacy becomes public)').toBe(true);
        });

        await test.step('Subscriber receives the release email with correct content', async () => {
            const messageId = await mailHelper.waitForMessage(subMailToken, 'Video released', 20, 3000);
            const email = await mailHelper.getMessage(messageId, subMailToken);

            assertEmailBasics(email, { subject: 'Video released' });
            expect(email.text, 'email mentions the video title').toContain(videoTitle);
            expect(email.text, 'email mentions the channel handle').toContain(channelHandle);
            expect(email.text, 'release wording ("just dropped")').toMatch(/just dropped/i);
        });
    });
});
