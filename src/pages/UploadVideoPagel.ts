import { Page, Locator } from '@playwright/test';

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

    constructor(page: Page) {
    this.page = page;

    this.uploadVideoButton = page.getByTestId('dropzone-input');
    this.videoTitle = page.getByRole('textbox', { name: 'Title' });
    this.uploadVideoThumbnail = page.getByTestId('upload-image');
    this.videoDescription = page.locator('.ql-editor');
    this.videoCategoryDropdown = page.getByRole('button', { name: 'Open' });
    this.videoCategory = page.getByRole('option', { name: 'Chain Abstraction' });
    
    this.nextBtn = page.getByRole('button', { name: 'Next' });
    this.publishBtn = page.getByRole('button', { name: 'Publish' });
  

    }


    async uploadVideo(pathToFileURL:string){
        await this.uploadVideoButton.setInputFiles(pathToFileURL);
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
    }

    async clickNextBtn(){
      await this.nextBtn.click();
    }

    async clickPublishbtn(){
      await this.publishBtn.click();
    }

}



  
