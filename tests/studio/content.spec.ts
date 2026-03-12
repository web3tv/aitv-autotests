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

// test.describe.configure({ mode: 'parallel' });

test('Public video', async ({ page, request }) => {
    test.setTimeout(120_000);
    let user: { email: string, username: string };
    const videoName: string = Date.now().toString();
    let newUrl: string | null;
    let description: string;
    const baseUrl = process.env.BASE_URL;
    const password = process.env.USER_PASSWORD!;

    await test.step('Create user and fix channel privacy to public', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioProfilePage = new StudioProfilePage(page);
        const sideBar = new SideBarPage(page);

        user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password);
        await sideBar.clickStudioProfileChannel();
        await studioProfilePage.changePrivacyToPublic();
    });

    await test.step('Upload public video to channel and check video on studio page -> Available', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        let chunkError: string | null = null;
        const chunkListener = (response: import('@playwright/test').Response) => {
            if (response.url().includes('chunk') && response.status() === 500) {
                chunkError = `Chunk upload failed with 500: ${response.url()}`;
            }
        };
        page.on('response', chunkListener);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
        description = await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();

        page.off('response', chunkListener);
        expect(chunkError, chunkError ?? '').toBeNull();

        await uploadVideoFlow.selectVisibility('public');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Public');

        newUrl = await studioContentPage.getFirstVideoUrl();
        if (!newUrl) {
            throw new Error('Video URL was not found');
        }
    });

    await test.step('Logout before anonymous checks', async () => {
        const authFlow = new AuthFlow(page);
        await authFlow.logout();
    });

    await test.step('Check public video visibility on channel page -> Available', async () => {
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '/@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.checkVideoIsExist(videoName);
    });

    await test.step('Check public video as anonymous via direct link -> Available', async () => {
        await page.goto(newUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
        await assertVideoIsPlaying(page);
    });

    await test.step('Check public video as another user via direct link -> Available', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const user2 = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user2.email, password);

        await page.goto(newUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
        await assertVideoIsPlaying(page);
    });
})

test('Private video', async ({ page, request }) => {
    test.setTimeout(120_000);
    let user: { email: string, username: string };
    const videoName: string = Date.now().toString();
    let newUrl: string | null;
    const baseUrl = process.env.BASE_URL;
    const password = process.env.USER_PASSWORD!;

    await test.step('Create user and fix channel privacy to public', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioProfilePage = new StudioProfilePage(page);
        const sideBar = new SideBarPage(page);

        user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password);
        await sideBar.clickStudioProfileChannel();
        await studioProfilePage.changePrivacyToPublic();
    });

    await test.step('Upload private video to channel and check video on studio page -> Available', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        let chunkError: string | null = null;
        const chunkListener = (response: import('@playwright/test').Response) => {
            if (response.url().includes('chunk') && response.status() === 500) {
                chunkError = `Chunk upload failed with 500: ${response.url()}`;
            }
        };
        page.on('response', chunkListener);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
        await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();

        page.off('response', chunkListener);
        expect(chunkError, chunkError ?? '').toBeNull();

        await uploadVideoFlow.selectVisibility('private');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Private');

        newUrl = await studioContentPage.getFirstVideoUrl();
        if (!newUrl) {
            throw new Error('Video URL was not found');
        }
    });

    await test.step('Logout before anonymous checks', async () => {
        const authFlow = new AuthFlow(page);
        await authFlow.logout();
    });

    await test.step('Check private video visibility on channel page -> Not available', async () => {
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '/@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.checkPrivateVideoOnChannelPage();
    });

    await test.step('Check private video as anonymous via direct link -> Unavailable', async () => {
        const channelMainPage = new ChannelMainPage(page);
        await page.goto(newUrl!, { waitUntil: 'domcontentloaded' });
        await channelMainPage.checkPrivateVideoViaDirectLink();
    });

    await test.step('Check private video as another user via direct link -> Unavailable', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);
        const user2 = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user2.email, password);
        await page.goto(newUrl!, { waitUntil: 'domcontentloaded' });
        await channelMainPage.checkPrivateVideoViaDirectLink();
    });
})

