import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';
import { DatabaseHelper } from '../../src/api/DatabaseHelper';

const ENGLISH_VIDEO_PATH = 'test-data/fixtures/video/ENGLISH_VIDEO.mp4';
const SHORT_VIDEO_PATH = 'test-data/fixtures/video/shortsVideo.MOV';

test.describe('Video chapters — English video', () => {
    // dev2 транскод одного ролика гуляет ~400–600s+ (замер 2026-07-16), генерация глав мгновенна.
    // Бутылочное горлышко — waitForProcessing в beforeAll; 900s даёт запас над разбросом.
    test.describe.configure({ timeout: 900_000 });

    let token: string;
    let videoId: string;
    let videoTitle: string;
    let chapters: Array<{ startTime: number; title: string }>;
    let user: { id?: string; email: string; username: string };

    test.beforeAll(async ({ request }, testInfo) => {
        testInfo.setTimeout(900_000);
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const password = process.env.USER_PASSWORD!;

        user = await authApi.createUserFast();
        token = await authApi.getUserToken(user.email, password);

        videoTitle = `Chapters_${Date.now()}`;
        const video = await videoApi.uploadVideo(token, ENGLISH_VIDEO_PATH, {
            title: videoTitle,
            description: 'Auto-chapters test video',
            privacySetting: 'public',
            waitForProcessing: false,
        });
        videoId = video.id;

        await videoApi.waitForProcessing(token, videoId, 'video', 150, 5_000);
        chapters = await videoApi.waitForChapters(videoId, token);
    });

    test('Chapters array is non-empty and ordered by start_time', {
        annotation: { type: 'TC', description: 'CHAP-001' },
    }, async ({ request }) => {
        const videoApi = new VideoApi(request);

        await test.step('Verify chapters array structure', async () => {
            expect(chapters.length, 'Chapters array should not be empty').toBeGreaterThan(0);

            for (const chapter of chapters) {
                expect(typeof chapter.startTime, 'Chapter startTime should be a number').toBe('number');
                expect(chapter.startTime, 'Chapter startTime should be non-negative').toBeGreaterThanOrEqual(0);
                expect(typeof chapter.title, 'Chapter title should be a string').toBe('string');
                expect(chapter.title.length, 'Chapter title should not be empty').toBeGreaterThan(0);
            }
        });

        await test.step('Verify chapters are sorted by startTime ascending', async () => {
            for (let i = 1; i < chapters.length; i++) {
                expect(
                    chapters[i].startTime,
                    `Chapter ${i} startTime (${chapters[i].startTime}) should be >= chapter ${i - 1} startTime (${chapters[i - 1].startTime})`
                ).toBeGreaterThanOrEqual(chapters[i - 1].startTime);
            }
        });

        await test.step('Verify chapters_enabled is true', async () => {
            const videoItem = await videoApi.getVideoById(videoId, token);
            expect(videoItem.chapters_enabled, 'chapters_enabled should be true').toBe(true);
        });
    });

    test('Creator receives chapters_generation_success notification via API', {
        annotation: { type: 'TC', description: 'CHAP-002' },
    }, async ({ request }) => {
        const videoApi = new VideoApi(request);

        await test.step('Poll notifications API for chapters_generation_success', async () => {
            const maxAttempts = 18;
            const intervalMs = 5_000;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                const notifications = await videoApi.getNotifications(token);
                const chaptersNotification = notifications.find(
                    (n: { type?: string }) => n?.type === 'chapters_generation_success'
                );

                if (chaptersNotification) {
                    expect(chaptersNotification.type, 'Notification type should be chapters_generation_success')
                        .toBe('chapters_generation_success');
                    return;
                }

                if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, intervalMs));
                }
            }

            throw new Error(
                `chapters_generation_success notification not found after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)`
            );
        });
    });

});

test.describe('Video chapters — Short video', () => {
    test('Short video has no chapters', {
        annotation: { type: 'TC', description: 'CHAP-003' },
    }, async ({ request }) => {
        test.setTimeout(300_000);
        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const password = process.env.USER_PASSWORD!;

        let shortVideoId: string;
        let token: string;

        await test.step('Create user and upload short video', async () => {
            const user = await authApi.createUserFast();
            token = await authApi.getUserToken(user.email, password);

            const video = await videoApi.uploadVideo(token, SHORT_VIDEO_PATH, {
                title: `ShortChap_${Date.now()}`,
                description: 'Short chapters test',
                privacySetting: 'public',
                contentType: 'short',
                waitForProcessing: true,
            });
            shortVideoId = video.id;
        });

        await test.step('Verify chapters stay empty after stabilization period', async () => {
            const pollAttempts = 6;
            const pollIntervalMs = 10_000;

            for (let attempt = 1; attempt <= pollAttempts; attempt++) {
                await new Promise(r => setTimeout(r, pollIntervalMs));
                const videoItem = await videoApi.getVideoById(shortVideoId, token);
                const chapters = videoItem?.chapters;
                const hasChapters = Array.isArray(chapters) && chapters.length > 0;
                expect(hasChapters, `Short video should not have chapters (poll ${attempt}/${pollAttempts})`).toBe(false);
            }
        });
    });
});

