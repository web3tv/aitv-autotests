import { Browser, Page } from '@playwright/test';

export async function openInIncognito(browser: Browser, url: string): Promise<Page> {
    const context = await browser.newContext();
    const page = await context.newPage();       

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    return page;
}
