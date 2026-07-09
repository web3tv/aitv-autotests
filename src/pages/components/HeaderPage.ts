import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;

  readonly header: Locator;
  readonly mobileHeader: Locator;
  readonly mobileDropdownTrigger: Locator;
  readonly mobileDropdownMenu: Locator;
  readonly mobileProfileMenuChannelLink: Locator;

  // Unauthenticated header
  readonly loginBtn: Locator;
  readonly signupBtn: Locator;
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
  readonly addNewChannelBtn: Locator;
  readonly createChannelHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    this.header = page.locator('[data-id="aitv-header"]');
    this.mobileHeader = page.locator('[data-id="aitv-header-mobile"]');
    this.mobileDropdownTrigger = page.locator('[data-id="aitv-header-dropdown-trigger"]');
    this.mobileDropdownMenu = page.locator('ul[role="menu"]');
    this.mobileProfileMenuChannelLink = page.locator('[data-id="aitv-profile-menu-channel-link"]');

    this.loginBtn = page.getByTestId('aitv-auth-header-login');
    this.signupBtn = page.getByTestId('aitv-auth-header-signup');
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
    this.addNewChannelBtn = page.locator('[data-id="aitv-studio-channel-new"]');
    this.createChannelHeading = page.getByText('Create Your Ai.tv Channel');
  }

  /** Opens the Studio channel switcher (top-left of the Studio header). Studio pages only. */
  async openChannelSwitcher() {
    await expect(this.channelTriggerBtn, 'Channel switcher trigger is not visible').toBeVisible();
    await expect(this.channelTriggerBtn, 'Channel switcher trigger is not enabled').toBeEnabled();
    await this.channelTriggerBtn.click();
  }

  /** Clicks "Add new channel" in the open channel switcher → navigates to /create-channel. */
  async clickAddNewChannel() {
    await expect(this.addNewChannelBtn, 'Add new channel button is not visible').toBeVisible();
    await expect(this.addNewChannelBtn, 'Add new channel button is not enabled').toBeEnabled();
    await this.addNewChannelBtn.click();
    await this.page.waitForURL('**/create-channel');
    await expect(this.createChannelHeading, 'Create Channel page did not open').toBeVisible();
  }

  /** Opens the Login modal via the header Login button (login intent). */
  async clickLogin(): Promise<void> {
    await this.page.waitForLoadState('load');
    await expect(this.header.or(this.mobileHeader), 'Header is not visible').toBeVisible({ timeout: 30_000 });
    await expect(this.loginBtn, 'Login button is not visible').toBeVisible({ timeout: 15_000 });
    await expect(this.loginBtn, 'Login button is not enabled').toBeEnabled();
    await this.loginBtn.click();
  }

  /** Opens the Sign Up modal via the header Sign up button (registration intent). */
  async clickSignup(): Promise<void> {
    await this.page.waitForLoadState('load');
    await expect(this.header.or(this.mobileHeader), 'Header is not visible').toBeVisible({ timeout: 30_000 });
    await expect(this.signupBtn, 'Sign up button is not visible').toBeVisible({ timeout: 15_000 });
    await expect(this.signupBtn, 'Sign up button is not enabled').toBeEnabled();
    await this.signupBtn.click();
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
