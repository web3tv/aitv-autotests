import { expect } from "@playwright/test";
import { HeaderPage } from "../pages/HeaderPage";
import { UploadVideoPage } from "../pages/UploadVideoPagel";
import { SideBarPage } from "../pages/SideBarPage";
import { Page } from '@playwright/test';

export class UploadVideoFlow {
    private timestamp: string = '';

    readonly uploadVideoPage: UploadVideoPage;
    readonly headerPage: HeaderPage;

    constructor(public page: Page){
        this.uploadVideoPage = new UploadVideoPage(page);
        this.headerPage = new HeaderPage(page);
    }

    async uploadVideo(pathToFileURL:string){
        await this.headerPage.clickAddVideoBtn();
        await this.headerPage.clickNewVideoBtn();
        await expect(this.headerPage.page.getByRole('dialog', { name: 'Upload Video' })).toBeVisible();
        await this.uploadVideoPage.uploadVideo(pathToFileURL);
        await this.uploadVideoPage.page.waitForResponse((response) =>
            response.url().includes('/api/videos/studio-videos') &&
            response.status() === 200,
            { timeout: 40000 }
        );
        await expect(this.uploadVideoPage.page.getByText('Video Preview [Processing]')).toBeVisible({ timeout: 30_000 });
        await expect(this.uploadVideoPage.page.locator('div').filter({ hasText: /^Upload VideoDetailsVisibility$/ }).first()).toBeVisible();
        await expect(this.uploadVideoPage.page.locator('form')).toContainText('10secVideo');
    }

    async fillVideoTitle(name:string){
        await this.uploadVideoPage.fillVideoTitle(name);
    }

    // async uploadVideoThumb(pathToFileURL:string){
    //     this.uploadVideoThumb(pathToFileURL);
    // }

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
        const sideBarPage = new SideBarPage(this.uploadVideoPage.page)
        await  this.uploadVideoPage.clickPublishbtn();
        await expect(this.uploadVideoPage.page.getByLabel('Upload Complete')).toContainText('Congratulations!Your video has been successfully uploaded.');
        await this.uploadVideoPage.page.getByRole('button').filter({ hasText: /^$/ }).click();
        await sideBarPage.clickStudioContent();
        await expect(this.uploadVideoPage.page.locator('body')).toContainText(this.timestamp);
    }

  
}