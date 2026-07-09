import { Page, Locator, expect } from '@playwright/test';

export class VideoPlayerPage {
  readonly page: Page;
  readonly videoElement: Locator;
  readonly shortsVideoElement: Locator;

  // Player controls
  readonly playerCenterPlayBtn: Locator;
  readonly playerPlayBtn: Locator;
  readonly playerProgress: Locator;
  readonly playerMuteBtn: Locator;
  readonly playerVolume: Locator;
  readonly playerReplay10Btn: Locator;
  readonly playerForward10Btn: Locator;
  readonly playerTime: Locator;
  readonly playerNextBtn: Locator;
  readonly playerSettingsBtn: Locator;
  readonly playerFullscreenBtn: Locator;

  // Backwards-compatible aliases
  readonly playButton: Locator;
  readonly shortsPlayButton: Locator;
  readonly activeShortPlaying: Locator;

  readonly playerContainer: Locator;
  readonly recommendedVideos: Locator;
  // The details block below the player (title + views/date + description + genre
  // chips + channel byline + action buttons). Its comments section is a sibling,
  // NOT a child, so this container's height is deterministic — used as the
  // element-scoped target for the video-page visual screenshot.
  readonly videoDescriptionBlock: Locator;
  // Channel identity byline (avatar + random handle + follower count) — masked.
  readonly channelByline: Locator;
  // Category / genre chips under the description — deterministic when the video is
  // seeded with a fixed category + genres.
  readonly categoryChip: Locator;
  readonly tagChips: Locator;
  readonly videoTitle: Locator;
  readonly authorAvatar: Locator;
  readonly channelName: Locator;
  readonly categorySections: Locator;
  readonly shortCards: Locator;
  readonly videoViewsCount: Locator;
  readonly videoViewsCountDate: Locator;
  readonly commentingAsTrigger: Locator;
  readonly shareBtn: Locator;

  // Video description
  readonly showMoreBtn: Locator;
  readonly showLessBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.videoElement = page.locator('video.vjs-tech');

    this.playerContainer = page.locator('[aria-label="Video Player"]');
    this.recommendedVideos = page.locator('[data-id="aitv-related-videos"]');
    this.videoDescriptionBlock = page.locator('[data-id="aitv-video-description"]');
    this.channelByline = page.locator('[data-testid="aitv-channel"]');
    this.categoryChip = page.locator('[data-id="aitv-category-chip"]');
    this.tagChips = page.locator('[data-id="aitv-tag-chip"]');
    this.videoTitle = page.locator('h1');
    this.authorAvatar = page.locator('[data-testid="aitv-channel"] .MuiAvatar-circular');
    this.channelName = page.locator('[data-testid="aitv-channel"] p').first();
    this.categorySections = page.locator('[data-id="aitv-category-section"]');
    this.shortCards = page.locator('[data-id="aitv-short-card"]');
    this.videoViewsCount = page.locator('[data-id="aitv-watch-content"]').getByText(/views$/);
    this.videoViewsCountDate = page.locator('[data-id="aitv-watch-content"]').getByText(/ago$/);
    this.commentingAsTrigger = page.locator('[data-id="commenting-as-trigger"]');
    this.shareBtn = page.getByTestId('aitv-share');

    this.playerCenterPlayBtn = page.getByTestId('aitv-player-center-play');
    this.playerPlayBtn = page.getByTestId('aitv-player-play');
    this.playerProgress = page.getByTestId('aitv-player-progress');
    this.playerMuteBtn = page.getByTestId('aitv-player-mute');
    this.playerVolume = page.getByTestId('aitv-player-volume');
    this.playerReplay10Btn = page.getByTestId('aitv-player-replay10');
    this.playerForward10Btn = page.getByTestId('aitv-player-forward10');
    this.playerTime = page.getByTestId('aitv-player-time');
    this.playerNextBtn = page.getByTestId('aitv-player-next');
    this.playerSettingsBtn = page.getByTestId('aitv-player-settings');
    this.playerFullscreenBtn = page.getByTestId('aitv-player-fullscreen');

