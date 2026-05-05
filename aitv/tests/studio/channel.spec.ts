import { test, expect } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { VideoApi } from '../../../src/api/VideoApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { UploadVideoFlow } from '../../../src/flows/UploadVideoFlow';
import { UploadVideoPage } from '../../../src/pages/components/UploadVideoPage';
import { SideBarPage } from '../../../src/pages/components/SideBarPage';
import { StudioContentPage } from '../../../src/pages/studio/StudioContentPage';
import { EditChannelPage } from '../../../src/pages/studio/EditChannelPage';
import { uploadWithChunkCheck } from '../../../src/utils/studioTestHelpers';
import { ensureOnStudioDomain } from '../../../src/utils/studioNavigation';

//TODO: 1. Create channel
//TODO: 2. Check channel is available in the list
//TODO: 3. Delete channel
//TODO: 4. Edit channel - Upload banner
//TODO: 5. Edit channel - Channel Picture
//TODO: 6. Edit channel - Privacy settings
//TODO: 7. Edit channel - Name&Handle
//TODO: 8. Edit channel - Channel description/Short description
//TODO: 9. Edit channel - Video Importer
//TODO: 10. Edit channel - Highlighted video
//TODO: 11. Home page - Visual test
//TODO: 12. Home page - Membership
//TODO: 13. Home page - Membership
//TODO: 14. Home page - Videos | Sorting
//TODO: 15. Home page - Shorts | Sorting
//TODO: 16. Home page - Playlists
//TODO: 17. Home page - Counter - videos, subscribers

const VIDEO_PATH = 'test-data/fixtures/video/5secVideo.mp4';
const THUMB_PATH = 'test-data/fixtures/photo/cat.jpg';

test('Set default video description in channel settings — saved successfully',
    { tag: '@critical', annotation: { type: 'TC', description: 'CHANNEL-017' } },
    async ({ page, request }) => {
        test.setTimeout(60_000);

        const authApi = new AuthApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const editChannelPage = new EditChannelPage(page);
        const defaultDescription = `Default desc ${Date.now()}`;

        await test.step('Create user, login and navigate to channel settings', async () => {
            const user = await authApi.createAndVerifyUser();
            await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
            await sideBar.clickStudioEditChannel();
        });

        await test.step('Fill default video description and save', async () => {
            await editChannelPage.fillDefaultVideoDescription(defaultDescription);
            await editChannelPage.clickSave();
            await editChannelPage.assertSuccessToast();
        });

        await test.step('Reload page and verify description is persisted', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await editChannelPage.assertDefaultVideoDescriptionValue(defaultDescription);
        });
    }
);

test('Default description auto-fills description field when opening upload popup',
    { annotation: { type: 'TC', description: 'CHANNEL-018' } },
    async ({ page, request }) => {
        test.setTimeout(120_000);

        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const uploadVideoPage = new UploadVideoPage(page);

        const defaultDescription = `Default desc ${Date.now()}`;

        await test.step('Create user and set default video description via API', async () => {
            const user = await authApi.createAndVerifyUser();
            const token = await authApi.getUserToken(user.email, process.env.USER_PASSWORD!);
            const channelId = await videoApi.getChannelId(token);
            await videoApi.setDefaultVideoDescription(token, channelId, user.username, defaultDescription);
            await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
            await ensureOnStudioDomain(page);
            await sideBar.clickStudioContent();
        });

        await test.step('Open upload popup and verify description is pre-filled with default', async () => {
            await uploadWithChunkCheck(page, async () => {
                await uploadVideoFlow.uploadVideo(VIDEO_PATH, 'test-video');
            });
            await uploadVideoPage.assertDescriptionContains(defaultDescription);
        });
    }
);

test('Override pre-filled description — video saved with custom description',
    { annotation: { type: 'TC', description: 'CHANNEL-019' } },
    async ({ page, request }) => {
        test.setTimeout(180_000);

        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const uploadVideoPage = new UploadVideoPage(page);
        const studioContentPage = new StudioContentPage(page);

        const videoName = `video-${Date.now()}`;
        const defaultDescription = `Default desc ${Date.now()}`;
        const customDescription = `Custom desc ${Date.now()}`;

        await test.step('Create user and set default video description via API', async () => {
            const user = await authApi.createAndVerifyUser();
            const token = await authApi.getUserToken(user.email, process.env.USER_PASSWORD!);
            const channelId = await videoApi.getChannelId(token);
            await videoApi.setDefaultVideoDescription(token, channelId, user.username, defaultDescription);
            await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
            await ensureOnStudioDomain(page);
            await sideBar.clickStudioContent();
        });

        await test.step('Upload video and override pre-filled description with custom text', async () => {
            await uploadWithChunkCheck(page, async () => {
                await uploadVideoFlow.uploadVideo(VIDEO_PATH, videoName);
                await uploadVideoPage.fillVideoTitle(videoName);
                await uploadVideoPage.fillVideoDescription(customDescription);
                await uploadVideoFlow.uploadVideoThumb(THUMB_PATH);
                await uploadVideoPage.selectVideoCategory();
                await uploadVideoPage.clickNextBtn();
                await uploadVideoFlow.waitStatusSuccessfully();
            });
            await uploadVideoFlow.selectVisibility('public');
            await uploadVideoFlow.clickPublishBtn();
        });

        await test.step('Verify video saved with custom description, not the default', async () => {
            await sideBar.clickStudioContent();
            await page.reload();
            await studioContentPage.checkVideoDescription(customDescription);
        });
    }
);

test('Clear default description — upload popup opens with empty description',
    { annotation: { type: 'TC', description: 'CHANNEL-020' } },
    async ({ page, request }) => {
        test.setTimeout(120_000);

        const authApi = new AuthApi(request);
        const videoApi = new VideoApi(request);
        const authFlow = new AuthFlow(page);
        const sideBar = new SideBarPage(page);
        const editChannelPage = new EditChannelPage(page);
        const uploadVideoFlow = new UploadVideoFlow(page);
        const uploadVideoPage = new UploadVideoPage(page);

        const defaultDescription = `Default desc ${Date.now()}`;

        await test.step('Create user and set default video description via API', async () => {
            const user = await authApi.createAndVerifyUser();
            const token = await authApi.getUserToken(user.email, process.env.USER_PASSWORD!);
            const channelId = await videoApi.getChannelId(token);
            await videoApi.setDefaultVideoDescription(token, channelId, user.username, defaultDescription);
            await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
            await sideBar.clickStudioEditChannel();
        });

        await test.step('Clear default description and save', async () => {
            await editChannelPage.assertDefaultVideoDescriptionValue(defaultDescription);
            await editChannelPage.clearDefaultVideoDescription();
            await editChannelPage.clickSave();
            await editChannelPage.assertSuccessToast();
            await sideBar.clickStudioContent();
        });

        await test.step('Open upload popup and verify description field is empty', async () => {
            await uploadWithChunkCheck(page, async () => {
                await uploadVideoFlow.uploadVideo(VIDEO_PATH, 'test-video');
            });
            await uploadVideoPage.assertDescriptionDoesNotContain(defaultDescription);
            await expect(
                uploadVideoPage.descriptionEditor,
                'Description field should be empty after clearing default'
            ).toHaveText(/^\s*$/);
        });
    }
);
