import { expect, Locator, Page } from '@playwright/test';

/**
 * AITV notifications history page (/notifications, W3-2785): the full, paginated list
 * of a user's notifications (seen + unseen), opened from the popup's "Show older
 * notifications" footer. Header = title + subtitle + "Settings" link; body = rows or
 * the empty state; footer = MUI pagination (rendered only when there is > 1 page).
 * Like the popup, every unseen row rendered here is auto-marked `seen`.
 */
export class NotificationsHistoryPage {
    readonly page: Page;

    readonly title: Locator;
    readonly subtitle: Locator;
    readonly settingsLink: Locator;
    readonly emptyState: Locator;
    readonly pagination: Locator;
    /** One avatar per notification row — used to count rendered rows. */
    readonly rowAvatars: Locator;

    constructor(page: Page) {
        this.page = page;
        this.settingsLink = page.locator('[data-id="notifications-history-settings"]');
        this.title = page.getByText('Notifications', { exact: true });
        this.subtitle = page.getByText('Stay updated on new content and activity.');
        this.emptyState = page.getByText('You have no notifications yet.');
        this.pagination = page.locator('.MuiPagination-root');
        this.rowAvatars = page.locator('.MuiAvatar-root');
    }

    async goto(): Promise<void> {
        await this.page.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await this.assertOpened();
    }

    async assertOpened(): Promise<void> {
        await expect(this.page, 'Not on the notifications history page').toHaveURL(/\/notifications(\?|$)/, { timeout: 30_000 });
        await expect(this.settingsLink, 'History page "Settings" link is not visible').toBeVisible({ timeout: 15_000 });
    }
}
