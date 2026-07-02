import { test, expect } from '@playwright/test';
import { AuthApi } from '../../../src/api/AuthApi';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { ContentCreationFlow } from '../../../src/flows/ContentCreationFlow';

test('Upload video — required fields validation', { tag: '@validation', annotation: { type: 'TC', description: 'UPLOAD-009' } }, async ({ page, request }) => {
    test.setTimeout(90_000);

    const flow = new ContentCreationFlow(page);
    const modal = flow.modal;

    await test.step('Create user, login and open the upload form', async () => {
        const user = await new AuthApi(request).createUserFast();
        await new AuthFlow(page).loginSuccess(user.email, process.env.USER_PASSWORD!, user.username);

        await flow.openNewVideo();
        await modal.selectFile('test-data/fixtures/video/5secVideo.mp4');
        await modal.selectType('movie');
    });

    await test.step('Empty form — Next surfaces required-field errors and stays on Details', async () => {
        await modal.clickNext();
        await expect(page.getByText('Title is required'), '"Title is required" error is not shown').toBeVisible();
        await expect(page.getByText('Description is required'), '"Description is required" error is not shown').toBeVisible();
        await expect(modal.detailsStep, 'Should stay on the Details step while required fields are empty').toBeVisible();
        await expect(modal.finalizeStep, 'Should not advance to Finalize with empty required fields').toBeHidden();
    });

    await test.step('Title + description only — Next stays disabled until category/genres/covers are set', async () => {
        await modal.fillTitle('QA Title');
        await modal.fillDescription('QA description text');
        await modal.assertNextDisabled();
    });
});
