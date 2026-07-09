import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.web3tv2') });

const BASE_URL   = process.env.BASE_URL!;
const STUDIO_URL = process.env.STUDIO_URL!;

const USERNAME = 'sxqfa1561';
const PASSWORD = process.env.USER_PASSWORD!;

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('response', r => {
        const url = r.url();
        if (url.includes('/analytics') || url.includes('analytics-chart')) {
            requests.push(`${r.status()} ${r.request().method()} ${url}`);
        }
    });

    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: 'Enter email or username' }).fill(USERNAME);
    await page.getByRole('textbox', { name: 'Enter password' }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/', { timeout: 30_000 });
    console.log('Logged in');

    requests.length = 0;

    // Navigate to analytics and capture initial load requests
    await page.goto(`${STUDIO_URL}/analytics`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    console.log('\n=== Initial page load requests ===');
    requests.forEach(r => console.log(r));
    requests.length = 0;

    // Check which tab is active
    const activeTab = await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        const tabs = divs.filter(d => /^(Today|7D|30D|YTD|All|Custom)$/.test((d.textContent ?? '').trim()));
        return tabs.map(t => ({
            text: (t.textContent ?? '').trim(),
            class: t.className?.toString().slice(0, 80),
        }));
    });
    console.log('\n=== Period tabs ===');
    console.log(JSON.stringify(activeTab, null, 2));

    // Click each tab and record requests
    for (const tabText of ['Today', '7D', '30D']) {
        requests.length = 0;
        const tab = page.locator('div').filter({ hasText: new RegExp(`^${tabText}$`) }).first();
        await tab.click();
        await page.waitForTimeout(3000);
        console.log(`\n=== After clicking "${tabText}" ===`);
        if (requests.length === 0) {
            console.log('  (no analytics requests fired)');
        } else {
            requests.forEach(r => console.log(' ', r));
        }
    }

    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
