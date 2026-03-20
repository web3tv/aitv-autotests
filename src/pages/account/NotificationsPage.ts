import { expect, Locator, Page } from '@playwright/test';

export class NotificationsPage {
    readonly page: Page;

    readonly subscriptionsToggle: Locator;
    readonly paidSubscriptionsToggle: Locator;
    readonly commentMentionsToggle: Locator;

    readonly bellButton: Locator;
    readonly notificationPanel: Locator;
    readonly notificationEmptyState: Locator;

    constructor(page: Page) {
        this.page = page;
        this.subscriptionsToggle = page.locator('input[name="subscriptions"]');
        this.paidSubscriptionsToggle = page.locator('input[name="paidSubscriptions"]');
        this.commentMentionsToggle = page.locator('input[name="commentMentions"]');

        this.bellButton = page.locator('[data-testid="notifications-button"]');
        this.notificationPanel = page.locator('#notifications-scroll-container');
        this.notificationEmptyState = this.notificationPanel.locator('h5:has-text("You have no new notifications")');
    }

    async assertToggleState(toggle: Locator, expected: boolean, label: string) {
        if (expected) {
            await expect(toggle, `${label} toggle should be ON`).toBeChecked();
        } else {
            await expect(toggle, `${label} toggle should be OFF`).not.toBeChecked();
        }
    }

    async assertAllDefaultStates() {
        await this.assertToggleState(this.subscriptionsToggle, true, 'Subscriptions');
        await this.assertToggleState(this.paidSubscriptionsToggle, true, 'Paid Subscriptions');
        await this.assertToggleState(this.commentMentionsToggle, true, 'Comment Mentions');
    }

    async toggleAndVerifyResponse(toggle: Locator, fieldName: string, expectedValue: boolean): Promise<void> {
        await expect(toggle, `${fieldName} toggle is not visible`).toBeVisible();

        const responsePromise = this.page.waitForResponse(
            res => res.url().includes('/api/notifications/settings') && res.request().method() === 'PUT' && res.status() === 200,
            { timeout: 30000 }
        );

        await toggle.locator('..').click();

        const response = await responsePromise;
        const body = await response.json();
        expect(body.data[fieldName], `${fieldName} should be ${expectedValue} in API response`).toBe(expectedValue);
    }

    async openBellPanel(): Promise<void> {
        await expect(this.bellButton, 'Bell button is not visible').toBeVisible();
        await expect(this.bellButton, 'Bell button is not enabled').toBeEnabled();
        await this.bellButton.click();
        await expect(this.notificationPanel, 'Notification panel did not open').toBeVisible();
        // Wait for panel content to load (infinite scroll component)
        await this.page.waitForTimeout(1500);
    }

    async closeBellPanel(): Promise<void> {
        await this.page.keyboard.press('Escape');
        await expect(this.notificationPanel, 'Notification panel did not close').not.toBeVisible();
    }

    async getNotificationPanelText(): Promise<string> {
        const menuList = this.notificationPanel.locator('[role="menu"]');
        await expect(menuList, 'Menu list not found in notification panel').toBeVisible();
        return await menuList.innerText();
    }

    async assertNotificationInBell(textPattern: RegExp, pollOptions?: { maxAttempts?: number; intervalMs?: number }): Promise<void> {
        const maxAttempts = pollOptions?.maxAttempts ?? 18;
        const intervalMs = pollOptions?.intervalMs ?? 5000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await this.openBellPanel();

            const panelText = await this.getNotificationPanelText();
            if (textPattern.test(panelText)) {
                return;
            }

            await this.closeBellPanel();

            if (attempt < maxAttempts - 1) {
                await this.page.waitForTimeout(intervalMs);
                await this.page.reload({ waitUntil: 'domcontentloaded' });
                await this.page.waitForTimeout(2000);
            }
        }

        // Final attempt with clear error
        await this.openBellPanel();
        const finalText = await this.getNotificationPanelText();
        expect(finalText, `Notification matching ${textPattern} not found after ${maxAttempts} attempts. Panel text: ${finalText.substring(0, 500)}`).toMatch(textPattern);
    }
}
