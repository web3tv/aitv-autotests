import { expect, Locator, Page } from "@playwright/test";

/**
 * AI.TV home page ("/"): "Coming Soon" section with per-video "Notify on Release"
 * bell buttons, plus the header notifications bell + popup (W3-2641).
 *
 * Note on identifying a card: coming-soon cards render ONLY a cover image + notify
 * button — no title/slug in the DOM. A specific video is therefore located by its
 * cover-picture UUID (taken from GET /videos/coming-soon `coverPicture`), which is
 * embedded in the card image `srcset`. This is order-independent, unlike matching by
 * card index (the SSR-rendered card order can lag the live coming-soon API).
 */
export class AitvHomePage {
    readonly page: Page;

    readonly comingSoonSection: Locator;
    readonly comingSoonCards: Locator;
    readonly bellButton: Locator;
    readonly notificationPanel: Locator;

    constructor(page: Page) {
        this.page = page;
        this.comingSoonSection = page.locator('[data-id="aitv-coming-soon-section"]');
        this.comingSoonCards = this.comingSoonSection.locator('[data-id="aitv-coming-soon-card"]');
        this.bellButton = page.locator('[data-id="aitv-header-notifications"]');
        this.notificationPanel = page.locator('#notifications-scroll-container');
    }

    async goto(): Promise<void> {
        await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    }

    /** Extracts the cover-picture UUID from a coming-soon `coverPicture` URL. */
    static coverUuid(coverPicture: Record<string, string> | null): string {
        const url = coverPicture?.high ?? coverPicture?.standard ?? coverPicture?.medium ?? coverPicture?.default ?? '';
        const match = url.match(/\/picture\/([0-9a-f-]+)\//i);
        if (!match) {
            throw new Error(`Cannot extract cover UUID from coverPicture: ${JSON.stringify(coverPicture)}`);
        }
        return match[1];
    }

    /** Card for a specific video, matched by its cover-picture UUID (see class note). */
    private cardByCoverUuid(coverUuid: string): Locator {
        return this.comingSoonCards.filter({
            has: this.page.locator(`img[srcset*="${coverUuid}"]`),
        });
    }

    /** Notify-on-release button of a specific coming-soon card. */
    private notifyButton(coverUuid: string): Locator {
        return this.cardByCoverUuid(coverUuid).locator('[data-id="aitv-coming-soon-card-notify"]');
    }

    async assertComingSoonSectionVisible(): Promise<void> {
        await expect(this.comingSoonSection, 'Coming Soon section is not visible').toBeVisible();
    }

    /**
     * Reloads the home page until the coming-soon card for `coverUuid` is visible
     * (the SSR-rendered coming-soon list can lag just-scheduled videos).
     */
    async waitForComingSoonCard(coverUuid: string, maxAttempts = 6, intervalMs = 5000): Promise<void> {
        const card = this.cardByCoverUuid(coverUuid);
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (await card.isVisible().catch(() => false)) {
                return;
            }
            if (attempt < maxAttempts - 1) {
                await this.page.waitForTimeout(intervalMs);
                await this.page.reload({ waitUntil: 'domcontentloaded' });
            }
        }
        await expect(card, `Coming Soon card for cover ${coverUuid} did not appear`).toBeVisible();
    }

    /**
     * Subscribes to release notifications for a coming-soon video via the bell button.
     * Asserts the request fires to the correct video and the button flips to the
     * subscribed ("Unsubscribe") state.
     */
    async subscribeToRelease(coverUuid: string, videoId: string): Promise<void> {
        const button = this.notifyButton(coverUuid);
        await expect(button, 'Notify on Release button is not visible').toBeVisible();
        await expect(button, 'Notify on Release button is not enabled').toBeEnabled();
        await expect(button, 'Notify button should start in the unsubscribed state').toHaveText(/Notify on Release/);

        const responsePromise = this.page.waitForResponse(
            r => r.url().includes(`/api/videos/${videoId}/notify-on-release`) &&
                r.request().method() === 'POST' && r.status() === 200,
            { timeout: 15000 }
        );
        await button.click();
        await responsePromise;

        await expect(button, 'Button should switch to the subscribed (Unsubscribe) state').toHaveAttribute('aria-label', 'Unsubscribe');
    }

    /**
     * Unsubscribes from release notifications via the bell button.
     * Asserts the DELETE request fires and the button reverts to "Notify on Release".
     */
    async unsubscribeFromRelease(coverUuid: string, videoId: string): Promise<void> {
        const button = this.notifyButton(coverUuid);
        await expect(button, 'Unsubscribe button is not visible').toBeVisible();
        await expect(button, 'Unsubscribe button is not enabled').toBeEnabled();
        await expect(button, 'Button should be in the subscribed (Unsubscribe) state').toHaveAttribute('aria-label', 'Unsubscribe');

        const responsePromise = this.page.waitForResponse(
            r => r.url().includes(`/api/videos/${videoId}/notify-on-release`) &&
                r.request().method() === 'DELETE' && r.status() === 200,
            { timeout: 15000 }
        );
        await button.click();
        await responsePromise;

        await expect(button, 'Button should revert to the unsubscribed (Notify on Release) state').toHaveText(/Notify on Release/);
    }

    /** True if a coming-soon card for the given cover UUID is currently rendered. */
    async isVideoInComingSoon(coverUuid: string): Promise<boolean> {
        return this.cardByCoverUuid(coverUuid).isVisible().catch(() => false);
    }

    async openNotifications(): Promise<void> {
        await expect(this.bellButton, 'Notifications bell is not visible').toBeVisible();
        await expect(this.bellButton, 'Notifications bell is not enabled').toBeEnabled();
        await this.bellButton.click();
        await expect(this.notificationPanel, 'Notification panel did not open').toBeVisible();
        // Panel content loads via an infinite-scroll component.
        await this.page.waitForTimeout(1000);
    }

    async closeNotifications(): Promise<void> {
        await this.page.keyboard.press('Escape');
        await expect(this.notificationPanel, 'Notification panel did not close').not.toBeVisible();
    }

    /**
     * Opens the bell and asserts a notification matching `textPattern` is rendered,
     * reloading between attempts (the on-platform notification can arrive slightly
     * after the video is published).
     */
    async assertReleaseNotificationVisible(
        textPattern: RegExp,
        pollOptions?: { maxAttempts?: number; intervalMs?: number }
    ): Promise<void> {
        const maxAttempts = pollOptions?.maxAttempts ?? 10;
        const intervalMs = pollOptions?.intervalMs ?? 5000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await this.openNotifications();
            const panelText = await this.notificationPanel.innerText();
            if (textPattern.test(panelText)) {
                return;
            }
            await this.closeNotifications();
            if (attempt < maxAttempts - 1) {
                await this.page.waitForTimeout(intervalMs);
                await this.page.reload({ waitUntil: 'domcontentloaded' });
            }
        }

        await this.openNotifications();
        const finalText = await this.notificationPanel.innerText();
        expect(finalText, `Release notification matching ${textPattern} not found. Panel text: ${finalText.substring(0, 500)}`).toMatch(textPattern);
    }
}
