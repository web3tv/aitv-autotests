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
  readonly userIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    
    this.addVideoBtn = page.getByRole('button', { name: 'Create' });
    this.newVideoBtn = page.getByText('New video');
    this.newShortBtn = page.getByText('New short');
    this.liveBtn = page.getByText('Live');

    this.heroCoins = page.locator('[data-id="coins"]');

    this.joinBtn = page.getByRole('button', { name: 'Join' });
    

    this.addWalletBtn = page.locator('xpath=/html/body/div[1]/div[3]/button');
    this.userIcon = page.locator('#profile-button');
  }

  async clickAddVideoBtn(){
    await this.addVideoBtn.click();
  }

  async clickNewVideoBtn(){
    await this.newVideoBtn.click();
  }

  async clickNewShortBtn(){
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
    await expect(this.userIcon).toBeEnabled();
    await this.userIcon.click();
  }
  

}