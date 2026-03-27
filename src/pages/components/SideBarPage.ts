import { Page, Locator, expect } from "@playwright/test";

export class SideBarPage {
  readonly page: Page;

  // PLATFORM
  readonly platformSubscription: Locator;
  readonly platformLibrary: Locator;
  readonly platformHistory: Locator;
  readonly platformContinueWatching: Locator;
  readonly platformMyPlaylists: Locator;
  readonly platformWatchLater: Locator;
  readonly platformLikedVideos: Locator;

  // STUDIO
  readonly studioDashboard: Locator;
  readonly studioContent: Locator;
  readonly studioAnalytics: Locator;
  readonly studioSubscriptions: Locator;
  readonly studioPlaylists: Locator;
  readonly studioEditChannel: Locator;
  readonly studioSettings: Locator;

  // SETTINGS
  readonly settingsAccount: Locator;
  readonly settingsProfile: Locator;
  readonly settingsPaidSubscriptions: Locator;
  readonly settingsNotifications: Locator;
  readonly settingsSecurity: Locator;

  // SUPPORT
  readonly supportReport: Locator;
  readonly supportHelp: Locator;
  readonly supportSendFeedback: Locator;
  readonly sendFeedbackModal: Locator;

  constructor(page: Page) {
    this.page = page;

    // PLATFORM
    this.platformSubscription       = page.locator('[data-id="Subscription"]');
    this.platformLibrary            = page.locator('[data-id="Library"]');
    this.platformHistory            = page.locator('[data-id="History"]');
    this.platformContinueWatching   = page.locator('[data-id="Continue Watching"]');
    this.platformMyPlaylists        = page.locator('[data-id="My playlists"]');
    this.platformWatchLater         = page.locator('[data-id="Watch Later"]');
    this.platformLikedVideos        = page.locator('[data-id="Liked Videos"]');

    // STUDIO
    this.studioDashboard            = page.locator('[data-id="Dashboard"]');
    this.studioContent              = page.locator('[data-id="Content"]');
    this.studioAnalytics            = page.locator('[data-id="Analytics"]');
    this.studioSubscriptions        = page.locator('[data-id="Memberships"]');
    this.studioPlaylists            = page.locator('[data-id="Playlists"]');
    this.studioEditChannel          = page.locator('[data-id="Edit channel"]');
    this.studioSettings             = page.locator('[data-id="Settings"]');

    // SETTINGS
    this.settingsAccount            = page.locator('[data-id="Account"]');
    this.settingsProfile            = page.locator('[data-id="Profile"]');
    this.settingsPaidSubscriptions  = page.locator('[data-id="Paid Subscriptions"]');
    this.settingsNotifications      = page.locator('[data-id="Notifications"]');
    this.settingsSecurity           = page.locator('[data-id="Security"]');

    // SUPPORT
    this.supportReport              = page.locator('[data-id="Report"]');
    this.supportHelp                = page.locator('[data-id="Help"]');
    this.supportSendFeedback        = page.locator('[data-id="Send Feedback"]');

    // FEEDBACK MODAL (примерный локатор)
    this.sendFeedbackModal          = page.getByRole("dialog");
  }

  // =========================
  // PLATFORM ACTIONS
  // =========================

  async clickPlatformSubscription() {
    await expect(this.platformSubscription).toBeVisible();
    await this.platformSubscription.click();
    await expect(this.page).toHaveURL(/\/subscription$/);
  }

  async clickPlatformLibrary() {
    await expect(this.platformLibrary).toBeVisible();
    await this.platformLibrary.click();
    await expect(this.page).toHaveURL(/\/library$/);
  }

  async clickPlatformHistory() {
    await expect(this.platformHistory).toBeVisible();
    await this.platformHistory.click();
    await expect(this.page).toHaveURL(/\/history$/);
  }

  async clickPlatformContinueWatching() {
    await expect(this.platformContinueWatching).toBeVisible();
    await this.platformContinueWatching.click();
    await expect(this.page).toHaveURL(/\/continue-watching$/);
  }

  async clickPlatformMyPlaylists() {
    await expect(this.platformMyPlaylists).toBeVisible();
    await this.platformMyPlaylists.click();
    await expect(this.page).toHaveURL(/\/playlist$/);
  }

  async clickPlatformWatchLater() {
    await expect(this.platformWatchLater).toBeVisible();
    await this.platformWatchLater.click();
    await expect(this.page).toHaveURL(/\/watch-later$/);
  }

