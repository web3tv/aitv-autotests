import { expect } from "@playwright/test";
import { HeaderPage } from "../pages/HeaderPage";
import { UploadVideoPage } from "../pages/UploadVideoPagel";

export class UploadVideoFlow {
    private timestamp: string = '';

    constructor(
    private uploadVideoPage: UploadVideoPage,
    private headerPage: HeaderPage
    ) {}

    async uploadVideo(pathToFileURL:string){
    this.headerPage.clickAddVideoBtn();
    this.headerPage.clickNewVideoBtn();
    await expect(this.headerPage.page.getByRole('dialog', { name: 'Upload Video' })).toBeVisible();
    await this.uploadVideoPage.uploadVideo(pathToFileURL);
    await this.uploadVideoPage.page.waitForResponse((response) =>
        response.url().startsWith('https://web3tv.dev/api/videos/studio-videos') &&
        response.status() === 200,
        { timeout: 15_000 }
    );
    await expect(this.uploadVideoPage.page.getByText('Video Preview [Processing]')).toBeVisible({ timeout: 30_000 });
    await expect(this.uploadVideoPage.page.locator('div').filter({ hasText: /^Upload VideoDetailsVisibility$/ }).first()).toBeVisible();
    await expect(this.uploadVideoPage.page.locator('form')).toContainText('10secVideo');
    }

    async fillVideoTitle(name:string){
        this.uploadVideoPage.fillVideoTitle(name);
    }

    async uploadVideoThumb(pathToFileURL:string){
        this.uploadVideoThumb(pathToFileURL);
    }

    async fillInReqFileds(title:any){
        this.timestamp = Date.now().toString();
        const finalDescription = `${this.timestamp}`;
        await  this.uploadVideoPage.fillVideoDescription(finalDescription);
        await this.uploadVideoPage.page.getByRole('button', { name: 'Auto-generated' }).click();
        await expect(this.uploadVideoPage.page.getByRole('paragraph')).toContainText('Select thumbnail:');
        await expect(this.uploadVideoPage.page.getByRole('dialog', { name: 'Auto-generated thumbnail' })).toBeVisible({timeout:15000});
        await this.uploadVideoPage.page.getByRole('button').nth(3).click();
        await this.uploadVideoPage.page.waitForTimeout(2000);
        await this.uploadVideoPage.page.getByRole('button', { name: 'Done' }).click();
        await this.uploadVideoPage.selectVideoCategory();
        await  this.uploadVideoPage.clickNextBtn();
    }

    async confirmUploading(){
        await  this.uploadVideoPage.clickPublishbtn();
        await expect(this.uploadVideoPage.page.getByLabel('Upload Complete')).toContainText('Congratulations!Your video has been successfully uploaded.');
        await this.uploadVideoPage.page.getByRole('button').filter({ hasText: /^$/ }).click();
        await this.uploadVideoPage.page.getByRole('link', { name: 'Content' }).click();
        await expect(this.uploadVideoPage.page.locator('body')).toContainText(this.timestamp);
    }

  
}