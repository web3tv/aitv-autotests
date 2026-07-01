import { test, expect } from '@playwright/test';

const EXPECTED_GENRE_NAMES = [
    'Action', 'Adventure', 'Alien / UFO', 'Animation', 'Biographical',
    'Business', 'Celebrity / Pop Culture', 'Comedy', 'Courtroom / Legal', 'Crime',
    'Crypto / Web3', 'Cyberpunk', 'Disaster', 'Drama', 'Dystopian',
    'Educational', 'Experimental', 'Family', 'Fantasy', 'Film Noir',
    'Food', 'Gangster / Mafia', 'Heist', 'Historical', 'Horror',
    'Kids', 'Lifestyle', 'Martial Arts', 'Medical', 'Monster / Creature',
    'Music', 'Musical', 'Mystery', 'Nature / Animals', 'Political',
    'Post-Apocalyptic', 'Prison', 'Psychological', 'Reality', 'Romance',
    'Satire', 'Sci-Fi', 'Sitcom', 'Space', 'Sports',
    'Spy / Espionage', 'Superhero', 'Supernatural', 'Survival', 'Suspense',
    'Tech / AI', 'Teen / YA', 'Thriller', 'Travel', 'True Crime',
    'Vampire / Werewolf', 'War / Military', 'Western', 'Zombie',
];

const EXPECTED_SLUGS = [
    'movies', 'short-films', 'series', 'miniseries', 'documentaries',
    'docuseries', 'vertical-shows', 'music-videos',
    'news-commentary', 'podcasts', 'education', 'kids-family', 'trailers-concepts',
    'live-events',
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

    
    test.fixme('Categories response contains all expected ai.tv slugs', {
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

test.describe('Video genres API', () => {
    test('GET /videos/genres returns 200 and items contain only names without description', {
        annotation: { type: 'TC', description: 'GENRES-001' },
    }, async ({ request }) => {
        let items: Record<string, unknown>[] = [];

        await test.step('Fetch genres endpoint', async () => {
            const response = await request.get(`${process.env.API_URL}/videos/genres`, {
                headers: { Accept: 'application/json' },
            });
            expect(response.status(), 'Genres endpoint should return 200').toBe(200);
            const json = await response.json();
            items = json?.items ?? json?.data?.items ?? [];
        });

        await test.step('Response contains non-empty items array', async () => {
            expect(items.length, 'Items array should not be empty').toBeGreaterThan(0);
        });

        await test.step('Each item has no description field', async () => {
            for (const item of items) {
                expect(item, `Genre item should not contain a description field`).not.toHaveProperty('description');
            }
        });
    });

    test('Genres response contains all expected genre names', {
        annotation: { type: 'TC', description: 'GENRES-002' },
    }, async ({ request }) => {
        let names: string[] = [];

        await test.step('Fetch genres endpoint', async () => {
            const response = await request.get(`${process.env.API_URL}/videos/genres`, {
                headers: { Accept: 'application/json' },
            });
            expect(response.status(), 'Genres endpoint should return 200').toBe(200);
            const json = await response.json();
            const items: { name: string }[] = json?.items ?? json?.data?.items ?? [];
            names = items.map(item => item.name);
        });

        await test.step('All expected genre names are present', async () => {
            for (const name of EXPECTED_GENRE_NAMES) {
                expect(names, `Genre '${name}' should be present in the response`).toContain(name);
            }
        });
    });
});
