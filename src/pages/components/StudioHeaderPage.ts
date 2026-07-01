import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class StudioHeaderPage {
  readonly page: Page;

  readonly createBtn: Locator;
  readonly plusBtn: Locator;
  readonly liveBtn: Locator;
  readonly heroCoins: Locator;
  readonly joinBtn: Locator;

  readonly addWalletBtn: Locator;
  readonly connectWalletBtn: Locator;
  readonly authedActions: Locator;
  readonly userIcon: Locator;
  readonly loginBtn: Locator;
  readonly signUpBtn: Locator;
  readonly getStartedBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // "Create" and the header "+" both open the upload modal directly (the old "New Video/New Short" submenu is gone).
    this.createBtn = page.getByRole('button', { name: 'Create' });
    this.plusBtn = page.locator('[data-id="aitv-header-plus"]');
    this.liveBtn = page.getByText('Live');

    this.heroCoins = page.locator('[data-id="coins"]');

    this.joinBtn = page.getByRole('button', { name: 'Join' });

    this.addWalletBtn = page.locator('button:has(svg[viewBox="0 0 15 14"])').first();
    this.connectWalletBtn = page.getByRole('button', { name: 'Connect wallet' });
    this.authedActions = page.locator('[data-id="aitv-authed-actions"]');
    this.userIcon = page.locator('[data-id="aitv-profile-menu-trigger"]');
    this.loginBtn = page.getByRole('link', { name: 'Login' });
    this.signUpBtn = page.getByRole('link', { name: 'Sign Up' });
    this.getStartedBtn = page.locator('[data-id="aitv-header"] button', { hasText: 'Get Started' });
  }

  async clickCreateBtn() {
    await expect(this.createBtn, 'Create button is not visible').toBeVisible();
    await expect(this.createBtn, 'Create button is not enabled').toBeEnabled();
    await this.createBtn.click();
  }

  /** Clicks the header "+" button, which opens the upload modal directly. */
  async clickPlusBtn() {
    await expect(this.plusBtn, 'Header "+" button is not visible').toBeVisible();
    await expect(this.plusBtn, 'Header "+" button is not enabled').toBeEnabled();
    await this.plusBtn.click();
  }

  async clickJoinBtn() {
    await expect(this.joinBtn, 'Join button is not visible').toBeVisible();
    await this.joinBtn.click();
    await this.page.waitForURL('/register');
  }

  async clickUserIcon() {
    await expect(this.userIcon, 'User icon is not visible').toBeVisible();
    await expect(this.userIcon, 'User icon is not enabled').toBeEnabled();
    await this.userIcon.click();
  }

  async clickGetStarted(): Promise<void> {
    await expect(this.getStartedBtn, 'Get Started button is not visible').toBeVisible();
    await expect(this.getStartedBtn, 'Get Started button is not enabled').toBeEnabled();
    await this.getStartedBtn.click();
  }
}
