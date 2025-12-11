import { test, expect } from '@playwright/test';
import { timeStamp } from 'console';
import { AuthFlow } from '../src/flows/AuthFlow';
import { UploadVideoFlow } from '../src/flows/UploadVideoFlow';
import { StudioContentPage } from '../src/pages/studio/StudioContentPage';
import { openInIncognito} from '../src/utils/incognitoHelper';
import { assertVideoIsPlaying } from '../src/utils/videoPlayerHelper';
import { ChannelMainPage } from '../src/pages/channel/ChannelMainPage';


test.describe('Uploading tests', () => {
    //TODO: Оставить или убрать проверку на воспроизведение видео
    test('Upload video to channel and check this video in studio', async ({ browser,page }) => {
        const login = process.env.USER_LOGIN_PUBLIC!;
        const password = process.env.USER_PASSWORD!;
    
        const authFlow = new AuthFlow(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page)

        await authFlow.loginSuccess(login,password);
        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4');
        const description = await uploadVideoFlow.fillInReqFileds('First video');
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.selectVisibility('public');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmUploading('Public');
        // const newUrl:any = await studioContentPage.getFirstVideoUrl();

        // const incogPage = await openInIncognito(browser, newUrl);
        // await expect(incogPage.getByText("5secVideo")).toBeVisible({ timeout: 10_000 });
        // await expect(incogPage.getByText(description)).toBeVisible({ timeout: 10_000 });
        // await assertVideoIsPlaying(incogPage);
    });

    test('Upload private video to channel + Check video in studio + Check video is not displayed for other users', async ({ browser,page }) => {
        const login = process.env.USER_LOGIN_PRIVATE!;
        const password = process.env.USER_PASSWORD!;
    
        const authFlow = new AuthFlow(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page)
    
        await authFlow.loginSuccess(login,password);
        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4');
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.fillInReqFileds('First video');
        await uploadVideoFlow.selectVisibility('private');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmUploading('Private');
        const newUrl:any = await studioContentPage.getFirstVideoUrl();

        const incogPage = await openInIncognito(browser, newUrl);
        const channelMainPage = new ChannelMainPage(incogPage);
        await channelMainPage.checkPrivateVideoNotAvailable();
    });

    test('Upload paid video to channel + Check video in studio + ', async ({ browser,page }) => {
        const login = process.env.USER_LOGIN_PAID!;
        const password = process.env.USER_PASSWORD!;
    
        const authFlow = new AuthFlow(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page)

        await authFlow.loginSuccess(login,password);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4');
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.fillInReqFileds('First video');
        await uploadVideoFlow.selectVisibility('paid');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmUploading('Paid');
        const newUrl:any = await studioContentPage.getFirstVideoUrl();

        //TODO: Должно ли Paid видео открываться по прямой ссылке и редиректить на страницу подписок?
        const incogPage = await openInIncognito(browser, newUrl);
        await expect(incogPage.locator('[data-id="sub-card"]')).toBeVisible()
    });

});

test.describe('Check visibility settings',()=>{

    test('Check public video is available', async({page})=>{
        const urlWithPublicVideos = process.env.USER_CHANNEL_PUBLIC_URL!;
        const channelMainPage = new ChannelMainPage(page);

        await page.goto(urlWithPublicVideos);
        await channelMainPage.clickFirstVideo();
        await assertVideoIsPlaying(page);
    })

    test('Check paid video is unavailable before purchasing', async({page})=>{
        const urlWithPublicVideos = process.env.USER_CHANNEL_PAID_URL!;
        const channelMainPage = new ChannelMainPage(page);
        await page.goto(urlWithPublicVideos);
        await channelMainPage.checkPaidVideoAttributes();
    })

    //TODO: Need to use test API
    test('Check paid video is available after purchasing', async({page})=>{
       
    })

    test('Check private video not displaye on channel page', async({page})=>{
        const urlWithPublicVideos = process.env.USER_CHANNEL_PRIVATE_URL!;
        const channelMainPage = new ChannelMainPage(page);

        await page.goto(urlWithPublicVideos);
        await channelMainPage.checkChannelWithoutVideo();   
    })
    
    test('Check private video is unavailable via direct link', async({page})=>{
        const urlPrivateVideo = process.env.VIDEO_PRIVATE_URL!;
        const channelMainPage = new ChannelMainPage(page);

        await page.goto(urlPrivateVideo);
        await channelMainPage.checkPrivateVideoNotAvailable();
    })

    

})
