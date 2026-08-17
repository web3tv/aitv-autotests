import { test, expect } from '@playwright/test';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { AuthApi } from '../../src/api/AuthApi';
import { EditProfileModalPage } from '../../src/pages/account/EditProfileModalPage';

test('Change user avatar and check new avatar is displayed', { annotation: [{ type: 'TC', description: 'PROFILE-001' }, { type: 'TC', description: 'PROFILE-002' }] }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const editProfile = new EditProfileModalPage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and open account settings', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await authFlow.openAccountSettings();
  });

  await test.step('Verify new user has no avatar (placeholder shown)', async () => {
    await expect(editProfile.profileHeader, 'Profile header is not visible').toBeVisible();
    const initialSrc = await editProfile.getHeaderAvatarSrc();
    expect(initialSrc, 'New user should not have an avatar image').toBeNull();
  });

  let firstAvatarSrc: string | null;

  await test.step('Upload first avatar and verify src appeared', async () => {
    await editProfile.open();
    await editProfile.uploadAvatar('test-data/fixtures/photo/cat.jpg');
    await expect(editProfile.modalAvatar, 'Cropped avatar preview should appear in the modal').toBeVisible();
    await editProfile.save();
    await expect(editProfile.headerAvatar, 'Avatar image should appear in the profile header').toBeVisible();
    firstAvatarSrc = await editProfile.getHeaderAvatarSrc();
    expect(firstAvatarSrc, 'Avatar src should not be empty after first upload').toBeTruthy();
  });

  await test.step('Upload second avatar and verify src changed', async () => {
    await editProfile.open();
    await editProfile.uploadAvatar('test-data/fixtures/photo/cat.jpg');
    await editProfile.save();
    await expect(editProfile.headerAvatar, 'Avatar image should stay visible after second upload').toBeVisible();
    await expect
      .poll(() => editProfile.getHeaderAvatarSrc(), { message: 'Avatar src should change after uploading a new photo', timeout: 20_000 })
      .not.toBe(firstAvatarSrc);
  });
});

test('Edit biography and verify persistence', { annotation: { type: 'TC', description: 'PROFILE-003' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const editProfile = new EditProfileModalPage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and open account settings', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await authFlow.openAccountSettings();
  });

  const bioText = 'Test biography text for automation';

  await test.step('Fill bio, save, reload — verify persisted', async () => {
    await editProfile.open();
    await editProfile.fillBio(bioText);
    await editProfile.save();
    await editProfile.assertHeaderBio(bioText);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await editProfile.open();
    await editProfile.assertBioValue(bioText);
  });

  const updatedBioText = 'Updated biography with new content 12345';

  await test.step('Edit bio to new text, save, reload — verify updated', async () => {
    await editProfile.fillBio(updatedBioText);
    await editProfile.save();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await editProfile.open();
    await editProfile.assertBioValue(updatedBioText);
  });

  await test.step('Clear bio, save, reload — verify empty', async () => {
    await editProfile.clearBio();
    await editProfile.save();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await editProfile.open();
    await editProfile.assertBioValue('');
  });
});

