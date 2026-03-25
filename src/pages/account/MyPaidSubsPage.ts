import { expect, Locator, Page } from '@playwright/test';

export class MyPaidSubsPage {
    readonly page: Page;

    readonly pageTitle: Locator;
    readonly tableHeader: Locator;
    readonly subscriptionRow: Locator;

    constructor(page: Page) {
        this.page = page;

        this.pageTitle = page.getByRole('heading', { name: 'Paid Subscriptions', level: 1 });
        this.tableHeader = page.getByRole('heading', { name: 'Creator', level: 3 });
        // Subscription rows: sibling divs after the header row, each containing a link + headings + paragraphs
        // The header row contains h3 "Creator", "Subscription", etc.
        // Data rows are siblings of the header row — they contain a link (channel) and paragraphs (data)
        this.subscriptionRow = page.locator('div:has(> a) + h3 + p + p + p + p + p').locator('..');
        // Alternative approach: target rows that have a paragraph with status text
        // Actually from the snapshot, each data row is a generic div that is a sibling of the header div
        // Let's use the container that holds heading row and data rows
    }

    async assertPageLoaded(): Promise<void> {
        await expect(this.pageTitle, 'Paid Subscriptions page title is not visible').toBeVisible();
        await expect(this.page, 'Not on /my-paid-subs page').toHaveURL(/\/my-paid-subs$/);
    }

    async assertSubscriptionVisible(index = 0): Promise<void> {
        const row = this.page.locator(`a:has(h3)`).nth(index);
        await expect(row, `Subscription row #${index} is not visible`).toBeVisible();
    }

    async assertStatus(expectedStatus: string, index = 0): Promise<void> {
        // Status is the 5th column: after link(creator), h3(subscription name), p(price), p(duration) -> p(status)
        const statusParagraph = this.page.getByText(expectedStatus, { exact: true });
        await expect(statusParagraph, `Subscription status should be "${expectedStatus}"`).toBeVisible();
    }

    async assertChannelName(expectedName: string): Promise<void> {
        const channelLink = this.page.getByRole('link', { name: new RegExp(expectedName) });
        await expect(channelLink, `Channel name "${expectedName}" is not visible`).toBeVisible();
    }

    async assertSubscriptionName(expectedName: string): Promise<void> {
        const subName = this.page.getByRole('heading', { name: expectedName, level: 3 });
        await expect(subName, `Subscription name "${expectedName}" is not visible`).toBeVisible();
    }
}
