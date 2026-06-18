import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../../src/flows/AuthFlow';
import { AuthApi } from '../../../src/api/AuthApi';
import { SideBarPage } from '../../../src/pages/components/SideBarPage';
import { ProfilePage } from '../../../src/pages/account/ProfilePage';

test.fixme('Change user avatar and check new avatar is displayed', { annotation: [{ type: 'TC', description: 'PROFILE-001' }, { type: 'TC', description: 'PROFILE-002' }] }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const profilePage = new ProfilePage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and navigate to profile settings', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await sideBarPage.clickSettingsProfile();
  });

  await test.step('Verify new user has no avatar (placeholder shown)', async () => {
    const initialSrc = await profilePage.getAvatarSrc();
    expect(initialSrc, 'New user should not have an avatar image').toBeNull();
  });

  let firstAvatarSrc: string | null;

  await test.step('Upload first avatar and verify src appeared', async () => {
    await profilePage.uploadAvatarAndSubmit('test-data/fixtures/photo/cat.jpg');
    await expect(profilePage.profileAvatar, 'Avatar image should appear after first upload').toBeVisible();
    firstAvatarSrc = await profilePage.getAvatarSrc();
    expect(firstAvatarSrc, 'Avatar src should not be empty after first upload').toBeTruthy();
  });

  await test.step('Upload second avatar and verify src changed', async () => {
    await profilePage.uploadAvatarAndSubmit('test-data/fixtures/photo/cat.jpg');
    await expect(profilePage.profileAvatar, 'Avatar image should be visible after second upload').toBeVisible();
    const secondAvatarSrc = await profilePage.getAvatarSrc();
    expect(secondAvatarSrc, 'Avatar src should not be empty after second upload').toBeTruthy();
    expect(secondAvatarSrc, 'Avatar src should change after uploading a new photo').not.toBe(firstAvatarSrc);
  });
});

test.fixme('Edit biography and verify persistence', { annotation: { type: 'TC', description: 'PROFILE-003' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const profilePage = new ProfilePage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and navigate to /profile', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await sideBarPage.clickSettingsProfile();
  });

  const bioText = 'Test biography text for automation';

  await test.step('Fill biography, submit, reload — verify persisted', async () => {
    await profilePage.fillBiography(bioText);
    await profilePage.submitProfileAndWaitForResponse();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await profilePage.assertBiographyValue(bioText);
  });

  const updatedBioText = 'Updated biography with new content 12345';

  await test.step('Edit biography to new text, submit, reload — verify updated', async () => {
    await profilePage.fillBiography(updatedBioText);
    await profilePage.submitProfileAndWaitForResponse();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await profilePage.assertBiographyValue(updatedBioText);
  });

  await test.step('Clear biography, submit, reload — verify empty', async () => {
    await profilePage.clearBiography();
    await profilePage.submitProfileAndWaitForResponse();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await profilePage.assertBiographyValue('');
  });
});

test.fixme('Add and edit social links and verify persistence', { annotation: { type: 'TC', description: 'PROFILE-004' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const profilePage = new ProfilePage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and navigate to /profile', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await sideBarPage.clickSettingsProfile();
  });

  const links = {
    facebook: 'https://facebook.com/testuser',
    twitter: 'test_twitter_user',
    instagram: 'test_instagram_user',
    tiktok: 'test_tiktok_user',
  };

  await test.step('Fill all 4 social links, submit — verify saved via API response', async () => {
    await profilePage.fillAllSocialLinks(links);
    const response = await profilePage.submitProfileAndGetResponse();
    const body = await response.json();
    expect(body.data.socials.facebookUrl, 'Facebook URL not saved').toBe(links.facebook);
    expect(body.data.socials.twitterUsername, 'Twitter username not saved').toBe(links.twitter);
    expect(body.data.socials.instagramUsername, 'Instagram username not saved').toBe(links.instagram);
    expect(body.data.socials.tiktokUsername, 'TikTok username not saved').toBe(links.tiktok);
  });

  const updatedLinks = {
    facebook: 'https://facebook.com/updated_user',
    twitter: 'updated_twitter',
  };

  await test.step('Edit 2 links, submit — verify updated via API response', async () => {
    await profilePage.fillSocialLink('facebook', updatedLinks.facebook);
    await profilePage.fillSocialLink('twitter', updatedLinks.twitter);
    const response = await profilePage.submitProfileAndGetResponse();
    const body = await response.json();
    expect(body.data.socials.facebookUrl, 'Updated Facebook URL not saved').toBe(updatedLinks.facebook);
    expect(body.data.socials.twitterUsername, 'Updated Twitter username not saved').toBe(updatedLinks.twitter);
    expect(body.data.socials.instagramUsername, 'Instagram should remain').toBe(links.instagram);
    expect(body.data.socials.tiktokUsername, 'TikTok should remain').toBe(links.tiktok);
  });

  await test.step('Clear all links, submit — verify cleared via API response', async () => {
    await profilePage.clearAllSocialLinks();
    const response = await profilePage.submitProfileAndGetResponse();
    const body = await response.json();
    expect(body.data.socials.facebookUrl, 'Facebook should be empty').toBe('');
    expect(body.data.socials.twitterUsername, 'Twitter should be empty').toBe('');
    expect(body.data.socials.instagramUsername, 'Instagram should be empty').toBe('');
    expect(body.data.socials.tiktokUsername, 'TikTok should be empty').toBe('');
  });

  await test.step('Reload page — verify social links persisted in form fields', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await profilePage.assertSocialLinkValue('facebook', '');
    await profilePage.assertSocialLinkValue('twitter', '');
    await profilePage.assertSocialLinkValue('instagram', '');
    await profilePage.assertSocialLinkValue('tiktok', '');
  });
});

