import { expect, Locator, Page } from '@playwright/test';

/**
 * AITV header notifications popup (W3-2748): the bell in the authed header opens a
 * dropdown with a flat notification list split into "For you" / "Mentions" sections,
 * a "Mark all as read" sweep, a settings gear and a stubbed "Show older" footer.
 *
 * Locator note: only the menu-level controls carry data-ids. Rows, section headers,
 * the unread dot and the empty state have NO testids — they are targeted by text or
 * (the dot) by its computed style, always scoped inside the popup container.
 */
export class NotificationsPopupPage {
    readonly page: Page;

    /** Header bell. Its ONLY text content is the unread badge (count or "9+"). */
    readonly bellButton: Locator;
    /** The popup Paper — also the infinite-scroll container. */
    readonly panel: Locator;
    readonly title: Locator;
    readonly markAllAsReadBtn: Locator;
    readonly settingsGearBtn: Locator;
    readonly showOlderBtn: Locator;
    readonly emptyState: Locator;
    readonly forYouHeader: Locator;
    readonly mentionsHeader: Locator;
    /** One avatar per notification row — used to count rendered rows. */
    readonly rowAvatars: Locator;

    constructor(page: Page) {
        this.page = page;
        this.bellButton = page.locator('[data-id="aitv-header-notifications"]');
        this.panel = page.locator('#aitv-notifications-scroll-container');
        this.title = this.panel.getByText('Notifications', { exact: true });
        this.markAllAsReadBtn = this.panel.locator('[data-id="aitv-notifications-clear-all"]');
        this.settingsGearBtn = this.panel.locator('[data-id="notifications-settings"]');
        this.showOlderBtn = this.panel.locator('[data-id="aitv-notifications-show-older"]');
        this.emptyState = this.panel.getByText("You're all caught up");
        this.forYouHeader = this.panel.getByText('For you', { exact: true });
        this.mentionsHeader = this.panel.getByText('Mentions', { exact: true });
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

    /**
     * The unread dot has no testid/class hook — it is the only 7×7 round element inside
     * the popup, so it is counted by computed style.
     */
    async countUnreadDots(): Promise<number> {
        return this.page.evaluate(() => {
            const panel = document.querySelector('#aitv-notifications-scroll-container');
            if (!panel) return 0;
            return [...panel.querySelectorAll('div')].filter((d) => {
                const s = getComputedStyle(d);
                const w = parseFloat(s.width);
                const h = parseFloat(s.height);
                // Tolerant range instead of a strict '7px' match — subpixel rounding
                // (zoom/DPI) must not silently drop dots from the count.
                return w >= 6 && w <= 8 && h >= 6 && h <= 8 && s.borderRadius.includes('100%');
            }).length;
        });
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