test('Add and edit social links and verify persistence', { annotation: { type: 'TC', description: 'PROFILE-004' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const editProfile = new EditProfileModalPage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and open account settings', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await authFlow.openAccountSettings();
  });

  // Facebook is stored as a full URL, the other three as usernames extracted from the input
  const links = {
    facebook: 'facebook.com/testuser',
    twitter: 'test_twitter',
    instagram: 'test_instagram',
    tiktok: 'test_tiktok',
  };

  await test.step('Fill all 4 social links, save — verify saved via API response', async () => {
    await editProfile.open();
    await editProfile.fillAllSocialLinks(links);
    const response = await editProfile.saveAndGetResponse();
    const body = await response.json();
    expect(body.data.socials.facebookUrl, 'Facebook URL not saved').toBe('https://facebook.com/testuser');
    expect(body.data.socials.twitterUsername, 'Twitter username not saved').toBe(links.twitter);
    expect(body.data.socials.instagramUsername, 'Instagram username not saved').toBe(links.instagram);
    expect(body.data.socials.tiktokUsername, 'TikTok username not saved').toBe(links.tiktok);
  });

  await test.step('Reopen modal — verify links are rendered with their platform prefixes', async () => {
    await editProfile.open();
    await editProfile.assertSocialLinkValue('facebook', 'facebook.com/testuser');
    await editProfile.assertSocialLinkValue('twitter', 'x.com/test_twitter');
    await editProfile.assertSocialLinkValue('instagram', 'instagram.com/test_instagram');
    await editProfile.assertSocialLinkValue('tiktok', 'tiktok.com/@test_tiktok');
  });

  await test.step('Edit 2 links, save — verify updated via API response', async () => {
    await editProfile.fillSocialLink('facebook', 'facebook.com/updated_user');
    await editProfile.fillSocialLink('twitter', 'x.com/updated_tw');
    const response = await editProfile.saveAndGetResponse();
    const body = await response.json();
    expect(body.data.socials.facebookUrl, 'Updated Facebook URL not saved').toBe('https://facebook.com/updated_user');
    expect(body.data.socials.twitterUsername, 'Updated Twitter username not saved').toBe('updated_tw');
    expect(body.data.socials.instagramUsername, 'Instagram should remain').toBe(links.instagram);
    expect(body.data.socials.tiktokUsername, 'TikTok should remain').toBe(links.tiktok);
  });

  await test.step('Clear all links, save — verify cleared via API response', async () => {
    await editProfile.open();
    await editProfile.clearAllSocialLinks();
    const response = await editProfile.saveAndGetResponse();
    const body = await response.json();
    expect(body.data.socials.facebookUrl, 'Facebook should be empty').toBe('');
    expect(body.data.socials.twitterUsername, 'Twitter should be empty').toBe('');
    expect(body.data.socials.instagramUsername, 'Instagram should be empty').toBe('');
    expect(body.data.socials.tiktokUsername, 'TikTok should be empty').toBe('');
  });

  await test.step('Reload page — verify social links persisted empty in form fields', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await editProfile.open();
    await editProfile.assertSocialLinkValue('facebook', '');
    await editProfile.assertSocialLinkValue('twitter', '');
    await editProfile.assertSocialLinkValue('instagram', '');
    await editProfile.assertSocialLinkValue('tiktok', '');
  });
});

test('Biography max length validation (200 chars)', { annotation: { type: 'TC', description: 'PROFILE-005' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const editProfile = new EditProfileModalPage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and open account settings', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await authFlow.openAccountSettings();
  });

  await test.step('Fill bio with 200 chars — should accept all', async () => {
    const text200 = 'a'.repeat(200);
    await editProfile.open();
    await editProfile.fillBio(text200);
    await editProfile.assertBioCounter('200/200');
    await editProfile.save();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await editProfile.open();
    await editProfile.assertBioValue(text200);
  });

  await test.step('Fill bio with 201 chars — should truncate to 200', async () => {
    await editProfile.fillBio('b'.repeat(201));
    const actualValue = await editProfile.bioInput.inputValue();
    expect(actualValue.length, 'Bio should be truncated to 200 chars').toBe(200);
    await editProfile.assertBioCounter('200/200');
  });
});

test('Social links max length validation (100 chars)', { annotation: { type: 'TC', description: 'PROFILE-006' } }, async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const editProfile = new EditProfileModalPage(page);
  const password = process.env.USER_PASSWORD!;

  const user = await authApi.createUserFast();

  await test.step('Login and open account settings', async () => {
    await authFlow.loginSuccess(user.email, password, user.username);
    await authFlow.openAccountSettings();
  });

  // Facebook accepts a link; the field strips the scheme, so 100 chars is the visible link length
  const fbLink100 = 'facebook.com/' + 'a'.repeat(87); // 13 + 87

  await test.step('Fill Facebook with 100 chars — should accept all', async () => {
    await editProfile.open();
    await editProfile.fillSocialLink('facebook', fbLink100);
    expect((await editProfile.facebookInput.inputValue()).length, 'Facebook should accept 100 chars').toBe(100);
    const response = await editProfile.saveAndGetResponse();
    const body = await response.json();
    expect(body.data.socials.facebookUrl, 'Facebook URL should be saved in full').toBe('https://' + fbLink100);
  });

  await test.step('Fill Facebook with 101 chars — should truncate to 100', async () => {
    await editProfile.open();
    await editProfile.fillSocialLink('facebook', 'facebook.com/' + 'b'.repeat(88)); // 101 chars
    const actualValue = await editProfile.facebookInput.inputValue();
    expect(actualValue.length, 'Facebook should be truncated to 100 chars').toBe(100);
  });

  await test.step('Fill Twitter with 101 chars — should truncate to 100 and block saving', async () => {
    await editProfile.fillSocialLink('twitter', 'b'.repeat(101));
    const actualValue = await editProfile.twitterInput.inputValue();
    expect(actualValue.length, 'Twitter should be truncated to 100 chars').toBe(100);
    // an X username may not exceed 15 chars — the form stays invalid
    await editProfile.assertSaveDisabled();
  });
});
