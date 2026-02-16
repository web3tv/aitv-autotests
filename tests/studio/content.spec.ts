import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { UploadVideoFlow } from '../../src/flows/UploadVideoFlow';
import { StudioContentPage } from '../../src/pages/studio/StudioContentPage';
import { assertVideoIsPlaying } from '../../src/utils/videoPlayerHelper';
import { ChannelMainPage } from '../../src/pages/channel/ChannelMainPage';
import { SideBarPage } from '../../src/pages/components/SideBarPage';
import { StudioProfilePage } from '../../src/pages/studio/StudioProfilePage';
import { AuthApi } from '../../src/api/AuthApi';
import { StudioMembershipPage } from '../../src/pages/studio/StudioMembershipPage';

test.describe.serial('Public video', () => {
    let user: { email: string, username: string };
    let user2: { email: string };
    const videoName: string = Date.now().toString();
    let newUrl: string | null;
    let description: string;
    const baseUrl = process.env.BASE_URL

    test('Create user and fix channel privacy to public', async ({ page, request }) => {
          const authApi = new AuthApi(request);
          const authFlow = new AuthFlow(page);
          const studioProfilePage = new StudioProfilePage(page);
          user = await authApi.createAndVerifyUser();
          const password = process.env.USER_PASSWORD!;
          await authFlow.loginSuccess(user.email, password);
          const sideBar = new SideBarPage(page);
          await sideBar.clickStudioProfileChannel();
          await studioProfilePage.changePrivacyToPublic();
    })

    test('Upload public video to channel and check video on studio page -> Available', async ({ page }) => {
        const password = process.env.USER_PASSWORD!;
        const authFlow = new AuthFlow(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page)

        await authFlow.loginSuccess(user.email,password);
        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4');
        description = await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.selectVisibility('public');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmUploading('Public');
        newUrl = await studioContentPage.getFirstVideoUrl();
        if (!newUrl) {
            throw new Error('Video URL was not found');
        }
    })

    test('Check public video visibility on channel page -> Available', async({page})=>{
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'networkidle' });
        await channelMainPage.checkVideoIsExist(videoName);
    })

    test('Check public video as anonymous via direct link -> Available' , async ({ page }) => {
        await page.goto(newUrl!, { waitUntil: 'networkidle' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
        await assertVideoIsPlaying(page);
    })

    test('Check public video as another user via direct link -> Available', async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        user2 = await authApi.createAndVerifyUser();
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(user2.email, password);

        await page.goto(newUrl!, { waitUntil: 'networkidle' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
        await assertVideoIsPlaying(page);
    })

})

test.describe.serial('Private video', () => {
    let user: { email: string, username: string };
    let user2: { email: string };
    const videoName: string = Date.now().toString();
    let newUrl: string | null;
    let description: string;
    const baseUrl = process.env.BASE_URL

    test('Create user and fix channel privacy to public', async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioProfilePage = new StudioProfilePage(page);
        user = await authApi.createAndVerifyUser();
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(user.email, password);
        const sideBar = new SideBarPage(page);
        await sideBar.clickStudioProfileChannel();
        await studioProfilePage.changePrivacyToPublic();
    })

    test('Upload private video to channel and check video on studio page -> Available', async ({ page }) => {
        const password = process.env.USER_PASSWORD!;
        const authFlow = new AuthFlow(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page)

        await authFlow.loginSuccess(user.email,password);
        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4');
        description = await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.selectVisibility('private');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmUploading('Private');
        newUrl = await studioContentPage.getFirstVideoUrl();
        if (!newUrl) {
            throw new Error('Video URL was not found');
        }
    })

    test('Check private video visibility on channel page -> Not available', async({page})=>{
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'networkidle' });
        await channelMainPage.checkPrivateVideoOnChannelPage();
    })

    test('Check private video as anonymous via direct link -> Unavailable' , async ({ page }) => {
        const channelMainPage = new ChannelMainPage(page);   
        await page.goto(newUrl!, { waitUntil: 'networkidle' });
        await channelMainPage.checkPrivateVideoViaDirectLink();
    })

    test('Check private video as another user via direct link -> Unavailable', async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);
        user2 = await authApi.createAndVerifyUser();
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(user2.email, password);
        await page.goto(newUrl!, { waitUntil: 'networkidle' });
        await channelMainPage.checkPrivateVideoViaDirectLink();
    })

})