    this.playButton = this.playerCenterPlayBtn;
    this.shortsPlayButton = page.locator('.swiper-slide-active').getByTestId('aitv-player-center-play');
    this.shortsVideoElement = page.locator('.swiper-slide-active video.vjs-tech');
    this.activeShortPlaying = page.locator('.swiper-slide-active .vjs-playing');

    this.showMoreBtn = page.locator('[data-id="aitv-description-more"]');
    this.showLessBtn = page.locator('[data-id="aitv-description-more"]');
  }

  async expandDescription(): Promise<void> {
    await expect(this.showMoreBtn, '"Show more" button is not visible').toBeVisible({ timeout: 10_000 });
    await expect(this.showMoreBtn, '"Show more" button is not enabled').toBeEnabled();
    await this.showMoreBtn.click();
  }

  getDescriptionContainer(): Locator {
    return this.showLessBtn.locator('..').locator('> div').first();
  }

  async assertPlayerVisible(): Promise<void> {
    await expect(this.videoElement, 'Video player is not visible').toBeVisible({ timeout: 10_000 });
  }

  async clickPlay(): Promise<void> {
    await expect(this.playButton, 'Play button is not visible').toBeVisible({ timeout: 5_000 });
    await expect(this.playButton, 'Play button is not enabled').toBeEnabled();
    await this.playButton.click();
  }

  async assertShortsIsPlaying(): Promise<void> {
    await expect(this.shortsVideoElement, 'Shorts video element is not visible').toBeVisible({ timeout: 15_000 });

    const alreadyPlaying = await this.activeShortPlaying.isVisible();
    if (!alreadyPlaying) {
      await expect(this.shortsPlayButton, 'Shorts play button is not visible').toBeVisible({ timeout: 10_000 });
      await expect(this.shortsPlayButton, 'Shorts play button is not enabled').toBeEnabled();
      await this.shortsPlayButton.click();
    }

    await this.page.waitForSelector('.swiper-slide-active .vjs-playing', { timeout: 10_000 });

    await this.page.waitForFunction(
      () => {
        const activeSlide = document.querySelector('.swiper-slide-active');
        const video = activeSlide?.querySelector('video.vjs-tech') as HTMLVideoElement;
        return video && video.readyState >= 2;
      },
      null,
      { timeout: 5_000 }
    );

    const start = await this.page.evaluate(() => {
      const activeSlide = document.querySelector('.swiper-slide-active');
      const video = activeSlide?.querySelector('video.vjs-tech') as HTMLVideoElement;
      return video ? video.currentTime : 0;
    });

    // Poll until the playhead advances (instead of a fixed sleep).
    await this.page.waitForFunction(
      (startTime) => {
        const activeSlide = document.querySelector('.swiper-slide-active');
        const video = activeSlide?.querySelector('video.vjs-tech') as HTMLVideoElement;
        return !!video && video.currentTime > startTime;
      },
      start,
      { timeout: 10_000 }
    ).catch(() => {
      throw new Error('❌ Shorts не проигрывается (currentTime не изменился)!');
    });
  }

  async assertVideoIsPlaying(): Promise<void> {
    await this.page.waitForSelector('.vjs-playing', { timeout: 5_000 });

    await this.page.waitForFunction(
      () => {
        const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
        return video && video.readyState >= 2;
      },
      null,
      { timeout: 5_000 }
    );

    const start = await this.page.evaluate(() => {
      const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
      return video ? video.currentTime : 0;
    });

    // Poll until the playhead advances (instead of a fixed sleep).
    await this.page.waitForFunction(
      (startTime) => {
        const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
        return !!video && video.currentTime > startTime;
      },
      start,
      { timeout: 10_000 }
    ).catch(() => {
      throw new Error('❌ Видео не проигрывается (currentTime не изменился)!');
    });

    const progressStart = parseFloat(await this.playerProgress.getAttribute('aria-valuenow') || '0');
    // Poll until the progress bar advances (instead of a fixed sleep).
    await expect
      .poll(async () => parseFloat(await this.playerProgress.getAttribute('aria-valuenow') || '0'), {
        message: `Прогресс-бар не движется (был ${progressStart})`,
        timeout: 10_000,
      })
      .toBeGreaterThan(progressStart);
  }
}
