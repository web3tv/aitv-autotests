import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class UserDropdownPage {

    readonly page: Page;

    readonly dropdown: Locator;
    readonly studioLink: Locator;
    readonly watchHistoryLink: Locator;
    readonly likedVideosLink: Locator;
    readonly followedAuthorsLink: Locator;
    readonly accountLink: Locator;
    readonly logoutBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.dropdown = page.locator('[aria-labelledby="aitv-profile-button"]');
        this.studioLink = page.locator('[data-id="aitv-profile-menu-studio"]');
        this.watchHistoryLink = page.locator('[data-id="aitv-profile-menu-watch-history"]');
        this.likedVideosLink = page.locator('[data-id="aitv-profile-menu-liked"]');
        this.followedAuthorsLink = page.locator('[data-id="aitv-profile-menu-followed"]');
        this.accountLink = page.locator('[data-id="aitv-profile-menu-account"]');
        this.logoutBtn = page.locator('[data-id="aitv-profile-menu-logout"]');
    }

    async clickStudioLink() {
        await expect(this.studioLink, 'Open Studio link is not visible').toBeVisible();
        await expect(this.studioLink, 'Open Studio link is not enabled').toBeEnabled();
        await this.studioLink.click();
    }

    async clickWatchHistoryLink() {
        await expect(this.watchHistoryLink, 'Watch history link is not visible').toBeVisible();
        await expect(this.watchHistoryLink, 'Watch history link is not enabled').toBeEnabled();
        await this.watchHistoryLink.click();
    }

    async clickLikedVideosLink() {
        await expect(this.likedVideosLink, 'Liked videos link is not visible').toBeVisible();
        await expect(this.likedVideosLink, 'Liked videos link is not enabled').toBeEnabled();
        await this.likedVideosLink.click();
    }

    async clickFollowedAuthorsLink() {
        await expect(this.followedAuthorsLink, 'Followed authors link is not visible').toBeVisible();
        await expect(this.followedAuthorsLink, 'Followed authors link is not enabled').toBeEnabled();
        await this.followedAuthorsLink.click();
    }

    async clickAccountLink() {
        await expect(this.accountLink, 'Account Settings link is not visible').toBeVisible();
        await expect(this.accountLink, 'Account Settings link is not enabled').toBeEnabled();
        await this.accountLink.click();
        await expect(this.page, 'Did not navigate to /account').toHaveURL(/\/account$/);
    }

    async clickLogoutBtn() {
        await expect(this.logoutBtn, 'Log out button is not visible').toBeVisible();
        await expect(this.logoutBtn, 'Log out button is not enabled').toBeEnabled();
        await this.logoutBtn.click();
    }
}
