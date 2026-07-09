import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export class UploadVideoPage {
  readonly page: Page;

  readonly uploadVideoButton: Locator;
  readonly videoTitle: Locator;
  readonly uploadVideoThumbnail: Locator;
  readonly videoDescription: Locator;
  readonly videoCategoryDropdown: Locator;
  readonly videoCategory: Locator;
  readonly videoGenreDropdown: Locator;
  readonly videoGenreAction: Locator;
  readonly videoGenreAdventure: Locator;
  readonly videoGenreBiographical: Locator;
  readonly videoGenreAdventureChip: Locator;
  readonly nextBtn: Locator;
  readonly publishBtn: Locator;
  
  readonly publicRadioBtn: Locator;
  readonly privateRadioBtn: Locator;
  readonly unlistedRadioBtn: Locator;
  readonly paidRadioBtn: Locator;

  readonly membershipBtn: Locator;
  readonly descriptionEditor: Locator;
  readonly uploadForm: Locator;
  readonly body: Locator;

  constructor(page: Page) {
    this.page = page;

    this.uploadVideoButton = page.getByTestId('dropzone-input');
    this.videoTitle = page.getByRole('textbox', { name: 'Add a title...' });
    this.uploadVideoThumbnail = page.locator('input[data-id="upload-image"]').nth(1);
    this.videoDescription = page.locator('.ql-editor');
    this.descriptionEditor = page.getByRole('dialog').locator('[data-id="description"] .ql-editor');
    this.videoCategoryDropdown = page.getByRole('combobox', { name: 'Choose value' });
    this.videoCategory = page.getByText('Documentaries');
    this.videoGenreDropdown = page.locator('p:has-text("Genres added")').locator('xpath=..').getByRole('combobox');
    this.videoGenreAction = page.getByRole('option', { name: 'Action' });
    this.videoGenreAdventure = page.getByRole('option', { name: 'Adventure' });
    this.videoGenreBiographical = page.getByRole('option', { name: 'Biographical' });
    this.videoGenreAdventureChip = page.locator('div').filter({ hasText: /^Adventure$/ });

    this.nextBtn = page.getByRole('button', { name: 'Next' });
    this.publishBtn = page.getByRole('button', { name: 'Publish' });
    
    this.publicRadioBtn = page.getByRole('radio', { name: 'Public' });
    this.privateRadioBtn = page.getByRole('radio', { name: 'Private' });
    this.unlistedRadioBtn = page.getByRole('radio', { name: 'Unlisted' });
    this.paidRadioBtn = page.getByRole('radio', { name: 'Paid' });
    
    this.membershipBtn = page.getByRole('checkbox').first();
    this.uploadForm = page.locator('form');
    this.body = page.locator('body');
  }


  async uploadVideo(pathToFileURL: string, mimeType?: string) {
    const resolved = path.isAbsolute(pathToFileURL) ? pathToFileURL : path.resolve(PROJECT_ROOT, pathToFileURL);
    if (mimeType) {
      await this.uploadVideoButton.setInputFiles({
        name: path.basename(resolved),
        mimeType,
        buffer: fs.readFileSync(resolved),
      });
    } else {
      await this.uploadVideoButton.setInputFiles(resolved);
    }
  }

  async uploadVideoThumb(pathToFileURL: string) {
    const resolved = path.isAbsolute(pathToFileURL) ? pathToFileURL : path.resolve(PROJECT_ROOT, pathToFileURL);
    await this.uploadVideoThumbnail.setInputFiles(resolved);
  }

  async fillVideoTitle(name: any){
    await expect(this.videoTitle, 'Video title input is not visible').toBeVisible();
    await this.videoTitle.fill(name);
  }

  async fillVideoDescription(description: string){
    await expect(this.videoDescription, 'Video description input is not visible').toBeVisible();
    await this.videoDescription.fill(description);
  }

  async selectVideoCategory(){
    await this.videoCategoryDropdown.click();
    await this.videoCategory.click();
    await expect(this.videoCategoryDropdown, 'Category dropdown should show "Documentaries"').toHaveValue('Documentaries');
  }

  async selectVideoGenres() {
    await expect(this.videoGenreDropdown, 'Genre dropdown is not visible').toBeVisible();
    await this.videoGenreDropdown.click();
    await expect(this.videoGenreAction, 'Action genre option is not visible').toBeVisible();
    await this.videoGenreAction.click();
    await this.videoGenreAdventure.click();
    await this.videoGenreBiographical.click();
    await expect(this.uploadForm, 'Form should contain genre "Action"').toContainText('Action');
    await this.videoGenreAdventureChip.click();
    await expect(this.uploadForm, 'Form should contain genre "Adventure"').toContainText('Adventure');
    await expect(this.uploadForm, 'Form should contain genre "Biographical"').toContainText('Biographical');
  }

  async clickNextBtn(){
    await expect(this.nextBtn, 'Next button is not visible').toBeVisible();
    await expect(this.nextBtn, 'Next button is not enabled').toBeEnabled();
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

  async assertNextBtnDisabled(){
    await expect(this.nextBtn, 'Next button should be visible').toBeVisible();
    await expect(this.nextBtn, 'Next button should be disabled').toBeDisabled();
  }

  async assertNextBtnEnabled(){
    await expect(this.nextBtn, 'Next button should be visible').toBeVisible();
    await expect(this.nextBtn, 'Next button should be enabled').toBeEnabled();
  }

  async assertError(text: string){
    await expect(this.page.getByText(text), `Error "${text}" should be visible`).toBeVisible();
  }

  async clearVideoTitle(){
    await expect(this.videoTitle, 'Video title input is not visible').toBeVisible();
    await this.videoTitle.clear();
  }

  async clearVideoDescription(){
    await expect(this.videoDescription, 'Video description input is not visible').toBeVisible();
    await this.videoDescription.clear();
  }

  async blur(){
    await this.body.click();
  }

  async assertDescriptionContains(expectedText: string) {
    await expect(this.descriptionEditor, 'Video description editor is not visible').toBeVisible();
    await expect(this.descriptionEditor, `Video description does not contain "${expectedText}"`).toContainText(expectedText);
  }

  async assertDescriptionDoesNotContain(text: string) {
    await expect(this.descriptionEditor, 'Video description editor is not visible').toBeVisible();
    await expect(this.descriptionEditor, `Video description unexpectedly contains "${text}"`).not.toContainText(text);
  }

}



  
