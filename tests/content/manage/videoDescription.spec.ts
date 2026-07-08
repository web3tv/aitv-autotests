import { test, expect } from '@playwright/test';
import { VideoPlayerPage } from '../../../src/pages/components/VideoPlayerPage';
import { resolveSharedFixture, SharedFixture } from '../../fixtures/sharedFixture';
import { FIXTURE_DESC_PARAGRAPHS } from '../../fixtures/videoSeed';

// READ-ONLY: opens the shared fixture's UNLISTED "description" video (seeded with a
// multi-paragraph HTML description incl. empty `<p></p>` spacers) by direct link and
// checks the watch page preserves the paragraph structure. No per-run upload.
let fx: SharedFixture;
test.beforeAll(async () => { fx = await resolveSharedFixture(); });

test('Video description preserves empty paragraphs on video page', {
    annotation: { type: 'TC', description: 'DESC-PARA-001' },
}, async ({ page }) => {
    const videoPlayerPage = new VideoPlayerPage(page);

    await test.step('Open the seeded description video and expand its description', async () => {
        await page.goto(fx.descriptionVideoUrl, { waitUntil: 'domcontentloaded' });
        await videoPlayerPage.expandDescription();
    });

    await test.step('Verify each paragraph is displayed separately', async () => {
        for (const paragraph of FIXTURE_DESC_PARAGRAPHS) {
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

        // N content paragraphs + (N-1) empty spacer <p></p>.
        const expectedMinCount = FIXTURE_DESC_PARAGRAPHS.length * 2 - 1;
        expect(paragraphCount, `Description should have at least ${expectedMinCount} <p> elements (content + spacers)`)
            .toBeGreaterThanOrEqual(expectedMinCount);
    });
});
