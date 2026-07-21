import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { SearchModalPage } from '../../src/pages/components/SearchModalPage';
import { VideoPlayerPage } from '../../src/pages/components/VideoPlayerPage';
import { resolveSharedFixture, SharedFixture } from '../fixtures/sharedFixture';
import { FIXTURE_VIDEO_TITLE, FIXTURE_SHORT_TITLE } from '../fixtures/videoSeed';

/**
 * Global Search (W3-2692) — the header search MODAL (`aitv-search-modal`), a full-screen
 * overlay with no route of its own. All cases here only VIEW public content, so they
 * reuse the shared read-only `@qavischan` fixture (never mutated). Result-card lookups
 * are anchored on exact title + `/@qavischan` link (the stand has duplicate-title
 * orphans, so a bare title/count match is not deterministic).
 *
 * The fixture's public content embeds the unique `QAVISCHAN` marker in its titles, so
 * `SEARCH_QUERY` maps to the fixture and nothing else on the stand.
 */
const HANDLE = 'qavischan';
/** Matches the fixture video + short + series (all carry the QAVISCHAN marker). */
const SEARCH_QUERY = 'QAVISCHAN';
/**
 * A phrase present ONLY in the fixture video's DESCRIPTION (FIXTURE_VIDEO_DESCRIPTION),
 * never in any title — used to prove global search matches descriptions (unlike the
 * studio search, STUDIO-018, which does not).
 */
const DESCRIPTION_ONLY_PHRASE = 'обрезки текста';
/** A query guaranteed to match nothing on any stand. */
const NO_RESULTS_QUERY = 'zzqqxyNoSuchContent12345';

let fx: SharedFixture;
test.beforeAll(async () => {
    fx = await resolveSharedFixture();
});

test.describe('Global search — modal open/close', () => {
    test('Search modal opens from the header and focuses the input', {
        annotation: { type: 'TC', description: 'SEARCH-010' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open the home page', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
        });

        await test.step('Trigger is collapsed before opening', async () => {
            await expect(search.trigger, 'Search trigger is not visible').toBeVisible({ timeout: 15_000 });
            await expect(search.trigger, 'Search trigger should be collapsed').toHaveAttribute('aria-expanded', 'false');
        });

        await test.step('Open the modal and verify it is shown with a focused input', async () => {
            await search.open();
            await expect(search.input, 'Search input is not autofocused').toBeFocused();
            await expect(search.trigger, 'Search trigger should be expanded').toHaveAttribute('aria-expanded', 'true');
        });
    });

    test('Search modal closes via close button and via Escape', {
        annotation: { type: 'TC', description: 'SEARCH-011' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open the home page', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
        });

        await test.step('Close via the close button', async () => {
            await search.open();
            await search.close();
            await expect(search.trigger, 'aria-expanded not reset after close').toHaveAttribute('aria-expanded', 'false');
        });

        await test.step('Close via Escape', async () => {
            await search.open();
            await search.closeViaEscape();
            await expect(search.trigger, 'aria-expanded not reset after Escape').toHaveAttribute('aria-expanded', 'false');
        });
    });

    test('Clicking a result card navigates to the video and closes the modal', {
        annotation: { type: 'TC', description: 'SEARCH-012' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open the home page', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
        });

        await test.step('Search for the fixture video', async () => {
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(SEARCH_QUERY);
            await resp;
        });

        await test.step('Click the fixture video card and verify navigation + modal closed', async () => {
            const card = search.resultCardByTitleAndChannel(FIXTURE_VIDEO_TITLE, HANDLE).first();
            await expect(card, 'Fixture video card is not visible in results').toBeVisible({ timeout: 10_000 });
            await card.locator('a[href^="/video/"]').first().click();
            await expect(page, 'Did not navigate to the video page').toHaveURL(/\/video\//);
            await expect(search.modal, 'Search modal did not close after result click').toBeHidden();
        });
    });

    test('Reopening the modal resets the query and the results view', {
        annotation: { type: 'TC', description: 'SEARCH-013' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open the home page', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
        });

        await test.step('Type a query, then close the modal', async () => {
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(SEARCH_QUERY);
            await resp;
            await search.closeViaEscape();
        });

        await test.step('Reopen and verify empty input + empty-state carousels', async () => {
            await search.open();
            await expect(search.input, 'Query was not reset on reopen').toHaveValue('');
            await expect(search.recentlyAddedHeading, 'Empty-state carousels not shown after reopen').toBeVisible();
        });
    });
});

