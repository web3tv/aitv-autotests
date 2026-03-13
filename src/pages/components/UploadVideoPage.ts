import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import * as fs from 'fs';

export class UploadVideoPage {
  readonly page: Page;

  readonly uploadVideoButton: Locator;
  readonly videoTitle: Locator;
  readonly uploadVideoThumbnail: Locator;
  readonly videoDescription: Locator;
  readonly videoCategoryDropdown: Locator;
  readonly videoCategory: Locator;
  readonly nextBtn: Locator;
  readonly publishBtn: Locator;
  
  readonly publicRadioBtn: Locator;
  readonly privateRadioBtn: Locator;
  readonly unlistedRadioBtn: Locator;
  readonly paidRadioBtn: Locator;

  readonly membershipBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.uploadVideoButton = page.getByTestId('dropzone-input');
    this.videoTitle = page.getByRole('textbox', { name: 'e.g. Why you should buy' });
    this.uploadVideoThumbnail = page.locator('input[data-id="upload-image"]');
    this.videoDescription = page.locator('.ql-editor');
    this.videoCategoryDropdown = page.getByRole('button', { name: 'Open' });
    this.videoCategory = page.getByRole('option', { name: 'Chain Abstraction' });
    
    this.nextBtn = page.getByRole('button', { name: 'Next' });
    this.publishBtn = page.getByRole('button', { name: 'Publish' });
    
    this.publicRadioBtn = page.getByRole('radio', { name: 'Public' });
    this.privateRadioBtn = page.getByRole('radio', { name: 'Private' });
    this.unlistedRadioBtn = page.getByRole('radio', { name: 'Unlisted' });
    this.paidRadioBtn = page.getByRole('radio', { name: 'Paid' });
    
    // Name might be changed ---> Take a look
    this.membershipBtn = page.getByRole('checkbox', { name: 'Subscription #1 1 week 0.' })
  }


  async uploadVideo(pathToFileURL: string, mimeType?: string) {
    if (mimeType) {
      await this.uploadVideoButton.setInputFiles({
        name: pathToFileURL.split('/').pop()!,
        mimeType,
        buffer: fs.readFileSync(pathToFileURL),
      });
    } else {
      await this.uploadVideoButton.setInputFiles(pathToFileURL);
    }
  }

  async uploadVideoThumb(pathToFileURL:string){
    await this.uploadVideoThumbnail.setInputFiles(pathToFileURL);
  }

  async fillVideoTitle(name: any){
    await this.videoTitle.fill(name);
  }

  async fillVideoDescription(description: string){
    await this.videoDescription.fill(description);
  }

  async selectVideoCategory(){
    await this.videoCategoryDropdown.click();
    await this.videoCategory.click();
    await expect(this.page.getByRole('combobox', { name: 'Choose value' })).toHaveValue('Chain Abstraction');
  }

  async clickNextBtn(){
    await this.nextBtn.click();
  }

  async clickPublishbtn(){
    await this.publishBtn.waitFor({ state: 'visible' });
    await this.publishBtn.click();
  }

  async clickPublicBtn() {
    await this.publicRadioBtn.waitFor({ state: 'visible' });
    await expect(this.publicRadioBtn).toBeEnabled();
    await this.publicRadioBtn.click();
    await expect(this.publicRadioBtn).toBeChecked();
  }

  async clickPrivateBtn() {
    await this.privateRadioBtn.waitFor({ state: 'visible' });
    await expect(this.privateRadioBtn).toBeEnabled();
    await this.privateRadioBtn.click();
    await expect(this.privateRadioBtn).toBeChecked();
  }

  async clickUnlistedBtn() {
    await this.unlistedRadioBtn.waitFor({ state: 'visible' });
    await expect(this.unlistedRadioBtn).toBeEnabled();
    await this.unlistedRadioBtn.click();
    await expect(this.unlistedRadioBtn).toBeChecked();
  }

  async clickPaidBtn() {
    await this.paidRadioBtn.waitFor({ state: 'visible' });
    await expect(this.paidRadioBtn).toBeEnabled();
    await this.paidRadioBtn.click();
    await expect(this.paidRadioBtn).toBeChecked();
  }

  async clickMembershipCheckbox(){
    await expect(this.membershipBtn).toBeEnabled();
    await this.membershipBtn.check();
  }

}



  
