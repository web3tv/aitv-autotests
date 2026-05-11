import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;

  readonly addVideoBtn: Locator;
  readonly newVideoBtn: Locator;
  readonly newShortBtn: Locator;
  readonly liveBtn: Locator;
  readonly heroCoins: Locator;
  readonly joinBtn: Locator;

  readonly addWalletBtn: Locator;
  readonly connectWalletBtn: Locator;
  readonly userIcon: Locator;
  readonly loginBtn: Locator;
  readonly signUpBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addVideoBtn = page.getByRole('button', { name: 'Create' });
    this.newVideoBtn = page.getByTestId('new-video-button');
    this.newShortBtn = page.getByText('New short');
    this.liveBtn = page.getByText('Live');

    this.heroCoins = page.locator('[data-id="coins"]');

    this.joinBtn = page.getByRole('button', { name: 'Join' });


    this.addWalletBtn = page.locator('button:has(svg[viewBox="0 0 15 14"])').first();
    this.connectWalletBtn = page.getByRole('button', { name: 'Connect wallet' });
    this.userIcon = page.locator('#aitv-profile-button');
    this.loginBtn = page.getByRole('link', { name: 'Login' });
    this.signUpBtn = page.getByRole('link', { name: 'Sign Up' });
  }

  async clickAddVideoBtn(){
    await expect(this.addVideoBtn, 'Create button is not visible').toBeVisible();
    await expect(this.addVideoBtn, 'Create button is not enabled').toBeEnabled();
    await this.addVideoBtn.click();
  }

  async clickNewVideoBtn(){
    await expect(this.newVideoBtn, 'New video button is not visible').toBeVisible();
    await expect(this.newVideoBtn, 'New video button is not enabled').toBeEnabled();
    await this.newVideoBtn.click();
  }

  async clickNewShortBtn(){
    await expect(this.newShortBtn, 'New short button is not visible').toBeVisible();
    await expect(this.newShortBtn, 'New short button is not enabled').toBeEnabled();
    await this.newShortBtn.click();
  }

  async checkVisibilityHeroCoins(){
    await expect(this.heroCoins).toBeVisible();
    await expect(this.heroCoins.locator('h3')).toContainText(['btc']);
    await expect(this.heroCoins.locator('h3')).toContainText(['sol']);
    await expect(this.heroCoins.locator('h3')).toContainText(['xrp']);
    await expect(this.heroCoins.locator('h3')).toContainText(['eth']);
  }

  async clickJoinBtn(){
    await expect(this.joinBtn).toBeVisible();
    await this.joinBtn.click();
    await this.page.waitForURL('/register')
  }

  async clickUserIcon(){
    await expect(this.userIcon, 'User icon is not visible').toBeVisible();
    await expect(this.userIcon, 'User icon is not enabled').toBeEnabled();
    await this.userIcon.click();
  }
  

}