test.describe('Global search — keyword search', () => {
    test('Keyword search returns the matching video on the All tab', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'SEARCH-001' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open search and query the fixture video', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(SEARCH_QUERY);
            await resp;
        });

        await test.step('The fixture video is present under the "Movies or series" section', async () => {
            await expect(search.moviesOrSeriesHeading, '"Movies or series" section is missing').toBeVisible();
            const card = search.resultCardByTitleAndChannel(FIXTURE_VIDEO_TITLE, HANDLE).first();
            await expect(card, 'Expected fixture video not found in results').toBeVisible({ timeout: 10_000 });
        });
    });

    test('Keyword search matches the video description (not only the title)', {
        annotation: { type: 'TC', description: 'SEARCH-051' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Search a phrase that exists only in the video description', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(DESCRIPTION_ONLY_PHRASE);
            await resp;
        });

        await test.step('The fixture video is found by its description', async () => {
            await expect(
                search.resultCardByTitleAndChannel(FIXTURE_VIDEO_TITLE, HANDLE).first(),
                'Video not found by a description-only phrase (description search not working)',
            ).toBeVisible({ timeout: 10_000 });
        });
    });

    test('All tab fires the parallel video + shorts + channel searches and shows both sections', {
        annotation: { type: 'TC', description: 'SEARCH-004' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open search on the All tab', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
        });

        await test.step('Query and await all three parallel search calls', async () => {
            const videos = search.waitForSearchResponse('videos');
            const shorts = search.waitForSearchResponse('shorts');
            const channels = search.waitForSearchResponse('channels');
            await search.typeQuery(SEARCH_QUERY);
            await Promise.all([videos, shorts, channels]);
        });

        await test.step('Both the video and shorts sections render the fixture content', async () => {
            await expect(search.moviesOrSeriesHeading, '"Movies or series" section is missing').toBeVisible();
            await expect(
                search.resultCardByTitleAndChannel(FIXTURE_VIDEO_TITLE, HANDLE).first(),
                'Fixture video missing from All-tab results',
            ).toBeVisible({ timeout: 10_000 });
            await expect(
                search.shortCardByTitleAndChannel(FIXTURE_SHORT_TITLE, HANDLE),
                'Fixture short missing from All-tab results',
            ).toBeVisible({ timeout: 10_000 });
        });
    });

    test('Shorts tab returns the matching short', {
        tag: '@critical',
        annotation: { type: 'TC', description: 'SEARCH-002' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open search and switch to the Shorts tab', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            await search.selectTab('shorts');
        });

        await test.step('Query and verify the fixture short is returned', async () => {
            const resp = search.waitForSearchResponse('shorts');
            await search.typeQuery(SEARCH_QUERY);
            await resp;
            const card = search.shortCardByTitleAndChannel(FIXTURE_SHORT_TITLE, HANDLE);
            await expect(card, 'Expected fixture short not found on the Shorts tab').toBeVisible({ timeout: 15_000 });
        });
    });

    test('Channels tab finds the channel by handle and navigates to it', {
        annotation: { type: 'TC', description: 'SEARCH-003' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open search and switch to the Channels tab', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            await search.selectTab('channels');
        });

        await test.step('Query the handle and verify the channel card', async () => {
            const resp = search.waitForSearchResponse('channels');
            await search.typeQuery(HANDLE);
            await resp;
            const card = search.channelCardByHandle(HANDLE);
            await expect(card, 'Channel card for @qavischan not found').toBeVisible({ timeout: 10_000 });
        });

        await test.step('Clicking the channel card navigates to the channel page', async () => {
            await search.channelCardByHandle(HANDLE).click();
            await expect(page, 'Did not navigate to the channel page').toHaveURL(new RegExp(`/@${HANDLE}`));
            await expect(search.modal, 'Search modal did not close after channel click').toBeHidden();
        });
    });

    test('Movies tab shows standalone videos (series episodes excluded)', {
        annotation: { type: 'TC', description: 'SEARCH-005' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Search on the All tab and await the video results', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(SEARCH_QUERY);
            await resp;
        });

        await test.step('The standalone fixture video is shown on the Movies tab', async () => {
            // Movies/Series split is client-side over the already-fetched videos — the tab
            // switch fires no new request.
            await search.selectTab('movies');
            await expect(
                search.resultCardByTitleAndChannel(FIXTURE_VIDEO_TITLE, HANDLE).first(),
                'Standalone fixture video missing from the Movies tab',
            ).toBeVisible({ timeout: 10_000 });
        });
    });

    test('Series tab shows series content and excludes standalone videos', {
        annotation: { type: 'TC', description: 'SEARCH-006' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Search on the All tab and await the video results', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(SEARCH_QUERY);
            await resp;
        });

        await test.step('Series content from the fixture is shown, the standalone video excluded', async () => {
            // Client-side split — the tab switch fires no new request.
            await search.selectTab('series');
            await expect(
                search.resultCardByChannel(HANDLE).first(),
                'Series tab shows no fixture-channel results for the query',
            ).toBeVisible({ timeout: 10_000 });
            await expect(
                search.resultCardByTitleAndChannel(FIXTURE_VIDEO_TITLE, HANDLE),
                'Standalone (non-series) video incorrectly shown on the Series tab',
            ).toHaveCount(0);
        });
    });
});

