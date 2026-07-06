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

  readonly playerContainer: Locator;
  readonly recommendedVideos: Locator;
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

    const alreadyPlaying = await this.page.locator('.swiper-slide-active .vjs-playing').isVisible();
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

    await this.page.waitForTimeout(1500);

    const end = await this.page.evaluate(() => {
      const activeSlide = document.querySelector('.swiper-slide-active');
      const video = activeSlide?.querySelector('video.vjs-tech') as HTMLVideoElement;
      return video ? video.currentTime : 0;
    });

    if (end <= start) {
      throw new Error('❌ Shorts не проигрывается (currentTime не изменился)!');
    }
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

    await this.page.waitForTimeout(1500);

    const end = await this.page.evaluate(() => {
      const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
      return video ? video.currentTime : 0;
    });

    if (end <= start) {
      throw new Error('❌ Видео не проигрывается (currentTime не изменился)!');
    }

    const progressStart = parseFloat(await this.playerProgress.getAttribute('aria-valuenow') || '0');
    await this.page.waitForTimeout(3000);
    const progressEnd = parseFloat(await this.playerProgress.getAttribute('aria-valuenow') || '0');

    if (progressEnd <= progressStart) {
      throw new Error(`❌ Прогресс-бар не движется. Было: ${progressStart}, стало: ${progressEnd}`);
    }
  }
}