test('Paid video', async ({ page, request }) => {
    test.setTimeout(120_000);
    let user: { email: string, username: string };
    const videoName: string = Date.now().toString();
    let videoUrl: string | null;
    const baseUrl = process.env.BASE_URL;
    const password = process.env.USER_PASSWORD!;
    const membershipName = 'Subscription #1';
    const membershipDescription = 'Description for card #1';

    await test.step('Create user and fix channel privacy to public', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioProfilePage = new StudioProfilePage(page);
        const sideBar = new SideBarPage(page);

        user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password);
        await sideBar.clickStudioProfileChannel();
        await studioProfilePage.changePrivacyToPublic();
    });

    await test.step('Create subscription plan', async () => {
        const sideBar = new SideBarPage(page);
        const studioMembershipPage = new StudioMembershipPage(page);

        await sideBar.clickStudioMemberships();
        await studioMembershipPage.addMembershipPlan(membershipName, membershipDescription);
        await studioMembershipPage.checkAddedPlan(membershipName, membershipDescription);
    });

    await test.step('Upload paid video to channel and check video on studio page -> Available', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);
        
        await page.goto('/');

        let chunkError: string | null = null;
        const chunkListener = (response: import('@playwright/test').Response) => {
            if (response.url().includes('chunk') && response.status() === 500) {
                chunkError = `Chunk upload failed with 500: ${response.url()}`;
            }
        };
        page.on('response', chunkListener);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
        await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();

        page.off('response', chunkListener);
        expect(chunkError, chunkError ?? '').toBeNull();

        await uploadVideoFlow.selectVisibility('paid');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Paid');

        videoUrl = await studioContentPage.getFirstVideoUrl();
        if (!videoUrl) {
            throw new Error('Video URL was not found');
        }
    });

    await test.step('Logout before anonymous checks', async () => {
        const authFlow = new AuthFlow(page);
        await authFlow.logout();
    });

    await test.step('Check paid video visibility on channel page -> Available', async () => {
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '/@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.checkPaidVideoAttributes();
    });

    await test.step('Check paid video as anonymous via direct link -> Unavailable', async () => {
        const channelMainPage = new ChannelMainPage(page);
        await page.goto(videoUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h3')).toContainText(membershipName);
        await expect(page.locator('body')).toContainText(membershipDescription);
        await expect(page.locator('body')).toContainText('$0.991 week');
        await channelMainPage.clickRegisterLoginBtn();
        await expect(page.locator('body')).toContainText('Please log in to your Web3.TV account using one of the login methods below');
    });

    await test.step('Check paid video as another user via direct link -> Unavailable', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const channelMainPage = new ChannelMainPage(page);
        const user2 = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user2.email, password);
        await page.goto(videoUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h3')).toContainText(membershipName);
        await expect(page.locator('body')).toContainText(membershipDescription);
        await expect(page.locator('body')).toContainText('$0.991 week');
        await channelMainPage.clickButtonSubscribeNow();
        await expect(page).toHaveURL(/test\.pay\.hero\.io\/invoice\/currency-list(\?.*)?$/);
    });
})

test('Unlisted video', async ({ page, request }) => {
    test.setTimeout(120_000);
    let user: { email: string, username: string };
    const videoName: string = Date.now().toString();
    let videoUrl: string | null;
    let description: string;
    const baseUrl = process.env.BASE_URL;
    const password = process.env.USER_PASSWORD!;

    await test.step('Create user and fix channel privacy to public', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioProfilePage = new StudioProfilePage(page);
        const sideBar = new SideBarPage(page);

        user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password);
        await sideBar.clickStudioProfileChannel();
        await studioProfilePage.changePrivacyToPublic();
    });

    await test.step('Upload unlisted video to channel and check video on studio page -> Available', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        let chunkError: string | null = null;
        const chunkListener = (response: import('@playwright/test').Response) => {
            if (response.url().includes('chunk') && response.status() === 500) {
                chunkError = `Chunk upload failed with 500: ${response.url()}`;
            }
        };
        page.on('response', chunkListener);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/5secVideo.mp4', '5secVideo');
        description = await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();

        page.off('response', chunkListener);
        expect(chunkError, chunkError ?? '').toBeNull();

        await uploadVideoFlow.selectVisibility('unlisted');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Unlisted');

        videoUrl = await studioContentPage.getFirstVideoUrl();
        if (!videoUrl) {
            throw new Error('Video URL was not found');
        }
    });

    await test.step('Logout before anonymous checks', async () => {
        const authFlow = new AuthFlow(page);
        await authFlow.logout();
    });

    await test.step('Check unlisted video visibility on channel page -> Not Available', async () => {
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '/@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.checkUnlistedVideoNotAvailable();
    });

    await test.step('Check unlisted video as anonymous via direct link -> Available', async () => {
        await page.goto(videoUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
        await assertVideoIsPlaying(page);
    });

    await test.step('Check unlisted video as another user via direct link -> Available', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const user2 = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user2.email, password);

        await page.goto(videoUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
        await assertVideoIsPlaying(page);
    });
})