  async clickPlatformLikedVideos() {
    await expect(this.platformLikedVideos).toBeVisible();
    await this.platformLikedVideos.click();
    await expect(this.page).toHaveURL(/\/liked-videos$/);
  }

  // =========================
  // STUDIO ACTIONS
  // =========================

  /** Navigate to studio domain if not already there */
  private async ensureOnStudioDomain() {
    const studioUrl = process.env.STUDIO_URL || 'https://studio.web3tv.dev';
    if (!this.page.url().includes(new URL(studioUrl).hostname)) {
      await this.page.goto(`${studioUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    }
  }

  async clickStudioDashboard() {
    await this.ensureOnStudioDomain();
    await expect(this.studioDashboard).toBeVisible();
    await this.studioDashboard.click();
    await expect(this.page).toHaveURL(/\/dashboard$/);
  }

  async clickStudioContent() {
    await this.ensureOnStudioDomain();
    await expect(this.studioContent).toBeVisible();
    await this.studioContent.click();
    await expect(this.page).toHaveURL(/\/content$/);
  }

  async clickStudioAnalytics() {
    await this.ensureOnStudioDomain();
    await expect(this.studioAnalytics).toBeVisible();
    await this.studioAnalytics.click();
    await expect(this.page).toHaveURL(/\/stats$/);
  }

  async clickStudioSubscriptions() {
    await this.ensureOnStudioDomain();
    await expect(this.studioSubscriptions).toBeVisible();
    await this.studioSubscriptions.click();
    await expect(this.page).toHaveURL(/\/membership$/);
  }

  async clickStudioPlaylists() {
    await this.ensureOnStudioDomain();
    await expect(this.studioPlaylists).toBeVisible();
    await this.studioPlaylists.click();
    await expect(this.page).toHaveURL(/\/playlists$/);
  }

  async clickStudioEditChannel() {
    await this.ensureOnStudioDomain();
    await expect(this.studioEditChannel).toBeVisible();
    await this.studioEditChannel.click();
    await expect(this.page).toHaveURL(/\/channel$/);
  }

  async clickStudioSettings() {
    await this.ensureOnStudioDomain();
    await expect(this.studioSettings).toBeVisible();
    await this.studioSettings.click();
    await expect(this.page).toHaveURL(/\/settings$/);
  }

  // =========================
  // SETTINGS ACTIONS
  // =========================

  async clickSettingsAccount() {
    await expect(this.settingsAccount).toBeVisible();
    await this.settingsAccount.click();
    await expect(this.page).toHaveURL(/\/account$/);
  }

  async clickSettingsProfile() {
    await expect(this.settingsProfile).toBeVisible();
    await this.settingsProfile.click();
    await expect(this.page).toHaveURL(/\/profile$/);
  }

  async clickSettingsPaidSubscriptions() {
    await expect(this.settingsPaidSubscriptions).toBeVisible();
    await this.settingsPaidSubscriptions.click();
    await expect(this.page).toHaveURL(/\/my-paid-subs$/);
  }

  async clickSettingsNotifications() {
    await expect(this.settingsNotifications).toBeVisible();
    await this.settingsNotifications.click();
    await expect(this.page).toHaveURL(/\/notifications$/);
  }

  async clickSettingsSecurity() {
    await expect(this.settingsSecurity).toBeVisible();
    await this.settingsSecurity.click();
    await expect(this.page).toHaveURL(/\/security$/);
  }

  // =========================
  // SUPPORT ACTIONS
  // =========================

  async clickSupportReport() {
    await expect(this.supportReport).toBeVisible();
    await this.supportReport.click();
    await expect(this.page).toHaveURL(/\/report$/);
  }

  async clickSupportHelp() {
    await expect(this.supportHelp).toBeVisible();
    await this.supportHelp.click();
    await expect(this.page).toHaveURL(/\/help$/);
  }

  async clickSupportSendFeedback() {
    await expect(this.supportSendFeedback).toBeVisible();
    await this.supportSendFeedback.click();
    await expect(this.sendFeedbackModal).toBeVisible();
  }

  // =========================
  // UNIVERSAL METHOD
  // =========================

  async clickMenuItem(dataId: string) {
    const item = this.page.locator(`[data-id="${dataId}"]`);
    await expect(item).toBeVisible();
    await item.click();
  }
}
