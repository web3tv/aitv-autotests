import { test, expect } from '@playwright/test';

const EXPECTED_SLUGS = [
    'movies', 'short-films', 'series', 'miniseries', 'documentaries',
    'docuseries', 'animation', 'vertical-shows', 'music-videos', 'comedy',
    'news-commentary', 'podcasts', 'education', 'kids-family', 'trailers-concepts',
    'behind-the-ai', 'live-events',
];

test.describe('Video categories API', () => {
    test('GET /videos/categories/ returns 200 with non-empty items', {
        annotation: { type: 'TC', description: 'CATEGORIES-001' },
    }, async ({ request }) => {
        let items: { id: number; slug: string }[] = [];

        await test.step('Fetch categories endpoint', async () => {
            console.log('bauseURL:' + process.env.API_URL)
            const response = await request.get(`${process.env.API_URL}/videos/categories/`, {
                headers: { Accept: 'application/json' },
            });
            expect(response.status(), 'Categories endpoint should return 200').toBe(200);
            const json = await response.json();
            items = json?.items ?? json?.data?.items ?? [];
        });

        await test.step('Response contains non-empty items array', async () => {
            expect(items.length, 'Items array should not be empty').toBeGreaterThan(0);
        });
    });

    test('Categories response contains all expected ai.tv slugs', {
        annotation: { type: 'TC', description: 'CATEGORIES-002' },
    }, async ({ request }) => {
        let slugs: string[] = [];

        await test.step('Fetch categories endpoint', async () => {
            const response = await request.get(`${process.env.API_URL}/videos/categories/`, {
                headers: { Accept: 'application/json' },
            });
            expect(response.status(), 'Categories endpoint should return 200').toBe(200);
            const json = await response.json();
            const items: { id: number; slug: string }[] = json?.items ?? json?.data?.items ?? [];
            slugs = items.map(item => item.slug);
        });

        await test.step('All expected ai.tv category slugs are present', async () => {
            for (const slug of EXPECTED_SLUGS) {
                expect(slugs, `Category slug '${slug}' should be present in ai.tv categories`).toContain(slug);
            }
        });
    });
});
