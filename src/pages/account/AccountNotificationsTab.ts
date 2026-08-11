import { expect, Locator, Page } from '@playwright/test';

/**
 * The "Notifications" tab of the /account page (AI.TV skin): a set of on-platform
 * notification toggles + a standalone "all emails" toggle. Each toggle is a custom
 * `<button role="switch" aria-checked>` (not a native checkbox), and flipping it PUTs
 * the WHOLE settings object to `notifications/settings`.
 */
export class AccountNotificationsTab {
    readonly page: Page;

    readonly tab: Locator;
    readonly videoReleasesToggle: Locator;
    readonly commentMentionsToggle: Locator;
    readonly subscriptionsToggle: Locator;
    readonly allEmailsToggle: Locator;

    constructor(page: Page) {
        this.page = page;
        this.tab = page.getByTestId('aitv-notifications-tab');
        this.videoReleasesToggle = page.getByTestId('aitv-notifications-toggle-video-releases');
        this.commentMentionsToggle = page.getByTestId('aitv-notifications-toggle-comment-mentions');
        this.subscriptionsToggle = page.getByTestId('aitv-notifications-toggle-subscriptions');
        this.allEmailsToggle = page.getByTestId('aitv-notifications-toggle-all-emails');
    }

    async goto(): Promise<void> {
        await this.page.goto('/account?tab=notifications', { waitUntil: 'domcontentloaded' });
        await expect(this.tab, 'Notifications settings tab did not open').toBeVisible({ timeout: 15_000 });
    }

    async assertToggle(toggle: Locator, expected: boolean, label: string): Promise<void> {
        if (expected) {
            await expect(toggle, `${label} toggle should be ON`).toBeChecked({ timeout: 10_000 });
        } else {
            await expect(toggle, `${label} toggle should be OFF`).not.toBeChecked({ timeout: 10_000 });
        }
    }

    /** Flips a toggle and waits for the settings PUT to complete. */
    async toggle(toggle: Locator, label: string): Promise<void> {
        await expect(toggle, `${label} toggle is not visible`).toBeVisible();
        await expect(toggle, `${label} toggle is not enabled`).toBeEnabled();
        const putResponse = this.page.waitForResponse(
            (r) => r.url().includes('notifications/settings') && r.request().method() === 'PUT' && r.ok(),
            { timeout: 15_000 }
        );
        await toggle.click();
        await putResponse;
    }
}
