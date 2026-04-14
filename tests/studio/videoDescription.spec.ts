import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { VideoApi } from '../../src/api/VideoApi';

const PARAGRAPHS = [
    'First paragraph of the video description',
    'Second paragraph of the video description',
    'Third paragraph of the video description',
];

// Quill sends description as HTML with <p> tags; empty paragraphs = <p></p>
const DESCRIPTION_HTML = PARAGRAPHS
    .map(p => `<p>${p}</p>`)
    .join('<p></p>');

test('Video description preserves empty paragraphs on video page', {
    annotation: { type: 'TC', description: 'DESC-PARA-001' },
}, async ({ page, request }) => {
    test.setTimeout(180_000);

    const authApi = new AuthApi(request);
    const videoApi = new VideoApi(request);

    let videoPageUrl: string;
    const videoTitle = `ParagraphTest_${Date.now()}`;

    await test.step('Create user with public channel and upload video with multi-paragraph description', async () => {
        const user = await authApi.createAndVerifyUser();
        const token = await authApi.getUserToken(user.email, process.env.USER_PASSWORD!);
        const channelId = await videoApi.getChannelId(token);
        await videoApi.setChannelPublic(token, channelId, user.username);

        const video = await videoApi.uploadVideo(token, 'test-data/fixtures/video/5secVideo.mp4', {
            title: videoTitle,
            description: DESCRIPTION_HTML,
            privacySetting: 'public',
            waitForProcessing: true,
        });

        videoPageUrl = video.videoPlayerFeUrl;
    });

    await test.step('Navigate to video page and expand description', async () => {
        await page.goto(videoPageUrl, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1', { hasText: videoTitle })).toBeVisible({ timeout: 15_000 });

        const showMoreBtn = page.getByText('Show more', { exact: true });
        await expect(showMoreBtn, '"Show more" button should be visible').toBeVisible({ timeout: 10_000 });
        await showMoreBtn.click();
    });

    await test.step('Verify each paragraph is displayed separately', async () => {
        for (const paragraph of PARAGRAPHS) {
            await expect(
                page.getByText(paragraph, { exact: true }),
                `Paragraph "${paragraph}" should be visible as a separate text block`,
            ).toBeVisible({ timeout: 10_000 });
        }
    });

    await test.step('Verify description has paragraph structure with empty separators', async () => {
        const descriptionContainer = page.getByText('Show less', { exact: true }).locator('..').locator('> div').first();
        const paragraphCount = await descriptionContainer.locator('p').count();

        // 3 content paragraphs + 2 empty spacer <p></p> = at least 5
        expect(paragraphCount, 'Description should have separate <p> elements with spacers').toBeGreaterThanOrEqual(PARAGRAPHS.length + (PARAGRAPHS.length - 1));
    });
});
