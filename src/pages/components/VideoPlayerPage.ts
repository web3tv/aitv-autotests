import { Page, Locator, expect } from '@playwright/test';

export class VideoPlayerPage {
  readonly page: Page;
  readonly videoElement: Locator;
  readonly playButton: Locator;
  readonly shortsPlayButton: Locator;
  readonly shortsVideoElement: Locator;

  readonly playerContainer: Locator;
  readonly recommendedVideos: Locator;
  readonly videoTitle: Locator;
  readonly videoSubtitle: Locator;
  readonly authorAvatar: Locator;
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
    this.recommendedVideos = page.locator('[data-id="recommended-videos"]');
    this.videoTitle = page.locator('h1');
    this.videoSubtitle = page.locator('h2');
    this.authorAvatar = page.locator('.MuiAvatar-circular');
    this.videoViewsCount = page.locator('[data-id="video-views-count"]');
    this.videoViewsCountDate = page.locator('[data-id="video-views-count"] + p');
    this.commentingAsTrigger = page.locator('[data-id="commenting-as-trigger"]');
    this.shareBtn = page.getByRole('button', { name: 'Share' });
    this.playButton = page.locator('.vjs-big-play-button');
    this.shortsPlayButton = page.locator('.swiper-slide-active .vjs-big-play-button');
    this.shortsVideoElement = page.locator('.swiper-slide-active video.vjs-tech');

    this.showMoreBtn = page.getByText('Show more', { exact: true });
    this.showLessBtn = page.getByText('Show less', { exact: true });
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
    await this.clickPlay();

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

    const slider = this.page.locator('.vjs-progress-holder');
    const progressStart = parseFloat(await slider.getAttribute('aria-valuenow') || '0');
    await this.page.waitForTimeout(3000);
    const progressEnd = parseFloat(await slider.getAttribute('aria-valuenow') || '0');

    if (progressEnd <= progressStart) {
      throw new Error(`❌ Прогресс-бар не движется. Было: ${progressStart}, стало: ${progressEnd}`);
    }
  }
}
