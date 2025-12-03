import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;

  readonly addVideoBtn: Locator;
  readonly newVideoBtn: Locator;
  readonly newShortBtn: Locator;
  readonly liveBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    
    this.addVideoBtn = page.getByRole('button', { name: 'Create' });
    this.newVideoBtn = page.getByText('New video');
    this.newShortBtn = page.getByText('New short');
    this.liveBtn = page.getByText('Live');
    
  }

  async clickAddVideoBtn(){
    await this.addVideoBtn.click();
  }

  async clickNewVideoBtn(){
    await this.newVideoBtn.click();
  }

}