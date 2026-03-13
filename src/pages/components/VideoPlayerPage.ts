import { Page, Locator, expect } from '@playwright/test';

export class VideoPlayerPage {
  readonly page: Page;
  readonly videoElement: Locator;
  readonly playButton: Locator;
  readonly shortsPlayButton: Locator;
  readonly shortsVideoElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.videoElement = page.locator('video.vjs-tech');
    this.playButton = page.locator('.vjs-big-play-button');
    this.shortsPlayButton = page.locator('.swiper-slide-active .vjs-big-play-button');
    this.shortsVideoElement = page.locator('.swiper-slide-active video.vjs-tech');
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
    await expect(this.shortsPlayButton, 'Shorts play button is not visible').toBeVisible({ timeout: 10_000 });
    await expect(this.shortsPlayButton, 'Shorts play button is not enabled').toBeEnabled();
    await this.shortsPlayButton.click();

    await this.page.waitForSelector('.swiper-slide-active .vjs-playing', { timeout: 5_000 });

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