test.describe.serial('Paid video', () => {
    let user: { email: string, username: string };
    let user2: { email: string };
    const videoName: string = Date.now().toString();
    let videoUrl: string | null;
    let description: string;
    const baseUrl = process.env.BASE_URL
    const membershipName = 'Subscription #1';
    const membershipDescription = 'Description for card #1';

    test('Create user and fix channel privacy to public', async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioProfilePage = new StudioProfilePage(page);
        user = await authApi.createAndVerifyUser();
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(user.email, password);
        const sideBar = new SideBarPage(page);
        await sideBar.clickStudioProfileChannel();
        await studioProfilePage.changePrivacyToPublic();
    })

    test('Create subscription plan', async ({ page }) => {
          const authFlow = new AuthFlow(page);
          const password = process.env.USER_PASSWORD!;
          await authFlow.loginSuccess(user.email, password);
    
          const sideBar = new SideBarPage(page);
          await sideBar.clickStudioMemberships();
          
          const studioMembershipPage = new StudioMembershipPage(page);
          await studioMembershipPage.addMembershipPlan(membershipName, membershipDescription);
          await studioMembershipPage.checkAddedPlan(membershipName, membershipDescription);
    })
    
    test('Upload paid video to channel and check video on studio page -> Available', async ({ page }) => {
        const password = process.env.USER_PASSWORD!;
        const authFlow = new AuthFlow(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page)

        await authFlow.loginSuccess(user.email,password);
        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4');
        description = await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.selectVisibility('paid');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmUploading('Paid');
        videoUrl = await studioContentPage.getFirstVideoUrl();
        if (!videoUrl) {
            throw new Error('Video URL was not found');
        }
    })

    test('Check paid video visibility on channel page -> Available', async({page})=>{
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'networkidle' });
        await channelMainPage.checkPaidVideoAttributes();
    })

    test('Check paid video as anonymous via direct link -> Unavailable' , async ({ page }) => {
        const channelMainPage = new ChannelMainPage(page);   
        await page.goto(videoUrl!, { waitUntil: 'networkidle' });
        await expect(page.locator('h3')).toContainText(membershipName);
        await expect(page.locator('body')).toContainText(membershipDescription);
        await expect(page.locator('body')).toContainText('$49.991 week');
        await channelMainPage.clickRegisterLoginBtn();
        await expect(page.locator('body')).toContainText('Please log in to your Web3.TV account using one of the login methods below');
    })

    test('Check paid video as another user via direct link -> Unavailable', async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);
        user2 = await authApi.createAndVerifyUser();
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(user2.email, password);
        await page.goto(videoUrl!, { waitUntil: 'networkidle' });
        await expect(page.locator('h3')).toContainText(membershipName);
        await expect(page.locator('body')).toContainText(membershipDescription);
        await expect(page.locator('body')).toContainText('$49.991 week');
        await channelMainPage.clickButtonSubscribeNow();
        await expect(page).toHaveURL( /test\.pay\.hero\.io\/invoice\/currency-list(\?.*)?$/);
    })
    
})

test.describe.serial('Unlisted video', () => {
    let user: { email: string, username: string };
    let user2: { email: string };
    const videoName: string = Date.now().toString();
    let videoUrl: string | null;
    let description: string;
    const baseUrl = process.env.BASE_URL

    test('Create user and fix channel privacy to public', async ({ page, request }) => {
          const authApi = new AuthApi(request);
          const authFlow = new AuthFlow(page);
          const studioProfilePage = new StudioProfilePage(page);
          user = await authApi.createAndVerifyUser();
          const password = process.env.USER_PASSWORD!;
          await authFlow.loginSuccess(user.email, password);
          const sideBar = new SideBarPage(page);
          await sideBar.clickStudioProfileChannel();
          await studioProfilePage.changePrivacyToPublic();
    })

    test('Upload unlisted video to channel and check video on studio page -> Available', async ({ page }) => {
        const password = process.env.USER_PASSWORD!;
        const authFlow = new AuthFlow(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page)

        await authFlow.loginSuccess(user.email,password);
        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4');
        description = await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();
        await uploadVideoFlow.selectVisibility('unlisted');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmUploading('Unlisted');
        videoUrl = await studioContentPage.getFirstVideoUrl();
        if (!videoUrl) {
            throw new Error('Video URL was not found');
        }
    })

    test('Check unlisted video visibility on channel page -> Not Available', async({page})=>{
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'networkidle' });
        await channelMainPage.checkUnlistedVideoNotAvailable();
    })

    test('Check unlisted video as anonymous via direct link -> Available' , async ({ page }) => {
        await page.goto(videoUrl!, { waitUntil: 'networkidle' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
        await assertVideoIsPlaying(page);
    })

    test('Check unlisted video as another user via direct link -> Available', async ({ page, request }) => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        user2 = await authApi.createAndVerifyUser();
        const password = process.env.USER_PASSWORD!;
        await authFlow.loginSuccess(user2.email, password);

        await page.goto(videoUrl!, { waitUntil: 'networkidle' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
        await assertVideoIsPlaying(page);
    })

})
