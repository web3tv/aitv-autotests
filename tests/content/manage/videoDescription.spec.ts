import { test, expect } from '@playwright/test';
import { VideoPlayerPage } from '../../../src/pages/components/VideoPlayerPage';
import { setupVideoViaApi } from '../../../src/utils/studioTestHelpers';

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

    const videoPlayerPage = new VideoPlayerPage(page);
    let videoPageUrl: string;

    await test.step('Create user with public channel and upload video with multi-paragraph description', async () => {
        const setup = await setupVideoViaApi(request, {
            privacySetting: 'public',
            description: DESCRIPTION_HTML,
        });
        videoPageUrl = setup.videoUrl;
    });

    await test.step('Navigate to video page and expand description', async () => {
        await page.goto(videoPageUrl, { waitUntil: 'domcontentloaded' });
        await videoPlayerPage.expandDescription();
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
        const descriptionContainer = videoPlayerPage.getDescriptionContainer();
        await expect(descriptionContainer, 'Description container should be visible').toBeVisible();
        const paragraphCount = await descriptionContainer.locator('p').count();

        // 3 content paragraphs + 2 empty spacer <p></p> = 5 elements
        const expectedMinCount = PARAGRAPHS.length * 2 - 1;
        expect(paragraphCount, `Description should have at least ${expectedMinCount} <p> elements (content + spacers)`).toBeGreaterThanOrEqual(expectedMinCount);
    });
});
