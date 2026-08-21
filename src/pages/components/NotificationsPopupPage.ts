import { expect, Locator, Page } from '@playwright/test';

/**
 * AITV header notifications popup (W3-2748, reworked by W3-2785): the bell in the
 * authed header opens a dropdown listing ONLY unseen notifications of the last 14 days
 * (`status=unseen&from=now-14d`), split into "For you" / "Activity" sections, with a
 * "Clear All" sweep, a settings gear and a "Show older notifications" footer that
 * links to the history page (/notifications).
 *
 * W3-2785 behaviour to keep in mind when asserting unread state:
 *  - every row rendered in the popup is auto-marked `seen` on open (batched POST
 *    notifications/events) and the unread counter is refreshed right after;
 *  - "Clear All" is rendered ONLY while the unread counter is > 0 — with 0 unread it
 *    is absent from the DOM (not disabled).
 *
 * Locator note: only the menu-level controls carry data-ids. Rows, section headers
 * and the empty state have NO testids — they are targeted by text, always scoped
 * inside the popup container.
 */
export class NotificationsPopupPage {
    readonly page: Page;

    /** Header bell. Its ONLY text content is the unread badge (count or "9+"). */
    readonly bellButton: Locator;
    /** The popup Paper — also the infinite-scroll container. */
    readonly panel: Locator;
    readonly title: Locator;
    /** "Clear All" sweep — present in the DOM only while there are unread notifications. */
    readonly clearAllBtn: Locator;
    readonly settingsGearBtn: Locator;
    /** "Show older notifications" footer link → /notifications history page. */
    readonly showAllLink: Locator;
    readonly emptyState: Locator;
    readonly forYouHeader: Locator;
    readonly activityHeader: Locator;
    /** One avatar per notification row — used to count rendered rows. */
    readonly rowAvatars: Locator;

    constructor(page: Page) {
        this.page = page;
        this.bellButton = page.locator('[data-id="aitv-header-notifications"]');
        this.panel = page.locator('#aitv-notifications-scroll-container');
        this.title = this.panel.getByText('Notifications', { exact: true });
        this.clearAllBtn = this.panel.locator('[data-id="aitv-notifications-clear-all"]');
        this.settingsGearBtn = this.panel.locator('[data-id="notifications-settings"]');
        this.showAllLink = this.panel.locator('[data-id="aitv-notifications-show-all"]');
        this.emptyState = this.panel.getByText("You're all caught up");
        this.forYouHeader = this.panel.getByText('For you', { exact: true });
        // comment_reply / like / follow rows render under the "Activity" section.
        this.activityHeader = this.panel.getByText('Activity', { exact: true });
        this.rowAvatars = this.panel.locator('.MuiAvatar-root');
    }

    /** A notification row located by (part of) its eyebrow/body text. */
    rowByText(text: string | RegExp): Locator {
        return this.panel.getByText(text).first();
    }

    async openPopup(): Promise<void> {
        await expect(this.bellButton, 'Notifications bell is not visible').toBeVisible({ timeout: 15_000 });
        await expect(this.bellButton, 'Notifications bell is not enabled').toBeEnabled();
        await this.bellButton.click();
        await expect(this.panel, 'Notifications popup did not open').toBeVisible({ timeout: 10_000 });
        // Park the cursor away from the dropdown: hovering a row for ~100ms marks it
        // seen, which would corrupt unread-state assertions.
        await this.page.mouse.move(0, 0);
    }

    async closePopupWithEscape(): Promise<void> {
        await this.page.keyboard.press('Escape');
        await expect(this.panel, 'Notifications popup did not close on Escape').toBeHidden({ timeout: 10_000 });
    }

    /** Asserts the bell badge shows exactly `text` ("3", "9+", …). */
    async assertBadge(text: string): Promise<void> {
        await expect(this.bellButton, `Unread badge is not "${text}"`).toHaveText(text, { timeout: 15_000 });
    }

    /** Asserts the bell has NO unread badge (bell text is empty without it). */
    async assertNoBadge(): Promise<void> {
        await expect(this.bellButton, 'Unread badge should not be shown').toHaveText('', { timeout: 15_000 });
    }
}
