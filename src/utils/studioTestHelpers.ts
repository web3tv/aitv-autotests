import { expect, Page, APIRequestContext, Response } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { AuthFlow } from '../flows/AuthFlow';
import { StudioProfilePage } from '../pages/studio/StudioProfilePage';
import { SideBarPage } from '../pages/components/SideBarPage';

export async function setupUserWithPublicChannel(page: Page, request: APIRequestContext): Promise<{ email: string, username: string }> {
    const authApi = new AuthApi(request);
    const authFlow = new AuthFlow(page);
    const studioProfilePage = new StudioProfilePage(page);
    const sideBar = new SideBarPage(page);

    const user = await authApi.createAndVerifyUser();
    await authFlow.loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);
    await sideBar.clickStudioProfileChannel();
    await studioProfilePage.changePrivacyToPublic();
    return user;
}

export async function uploadWithChunkCheck(page: Page, uploadFn: () => Promise<void>): Promise<void> {
    let chunkError: string | null = null;
    const listener = (response: Response) => {
        if (response.url().includes('chunk') && response.status() === 500) {
            chunkError = `Chunk upload failed with 500: ${response.url()}`;
        }
    };
    page.on('response', listener);
    await uploadFn();
    page.off('response', listener);
    expect(chunkError, chunkError ?? '').toBeNull();
}
