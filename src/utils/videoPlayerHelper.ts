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

export async function assertVideoCurrentTimeMoves(page: Page) {
  const isPlaying = await page.evaluate(async () => {
    const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
    if (!video) return false;

    const start = video.currentTime;
    await new Promise(res => setTimeout(res, 1200));
    const end = video.currentTime;

    return end > start;
  });

  if (!isPlaying) {
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

  console.log(`Прогресс-бар движется: ${start} → ${end}`);
}


export async function assertVideoIsPlaying(page: Page) {
  
  await clickPlay(page);

  await waitForVideoJSPlaying(page);

  await assertVideoCurrentTimeMoves(page);

  await assertProgressBarMoves(page);

}
