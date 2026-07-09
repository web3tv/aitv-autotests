import { Page, Locator, expect } from "@playwright/test";
import { ensureOnStudioDomain } from "../../utils/studioNavigation";

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
    this.studioSubscriptions        = page.locator('[data-id="Earnings"]');
    this.studioPlaylists            = page.locator('[data-id="Playlists"]');
    this.studioEditChannel          = page.locator('a[href="/channel"]');
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

    // FEEDBACK MODAL
    this.sendFeedbackModal          = page.getByRole("dialog");
  }

  // =========================
  // PLATFORM ACTIONS
  // =========================

  async clickPlatformSubscription() {
    await expect(this.platformSubscription, 'Platform subscription is not visible').toBeVisible();
    await this.platformSubscription.click();
    await expect(this.page, 'Did not navigate to /subscription').toHaveURL(/\/subscription$/);
  }

  async clickPlatformLibrary() {
    await expect(this.platformLibrary, 'Platform library is not visible').toBeVisible();
    await this.platformLibrary.click();
    await expect(this.page, 'Did not navigate to /library').toHaveURL(/\/library$/);
  }

  async clickPlatformHistory() {
    await expect(this.platformHistory, 'Platform history is not visible').toBeVisible();
    await this.platformHistory.click();
    await expect(this.page, 'Did not navigate to /history').toHaveURL(/\/history$/);
  }

  async clickPlatformContinueWatching() {
    await expect(this.platformContinueWatching, 'Platform continue watching is not visible').toBeVisible();
    await this.platformContinueWatching.click();
    await expect(this.page, 'Did not navigate to /continue-watching').toHaveURL(/\/continue-watching$/);
  }

  async clickPlatformMyPlaylists() {
    await expect(this.platformMyPlaylists, 'Platform my playlists is not visible').toBeVisible();
    await this.platformMyPlaylists.click();
    await expect(this.page, 'Did not navigate to /playlist').toHaveURL(/\/playlist$/);
  }

  async clickPlatformWatchLater() {
    await expect(this.platformWatchLater, 'Platform watch later is not visible').toBeVisible();
    await this.platformWatchLater.click();
    await expect(this.page, 'Did not navigate to /watch-later').toHaveURL(/\/watch-later$/);
  }

  async clickPlatformLikedVideos() {
    await expect(this.platformLikedVideos, 'Platform liked videos is not visible').toBeVisible();
    await this.platformLikedVideos.click();
    await expect(this.page, 'Did not navigate to /liked-videos').toHaveURL(/\/liked-videos$/);
  }

  // =========================
  // STUDIO ACTIONS
  // =========================

  async clickStudioDashboard() {
    await ensureOnStudioDomain(this.page);
    await expect(this.studioDashboard, 'Studio dashboard is not visible').toBeVisible();
    await this.studioDashboard.click();
    await expect(this.page, 'Did not navigate to /dashboard').toHaveURL(/\/dashboard$/);
  }

  async clickStudioContent() {
    await ensureOnStudioDomain(this.page);
    await expect(this.studioContent, 'Studio content is not visible').toBeVisible();
    await this.studioContent.click();
    await expect(this.page, 'Did not navigate to /content').toHaveURL(/\/content$/);
  }

  async clickStudioAnalytics() {
    await ensureOnStudioDomain(this.page);
    await expect(this.studioAnalytics, 'Studio analytics is not visible').toBeVisible();
    await this.studioAnalytics.click();
    await expect(this.page, 'Did not navigate to /stats').toHaveURL(/\/stats$/);
  }

  async clickStudioSubscriptions() {
    await ensureOnStudioDomain(this.page);
    await expect(this.studioSubscriptions, 'Studio subscriptions is not visible').toBeVisible();
    await this.studioSubscriptions.click();
    await expect(this.page, 'Did not navigate to /membership').toHaveURL(/\/membership$/);
  }

  async clickStudioPlaylists() {
    await ensureOnStudioDomain(this.page);
    await expect(this.studioPlaylists, 'Studio playlists is not visible').toBeVisible();
    await this.studioPlaylists.click();
    await expect(this.page, 'Did not navigate to /playlists').toHaveURL(/\/playlists$/);
  }

  async clickStudioEditChannel() {
    await ensureOnStudioDomain(this.page);
    await expect(this.studioEditChannel, 'Studio edit channel is not visible').toBeVisible();
    await this.studioEditChannel.click();
    await expect(this.page, 'Did not navigate to /channel').toHaveURL(/\/channel$/);
  }

  async clickStudioSettings() {
    await ensureOnStudioDomain(this.page);
    await expect(this.studioSettings, 'Studio settings is not visible').toBeVisible();
    await this.studioSettings.click();
    await expect(this.page, 'Did not navigate to /settings').toHaveURL(/\/settings$/);
  }

  // =========================
  // SETTINGS ACTIONS
  // =========================

  async clickSettingsAccount() {
    await expect(this.settingsAccount, 'Settings account is not visible').toBeVisible();
    await this.settingsAccount.click();
    await expect(this.page, 'Did not navigate to /account').toHaveURL(/\/account$/);
  }

  async clickSettingsProfile() {
    await expect(this.settingsProfile, 'Settings profile is not visible').toBeVisible();
    await this.settingsProfile.click();
    await expect(this.page, 'Did not navigate to /profile').toHaveURL(/\/profile$/);
  }

  async clickSettingsPaidSubscriptions() {
    await expect(this.settingsPaidSubscriptions, 'Settings paid subscriptions is not visible').toBeVisible();
    await this.settingsPaidSubscriptions.click();
    await expect(this.page, 'Did not navigate to /my-paid-subs').toHaveURL(/\/my-paid-subs$/);
  }

  async clickSettingsNotifications() {
    await expect(this.settingsNotifications, 'Settings notifications is not visible').toBeVisible();
    await this.settingsNotifications.click();
    await expect(this.page, 'Did not navigate to /notifications').toHaveURL(/\/notifications$/);
  }

  async clickSettingsSecurity() {
    await expect(this.settingsSecurity, 'Settings security is not visible').toBeVisible();
    await this.settingsSecurity.click();
    await expect(this.page, 'Did not navigate to /security').toHaveURL(/\/security$/);
  }

  // =========================
  // SUPPORT ACTIONS
  // =========================

  async clickSupportReport() {
    await expect(this.supportReport, 'Support report is not visible').toBeVisible();
    await this.supportReport.click();
    await expect(this.page, 'Did not navigate to /report').toHaveURL(/\/report$/);
  }

  async clickSupportHelp() {
    await expect(this.supportHelp, 'Support help is not visible').toBeVisible();
    await this.supportHelp.click();
    await expect(this.page, 'Did not navigate to /help').toHaveURL(/\/help$/);
  }

  async clickSupportSendFeedback() {
    await expect(this.supportSendFeedback, 'Support send feedback is not visible').toBeVisible();
    await this.supportSendFeedback.click();
    await expect(this.sendFeedbackModal, 'Send feedback modal is not visible').toBeVisible();
  }

}
