import { expect } from "@playwright/test";
import { HeaderPage } from "../pages/components/HeaderPage";
import { UploadVideoPage } from "../pages/components/UploadVideoPagel";
import { SideBarPage } from "../pages/components/SideBarPage";
import { Page } from '@playwright/test';
import { StudioContentPage } from "../pages/studio/StudioContentPage";

export class UploadVideoFlow {
    private timestamp: string = '';

    readonly uploadVideoPage: UploadVideoPage;
    readonly headerPage: HeaderPage;
    

    constructor(public page: Page){
        this.uploadVideoPage = new UploadVideoPage(page);
        this.headerPage = new HeaderPage(page);
    }

    async uploadVideo(pathToFileURL:string,videoName:string){
        await this.headerPage.clickAddVideoBtn();
        await this.headerPage.clickNewVideoBtn();
        await expect(this.headerPage.page.getByRole('dialog', { name: 'Upload Video' })).toBeVisible();
        await this.uploadVideoPage.uploadVideo(pathToFileURL);
        await this.uploadVideoPage.page.waitForResponse((response) =>
            response.url().includes('/api/videos/studio-videos') &&
            response.status() === 200,
            { timeout: 40000 }
        );
        await expect(this.uploadVideoPage.page.getByText('Video Preview [Processing]')).toBeVisible({ timeout: 60_000 });
        await expect(this.uploadVideoPage.page.locator('div').filter({ hasText: /^Upload VideoDetailsVisibility$/ }).first()).toBeVisible();
        await expect(this.uploadVideoPage.page.locator('form')).toContainText(videoName);
    }

    async waitStatusSuccessfully(expectedStatus = 'completed') {
        await this.uploadVideoPage.page.waitForResponse(
            async response => {
                if (!response.url().includes('/api/videos/studio-videos')) {
                    return false;
                }

                const body = await response.json();
                const uploadState = body?.data?.items?.[0]?.status?.uploadState;

                return uploadState === expectedStatus;
            },
                { timeout: 60_000 });
        try{
            await expect(this.uploadVideoPage.page.locator('body')).toContainText('Video successfully uploaded',{timeout:15_000});
        } catch(err){
            throw new Error("Video not uploaded");
        }
    
    }

    async waitStatusSuccessfullyForBigVideo(expectedStatus = 'completed') {
        await this.uploadVideoPage.page.waitForResponse(
            async response => {
                if (!response.url().includes('/api/videos/studio-videos')) {
                    return false;
                }

                const body = await response.json();
                const uploadState = body?.data?.items?.[0]?.status?.uploadState;

                return uploadState === expectedStatus;
            },
                { timeout: 240_000 });
        try{
            await expect(this.uploadVideoPage.page.locator('body')).toContainText('Video successfully uploaded',{timeout:60_000});
        } catch(err){
            throw new Error("Video not uploaded");
        }
    
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
        await this.uploadVideoPage.fillVideoTitle(title);
        await  this.uploadVideoPage.fillVideoDescription(finalDescription);
        await this.uploadVideoPage.page.getByRole('button', { name: 'Auto-generated' }).click();
        await expect(this.uploadVideoPage.page.getByRole('paragraph')).toContainText('Select thumbnail:');
        await expect(this.uploadVideoPage.page.getByRole('dialog', { name: 'Auto-generated thumbnail' })).toBeVisible({timeout:15000});
        await this.uploadVideoPage.page.getByRole('button').nth(3).click();
        await this.uploadVideoPage.page.waitForTimeout(5000);
        await this.uploadVideoPage.page.getByRole('button', { name: 'Done' }).click();
        await this.uploadVideoPage.selectVideoCategory();
        await  this.uploadVideoPage.clickNextBtn();
        return this.timestamp;
    }

    async selectVisibility(type: 'public' | 'private' | 'unlisted' | 'paid') {
        if(type == 'public'){
            await this.uploadVideoPage.clickPublicBtn();
        }
        if(type == 'private'){
            await this.uploadVideoPage.clickPrivateBtn();
        }
        if(type == 'unlisted'){
            await this.uploadVideoPage.clickUnlistedBtn();
        }
        if(type == 'paid'){
            try {
                await this.uploadVideoPage.clickPaidBtn();
                await this.uploadVideoPage.clickMembershipCheckbox();   
            }catch(err){
                console.log('PAID button is not displayed')
            }
            
        }
        
    }

    async chooseMembership(){

    }

    async clickPublishBtn(){
        await  this.uploadVideoPage.clickPublishbtn();
        await expect(this.uploadVideoPage.page.getByLabel('Upload Complete')).toContainText('Congratulations!Your video has been successfully uploaded.',{timeout:10_000});
        await this.uploadVideoPage.page.getByRole('button').filter({ hasText: /^$/ }).click();
    }


    async confirmUploading(visibility: any){
        const sideBarPage = new SideBarPage(this.uploadVideoPage.page)
        const studioContentPage = new StudioContentPage(this.uploadVideoPage.page)
        await sideBarPage.clickStudioContent();
        
        await studioContentPage.checkVideoDescription(this.timestamp);
        await studioContentPage.checkVideoVisibility(visibility)
    }





    

  
}