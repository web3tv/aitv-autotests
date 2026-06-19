import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;

  readonly header: Locator;
  readonly mobileHeader: Locator;
  readonly mobileDropdownTrigger: Locator;
  readonly mobileDropdownMenu: Locator;

  // Unauthenticated header
  readonly getStartedBtn: Locator;
  readonly searchBtn: Locator;
  readonly homeLink: Locator;
  readonly seriesLink: Locator;
  readonly moviesLink: Locator;
  readonly shortsLink: Locator;

  // Authenticated header
  readonly authedActions: Locator;
  readonly watchlistBtn: Locator;
  readonly createBtn: Locator;
  readonly newVideoBtn: Locator;
  readonly newShortBtn: Locator;
  readonly userIcon: Locator;
  readonly channelTriggerBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.header = page.locator('[data-id="aitv-header"]');
    this.mobileHeader = page.locator('[data-id="aitv-header-mobile"]');
    this.mobileDropdownTrigger = page.locator('[data-id="aitv-header-dropdown-trigger"]');
    this.mobileDropdownMenu = page.locator('ul[role="menu"]');

    this.getStartedBtn = page.getByRole('button', { name: 'Get Started' });
    this.searchBtn = page.locator('[data-id="aitv-header-search"]');
    this.homeLink = page.locator('[data-id="home"]');
    this.seriesLink = page.locator('[data-id="series"]');
    this.moviesLink = page.locator('[data-id="movies"]');
    this.shortsLink = page.locator('[data-id="shorts"]');

    this.authedActions = page.locator('[data-id="aitv-authed-actions"]');
    this.watchlistBtn = page.locator('[data-id="aitv-header-watchlist"]');
    this.createBtn = page.getByRole('button', { name: 'Create' });
    this.newVideoBtn = page.getByTestId('new-video-button');
    this.newShortBtn = page.getByText('New short');
    this.userIcon = page.locator('[data-id="aitv-profile-menu-trigger"]');
    this.channelTriggerBtn = page.locator('[data-id="aitv-studio-channel-trigger-button"]');
  }

  async clickGetStarted(): Promise<void> {
    await expect(this.getStartedBtn, 'Get Started button is not visible').toBeVisible();
    await expect(this.getStartedBtn, 'Get Started button is not enabled').toBeEnabled();
    await this.getStartedBtn.click();
  }

  async clickCreateBtn() {
    await expect(this.createBtn, 'Create button is not visible').toBeVisible();
    await expect(this.createBtn, 'Create button is not enabled').toBeEnabled();
    await this.createBtn.click();
  }

  async clickNewVideoBtn() {
    await expect(this.newVideoBtn, 'New video button is not visible').toBeVisible();
    await expect(this.newVideoBtn, 'New video button is not enabled').toBeEnabled();
    await this.newVideoBtn.click();
  }

  async clickNewShortBtn() {
    await expect(this.newShortBtn, 'New short button is not visible').toBeVisible();
    await expect(this.newShortBtn, 'New short button is not enabled').toBeEnabled();
    await this.newShortBtn.click();
  }

  async clickUserIcon() {
    await expect(this.userIcon, 'User icon is not visible').toBeVisible();
    await expect(this.userIcon, 'User icon is not enabled').toBeEnabled();
    await this.userIcon.click();
  }
}