test('Upload video >50mb workflow', async ({ page, request }) => {
    test.setTimeout(270_000);
    let user: { email: string, username: string };
    let description: string;
    const videoName: string = Date.now().toString();
    
    await test.step('Create user and fix channel privacy to public', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const password = process.env.USER_PASSWORD!;

        user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password);
    });

    await test.step('Upload large video to channel and check video on studio page', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);

        await uploadVideoFlow.uploadVideo('test-data/fixtures/video/Video_more50mb.mp4','Video_more50mb');
        description = await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfullyForBigVideo();
        await uploadVideoFlow.selectVisibility('unlisted');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmVideoUploading('Unlisted');
    });
})

test('Upload public short video', async ({ page, request }) => {
    test.setTimeout(180_000);
    let user: { email: string, username: string };
    const videoName: string = Date.now().toString();
    let newUrl: string | null;
    let description: string;
    const baseUrl = process.env.BASE_URL;
    const password = process.env.USER_PASSWORD!;

    await test.step('Create user and fix channel privacy to public', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const studioProfilePage = new StudioProfilePage(page);
        const sideBar = new SideBarPage(page);

        user = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user.email, password);
        await sideBar.clickStudioProfileChannel();
        await studioProfilePage.changePrivacyToPublic();
    });

    await test.step('Upload public short to channel and check video on studio page -> Available', async () => {
        const uploadVideoFlow = new UploadVideoFlow(page);
        const studioContentPage = new StudioContentPage(page);

        let chunkError: string | null = null;
        const chunkListener = (response: import('@playwright/test').Response) => {
            if (response.url().includes('chunk') && response.status() === 500) {
                chunkError = `Chunk upload failed with 500: ${response.url()}`;
            }
        };
        page.on('response', chunkListener);

        await uploadVideoFlow.uploadShort('test-data/fixtures/video/shortsVideo.MOV', 'shortsVideo');
        description = await uploadVideoFlow.fillInReqFileds(videoName);
        await uploadVideoFlow.waitStatusSuccessfully();

        page.off('response', chunkListener);
        expect(chunkError, chunkError ?? '').toBeNull();

        await uploadVideoFlow.selectVisibility('public');
        await uploadVideoFlow.clickPublishBtn();
        await uploadVideoFlow.confirmShortsUploading('Public');

        newUrl = await studioContentPage.getFirstVideoUrl();
        if (!newUrl) {
            throw new Error('Video URL was not found');
        }
    });

    await test.step('Logout before anonymous checks', async () => {
        const authFlow = new AuthFlow(page);
        await authFlow.logout();
    });

    await test.step('Check public short visibility on channel page -> Available', async () => {
        const channelMainPage = new ChannelMainPage(page);
        const channelUrl = baseUrl + '/@' + user.username;
        await page.goto(channelUrl, { waitUntil: 'domcontentloaded' });
        await channelMainPage.checkShortsIsExist(videoName);
    });

    await test.step('Check public short as anonymous via direct link -> Available', async () => {
        await page.goto(newUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
    });

    await test.step('Check public short as another user via direct link -> Available', async () => {
        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const user2 = await authApi.createAndVerifyUser();
        await authFlow.loginSuccess(user2.email, password);

        await page.goto(newUrl!, { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(videoName)).toBeVisible({ timeout: 10_000 });
    });
})



// TODO: Edit video and chech changes 