import { Page, Locator } from '@playwright/test';

export class UploadVideoPage {
  readonly page: Page;

  readonly uploadVideoButton: Locator;
 

    constructor(page: Page) {
    this.page = page;

    this.uploadVideoButton = page.getByTestId('dropzone-input');

    }


    async uploadVideo(pathToFileURL:string){
        await this.uploadVideoButton.setInputFiles(pathToFileURL);
    }

}



  