test.fixme('Biography max length validation (1000 chars)', { annotation: { type: 'TC', description: 'PROFILE-005' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const profilePage = new ProfilePage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and navigate to /profile', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await sideBarPage.clickSettingsProfile();
  });

  await test.step('Fill biography with 1000 chars — should accept all', async () => {
    const text1000 = 'a'.repeat(1000);
    await profilePage.fillBiography(text1000);
    await profilePage.assertBiographyCharCounter('1000/1000 characters limit');
    await profilePage.submitProfileAndWaitForResponse();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await profilePage.assertBiographyValue(text1000);
  });

  await test.step('Fill biography with 1001 chars — should truncate to 1000', async () => {
    const text1001 = 'b'.repeat(1001);
    await profilePage.biographyInput.fill(text1001);
    const actualValue = await profilePage.biographyInput.inputValue();
    expect(actualValue.length, 'Biography should be truncated to 1000 chars').toBe(1000);
    await profilePage.assertBiographyCharCounter('1000/1000 characters limit');
  });
});

test.fixme('Social links max length validation (100 chars)', { annotation: { type: 'TC', description: 'PROFILE-006' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const sideBarPage = new SideBarPage(page);
  const profilePage = new ProfilePage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and navigate to /profile', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await sideBarPage.clickSettingsProfile();
  });

  // Facebook expects a URL, Twitter/Instagram/TikTok expect usernames
  const fbUrl100 = 'https://facebook.com/' + 'a'.repeat(79); // 100 chars total (21 + 79)
  const username100 = 'a'.repeat(100);

  await test.step('Fill Facebook with 100 chars — should accept all', async () => {
    await profilePage.fillSocialLink('facebook', fbUrl100);
    await profilePage.assertSocialLinkCharCounter('facebook', '100/100 characters limit');
    const response = await profilePage.submitProfileAndGetResponse();
    const body = await response.json();
    expect(body.data.socials.facebookUrl.length, 'Facebook URL should be 100 chars').toBe(100);
  });

  await test.step('Fill Facebook with 101 chars — should truncate to 100', async () => {
    const fbUrl101 = 'https://facebook.com/' + 'b'.repeat(80); // 101 chars total (21 + 80)
    await profilePage.facebookInput.fill(fbUrl101);
    const actualValue = await profilePage.facebookInput.inputValue();
    expect(actualValue.length, 'Facebook should be truncated to 100 chars').toBe(100);
    await profilePage.assertSocialLinkCharCounter('facebook', '100/100 characters limit');
  });

  await test.step('Fill Twitter with 100 chars — should accept all', async () => {
    await profilePage.fillSocialLink('twitter', username100);
    await profilePage.assertSocialLinkCharCounter('twitter', '100/100 characters limit');
    const actualValue = await profilePage.twitterInput.inputValue();
    expect(actualValue.length, 'Twitter should accept 100 chars').toBe(100);
  });

  await test.step('Fill Twitter with 101 chars — should truncate to 100', async () => {
    const username101 = 'b'.repeat(101);
    await profilePage.twitterInput.fill(username101);
    const actualValue = await profilePage.twitterInput.inputValue();
    expect(actualValue.length, 'Twitter should be truncated to 100 chars').toBe(100);
  });
});
