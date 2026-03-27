import { Page } from '@playwright/test';

/** Navigate to studio domain if not already there */
export async function ensureOnStudioDomain(page: Page): Promise<void> {
    const studioUrl = process.env.STUDIO_URL || 'https://studio.web3tv.dev';
    if (!page.url().includes(new URL(studioUrl).hostname)) {
        await page.goto(`${studioUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    }
}
