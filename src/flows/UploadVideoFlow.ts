import { expect } from "@playwright/test";
import { HeaderPage } from "../pages/HeaderPage";
import { UploadVideoPage } from "../pages/UploadVideoPagel";

export class UploadVideoFlow {

  constructor(
    private uploadVideoPage: UploadVideoPage,
    private headerPage: HeaderPage
    ) {}

  async uploadVideo(pathToFileURL:string){
    this.headerPage.clickAddVideoBtn();
    this.headerPage.clickNewVideoBtn();
    await expect(this.headerPage.page.getByRole('dialog', { name: 'Upload Video' })).toBeVisible();
    this.uploadVideoPage.uploadVideo(pathToFileURL);
    await this.uploadVideoPage.page.waitForResponse((response) =>
        response.url().startsWith('https://web3tv.dev/api/videos/studio-videos') &&
        response.status() === 200,
        { timeout: 10_000 }
    );
    await expect(this.uploadVideoPage.page.getByText('Video Preview [Uploading]')).toBeVisible();
    await expect(this.uploadVideoPage.page.locator('div').filter({ hasText: /^Upload VideoDetailsVisibility$/ }).first()).toBeVisible();
    await expect(this.uploadVideoPage.page.locator('form')).toContainText('10secVideo');
  }

  
}