test.describe('Global search — clear / reset / no-results', () => {
    test('Clear button empties the query and restores the empty-state view', {
        annotation: { type: 'TC', description: 'SEARCH-020' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open search and type a query', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(SEARCH_QUERY);
            await resp;
            await expect(search.clearBtn, 'Clear button not shown with a non-empty query').toBeVisible();
        });

        await test.step('Clear and verify empty input + empty-state carousels', async () => {
            await search.clearQuery();
            await expect(search.input, 'Query was not cleared').toHaveValue('');
            await expect(search.recentlyAddedHeading, 'Empty-state not restored after clear').toBeVisible();
        });
    });

    test('No-results query shows the empty state and Reset restores the view', {
        annotation: { type: 'TC', description: 'SEARCH-021' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open search and query a non-existent term', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(NO_RESULTS_QUERY);
            await resp;
        });

        await test.step('The no-results state is shown', async () => {
            await expect(search.emptyState, 'No-results state not shown for a 0-match query').toBeVisible();
            await expect(search.emptyState, 'No-results title text mismatch').toContainText('No results found');
            await expect(search.emptyState, 'No-results subtitle text mismatch').toContainText(
                'Try a different search or browse by category.',
            );
            await expect(search.resetBtn, 'Reset Search button not shown').toHaveText('Reset Search');
        });

        await test.step('Reset clears the query', async () => {
            await search.clickReset();
            await expect(search.input, 'Reset did not clear the query').toHaveValue('');
        });
    });

    test('Search API failure shows the error state with a retry option', {
        annotation: { type: 'TC', description: 'SEARCH-022' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Force the search API to fail', async () => {
            await page.route('**/api/search**', (route) => route.fulfill({ status: 500, body: '{}' }));
        });

        await test.step('Query and verify the error state + retry', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            await search.typeQuery(SEARCH_QUERY);
            await expect(search.errorState, 'Error state not shown on API failure').toBeVisible({ timeout: 10_000 });
            await expect(search.retryBtn, 'Retry button is not usable in error state').toBeEnabled();
        });
    });
});

test.describe('Global search — empty-state recommendations', () => {
    test('Guest empty state shows Recently added + Shorts, without Continue watching', {
        annotation: { type: 'TC', description: 'SEARCH-030' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open search with an empty query as a guest', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
        });

        await test.step('Recommendation carousels are shown, Continue watching is not', async () => {
            await expect(search.recentlyAddedHeading, '"Recently added" carousel missing for guest').toBeVisible();
            await expect(search.shortsHeading, '"Shorts" carousel missing for guest').toBeVisible();
            await expect(search.continueWatchingHeading, '"Continue watching" should not show for a guest').toHaveCount(0);
        });
    });
});

