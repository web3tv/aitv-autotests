import { Page, expect } from '@playwright/test';

export async function clickPlay(page: Page) {
  const playButton = page.locator('.vjs-big-play-button');
  await expect(playButton).toBeVisible({ timeout: 5000 });
  await playButton.click();
}

export async function waitForVideoJSPlaying(page: Page) {
  await page.waitForSelector('.vjs-playing', {
    timeout: 5000
  });
}

export async function assertVideoCurrentTimeMoves(page: Page, timeoutMs = 3000) {
  const videoLocator = page.locator('video.vjs-tech');
  await videoLocator.waitFor({ state: 'visible', timeout: timeoutMs });

  await page.waitForFunction(
    () => {
      const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
      return video && video.readyState >= 2; 
    },
    null,
    { timeout: timeoutMs }
  );

  const start = await page.evaluate(() => {
    const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
    return video ? video.currentTime : 0;
  });

  await page.waitForTimeout(1500);

  const end = await page.evaluate(() => {
    const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
    return video ? video.currentTime : 0;
  });

  if (end <= start) {
    throw new Error('❌ Видео не проигрывается (currentTime не изменился)!');
  }
}


export async function assertProgressBarMoves(page: Page) {
  const slider = page.locator('.vjs-progress-holder');

  const start = parseFloat(await slider.getAttribute('aria-valuenow') || '0');
  await page.waitForTimeout(5000);
  const end = parseFloat(await slider.getAttribute('aria-valuenow') || '0');

  if (end <= start) {
    throw new Error(
      `❌ Прогресс-бар не движется. Было: ${start}, стало: ${end}`
    );
  }

  // console.log(`Прогресс-бар движется: ${start} → ${end}`);
}


export async function assertVideoIsPlaying(page: Page) {

  await clickPlay(page);

  await waitForVideoJSPlaying(page);

  await assertVideoCurrentTimeMoves(page);

  await assertProgressBarMoves(page);

}

/**
 * Player-agnostic playback check (works for both the standard video.js player and the
 * AiTv player with custom controls): starts the video if paused, then asserts the
 * playhead advances.
 */
export async function assertVideoPlays(page: Page, timeoutMs = 15000) {
  await page.locator('video.vjs-tech').waitFor({ state: 'visible', timeout: timeoutMs });
  await page.evaluate(() => {
    const video = document.querySelector('video.vjs-tech') as HTMLVideoElement | null;
    if (video && video.paused) void video.play?.();
  });
  await assertVideoCurrentTimeMoves(page, timeoutMs);
}

/**
 * Seeks the current video to just before its end and resumes playback, so the player's
 * `ended` event fires. For a series episode this triggers the auto-advance to the next one.
 */
export async function seekToEnd(page: Page, offsetSeconds = 0.2) {
  const videoLocator = page.locator('video.vjs-tech');
  await videoLocator.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForFunction(
    () => {
      const video = document.querySelector('video.vjs-tech') as HTMLVideoElement | null;
      return !!video && Number.isFinite(video.duration) && video.duration > 0;
    },
    null,
    { timeout: 10000 }
  );
  await page.evaluate((offset) => {
    const video = document.querySelector('video.vjs-tech') as HTMLVideoElement | null;
    if (video && Number.isFinite(video.duration)) {
      video.currentTime = Math.max(0, video.duration - offset);
      void video.play?.();
    }
  }, offsetSeconds);
}