test.describe('Global search — edge cases', () => {
    test('Whitespace-only query does not trigger a search call', {
        annotation: { type: 'TC', description: 'SEARCH-040' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);
        let searchCalls = 0;

        await test.step('Track search API calls', async () => {
            page.on('request', (r) => {
                if (r.url().includes('/api/search') && r.url().includes('q=')) searchCalls += 1;
            });
        });

        await test.step('Open search and type only whitespace', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            await search.typeQuery('   ');
            // Wait past the 400ms debounce window before asserting no call fired.
            await page.waitForTimeout(1200);
        });

        await test.step('No search request fired and the empty-state remains', async () => {
            expect(searchCalls, 'Whitespace-only query triggered a search API call').toBe(0);
            await expect(search.recentlyAddedHeading, 'Whitespace query switched away from the empty-state').toBeVisible();
        });
    });

    test('Single-character query performs a search (no minimum-length gate)', {
        annotation: { type: 'TC', description: 'SEARCH-041' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Open search and type a single character', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery('q');
            const response = await resp;
            expect(response.status(), 'Single-character query did not perform a search').toBe(200);
        });

        await test.step('A valid result state renders (not blocked, not errored)', async () => {
            await expect(search.errorState, 'Single-character query fell into the error state').toHaveCount(0);
            await expect(search.modal, 'Search modal is not functional for a single-character query').toBeVisible();
        });
    });

    test('Rapid typing is debounced into a single search call', {
        annotation: { type: 'TC', description: 'SEARCH-043' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);
        const searchUrls: string[] = [];

        await test.step('Collect search API calls', async () => {
            page.on('request', (r) => {
                if (r.url().includes('/api/search') && r.url().includes('type=videos')) searchUrls.push(r.url());
            });
        });

        await test.step('Type a query character by character', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            await search.input.pressSequentially(SEARCH_QUERY, { delay: 50 });
            // Await the single debounced call to fire, then wait out one more debounce
            // window (400ms + margin) to prove NO further per-keystroke calls trail it.
            await search.waitForSearchResponse('videos');
            await page.waitForTimeout(700);
        });

        await test.step('Exactly one videos-search call fired for the settled query', async () => {
            expect(searchUrls.length, 'Debounce not respected — multiple video-search calls fired').toBe(1);
            expect(decodeURIComponent(searchUrls[0]), 'Debounced call used a stale query value').toContain(
                `q=${SEARCH_QUERY}`,
            );
        });
    });

    test('Query is retained when switching between tabs', {
        annotation: { type: 'TC', description: 'SEARCH-045' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);

        await test.step('Search on the All tab', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery(SEARCH_QUERY);
            await resp;
        });

        await test.step('Switch to Shorts — query retained, shorts returned', async () => {
            const resp = search.waitForSearchResponse('shorts');
            await search.selectTab('shorts');
            await resp;
            await expect(search.input, 'Query cleared when switching to Shorts').toHaveValue(SEARCH_QUERY);
            await expect(
                search.shortCardByTitleAndChannel(FIXTURE_SHORT_TITLE, HANDLE),
                'Shorts not shown for the retained query',
            ).toBeVisible({ timeout: 10_000 });
        });
    });

    test('Special-character query is handled safely (no crash, no script execution)', {
        tag: '@validation',
        annotation: { type: 'TC', description: 'SEARCH-042' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);
        let dialogFired = false;

        await test.step('Guard against any script-triggered dialog', async () => {
            page.on('dialog', async (d) => {
                dialogFired = true;
                await d.dismiss();
            });
        });

        await test.step('Query a script/SQL-style string', async () => {
            await page.goto('/', { waitUntil: 'domcontentloaded' });
            await search.open();
            const resp = search.waitForSearchResponse('videos');
            await search.typeQuery('<script>alert(1)</script>');
            const response = await resp;
            expect(response.status(), 'Special-char query did not return 200').toBe(200);
        });

        await test.step('The query is handled gracefully — no crash, no script execution', async () => {
            // The backend sanitizes the markup and returns normal results rather than an
            // error; the security-relevant guarantees are: no error/crash state and no
            // injected script executing (no dialog).
            await expect(search.errorState, 'Special-char query crashed into the error state').toHaveCount(0);
            await expect(search.modal, 'Search modal is no longer functional after the query').toBeVisible();
            expect(dialogFired, 'Unescaped input triggered script execution (XSS)').toBe(false);
        });
    });
});

test.describe('Global search — playback interaction', () => {
    test('Opening search pauses the playing video; closing resumes it', {
        annotation: { type: 'TC', description: 'SEARCH-050' },
    }, async ({ page }) => {
        const search = new SearchModalPage(page);
        const player = new VideoPlayerPage(page);

        await test.step('Open the fixture video and wait for playback', async () => {
            await page.goto(fx.videoUrl, { waitUntil: 'domcontentloaded' });
            await expect(player.videoElement, 'Video player is not visible').toBeVisible({ timeout: 15_000 });
            await expect
                .poll(() => player.videoElement.evaluate((v: HTMLVideoElement) => v.paused), {
                    message: 'Video did not start playing',
                    timeout: 15_000,
                })
                .toBe(false);
        });

        await test.step('Opening search pauses the video', async () => {
            await search.open();
            await expect
                .poll(() => player.videoElement.evaluate((v: HTMLVideoElement) => v.paused), {
                    message: 'Video was not paused when search opened',
                    timeout: 5_000,
                })
                .toBe(true);
        });

        await test.step('Closing search resumes the video', async () => {
            await search.closeViaEscape();
            await expect
                .poll(() => player.videoElement.evaluate((v: HTMLVideoElement) => v.paused), {
                    message: 'Video did not resume after search closed',
                    timeout: 5_000,
                })
                .toBe(false);
        });
    });
});
