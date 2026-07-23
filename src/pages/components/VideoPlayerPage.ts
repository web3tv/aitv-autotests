import { Page, Locator, expect } from '@playwright/test';

export class VideoPlayerPage {
  readonly page: Page;
  readonly videoElement: Locator;
  readonly shortsVideoElement: Locator;

  // Player controls. Play/pause and the ±10s skips live in the CENTER overlay
  // (the control bar itself only has volume / time / settings / fullscreen).
  readonly playerCenterPlayBtn: Locator;
  readonly playerCenterReplay10Btn: Locator;
  readonly playerCenterForward10Btn: Locator;
  readonly playerProgress: Locator;
  readonly playerMuteBtn: Locator;
  readonly playerVolume: Locator;
  readonly playerTime: Locator;
  readonly playerSettingsBtn: Locator;
  readonly playerFullscreenBtn: Locator;

  // Series row UNDER the player (renders only for series): "Episode X / Y" selector
  // button that opens the episodes popup, and the "next episode" pill (a link).
  readonly seriesRow: Locator;
  readonly seriesEpisodeSelectorBtn: Locator;
  readonly seriesEpisodesPopup: Locator;
  readonly seriesEpisodesPopupCloseBtn: Locator;
  readonly seriesNextEpisodePill: Locator;
  // Compact-only (mobile viewport) twins: the series row and the under-player action
  // row (like/dislike pill, watch-later, share, report) — neither mounts on desktop.
  readonly mobileSeriesRow: Locator;
  readonly mobileActionRow: Locator;
  // Right-hand rail on the watch page: episode list in series context (`?list=`),
  // algorithmic related videos otherwise — the layouts are mutually exclusive.
  readonly playlistVideosRail: Locator;

  // Desktop-fullscreen action rail (renders ONLY while document.fullscreenElement is
  // set) + the comments side panel and share dialog it opens (both portaled into the
  // fullscreen element).
  readonly fsActionRail: Locator;
  readonly fsLikeBtn: Locator;
  readonly fsDislikeBtn: Locator;
  readonly fsCommentBtn: Locator;
  readonly fsShareBtn: Locator;
  // The like/dislike icons signal the active state only via SVG paint (fill goes
  // 'none' → color), so assertions target the first <path> of each icon.
  readonly fsLikeIconPath: Locator;
  readonly fsDislikeIconPath: Locator;
  readonly commentsPanel: Locator;
  readonly commentsPanelBody: Locator;
  readonly commentsPanelCloseBtn: Locator;
  // Comment composer inside the fullscreen panel. Scoped to the panel because the
  // regular watch-page comments section renders the same testids below the player.
  readonly commentsPanelInput: Locator;
  readonly commentsPanelSubmitBtn: Locator;
  readonly shareDialog: Locator;
  readonly shareCopyBtn: Locator;
  // AuthRequiredPopup has no testid — identified by its fixed title text.
  readonly authRequiredPopupTitle: Locator;

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
  // Short watch page (desktop): details side panel + its dynamic view count / relative date
  // and the up-next rail images (all masked in visual snapshots).
  readonly shortDetails: Locator;
  readonly shortViewsCount: Locator;
  readonly shortViewsCountDate: Locator;
  readonly shortRailImages: Locator;
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
    this.shortDetails = page.locator('[data-id="aitv-short-details"]');            // desktop side panel
    this.shortViewsCount = this.shortDetails.getByText(/views$/);
    this.shortViewsCountDate = this.shortDetails.getByText(/ago$/);
    this.shortRailImages = page.locator('[data-id="aitv-shorts-up-next-rail"] img'); // rail kept visible, imgs masked
    this.commentingAsTrigger = page.locator('[data-id="commenting-as-trigger"]');
    this.shareBtn = page.getByTestId('aitv-share');

    this.playerCenterPlayBtn = page.getByTestId('aitv-player-center-play');
    this.playerCenterReplay10Btn = page.getByTestId('aitv-player-center-replay10');
    this.playerCenterForward10Btn = page.getByTestId('aitv-player-center-forward10');
    this.playerProgress = page.getByTestId('aitv-player-progress');
    this.playerMuteBtn = page.getByTestId('aitv-player-mute');
    this.playerVolume = page.getByTestId('aitv-player-volume');
    // `aitv-player-time` / `aitv-player-fullscreen` are ALSO rendered by the compact-only
    // mobile timeline — on the desktop viewport only the control-bar pair mounts, so the
    // unscoped locators are safe here; scope them before reusing on a mobile viewport.
    this.playerTime = page.getByTestId('aitv-player-time');
    this.playerSettingsBtn = page.getByTestId('aitv-player-settings');
    this.playerFullscreenBtn = page.getByTestId('aitv-player-fullscreen');

    this.seriesRow = page.getByTestId('aitv-series-row');
    this.seriesEpisodeSelectorBtn = page.getByTestId('aitv-series-episode-selector');
    this.seriesEpisodesPopup = page.getByTestId('aitv-series-episodes-popup');
    this.seriesEpisodesPopupCloseBtn = page.getByTestId('aitv-series-episodes-popup-close');
    this.seriesNextEpisodePill = page.getByTestId('aitv-series-next-episode');
    this.mobileSeriesRow = page.getByTestId('aitv-mobile-series-row');
    this.mobileActionRow = page.getByTestId('aitv-mobile-action-row');
    this.playlistVideosRail = page.locator('[data-id="aitv-playlist-videos"]');

    this.fsActionRail = page.getByTestId('aitv-desktop-action-rail');
    this.fsLikeBtn = page.getByTestId('aitv-fs-like');
    this.fsDislikeBtn = page.getByTestId('aitv-fs-dislike');
    this.fsCommentBtn = page.getByTestId('aitv-fs-comment');
    this.fsShareBtn = page.getByTestId('aitv-fs-share');
    this.fsLikeIconPath = this.fsLikeBtn.locator('svg path').first();
    this.fsDislikeIconPath = this.fsDislikeBtn.locator('svg path').first();
    this.commentsPanel = page.getByTestId('aitv-comments-panel');
    this.commentsPanelBody = page.getByTestId('aitv-comments-panel-body');
    this.commentsPanelCloseBtn = page.getByTestId('aitv-comments-panel-close');
    this.commentsPanelInput = this.commentsPanel.getByTestId('aitv-comment-input');
    this.commentsPanelSubmitBtn = this.commentsPanel.getByTestId('aitv-comment-submit');
    this.shareDialog = page.getByTestId('aitv-share-dialog');
    this.shareCopyBtn = page.getByTestId('aitv-share-copy');
    this.authRequiredPopupTitle = page.getByText('Almost there!');

    this.playButton = this.playerCenterPlayBtn;
    this.shortsPlayButton = page.locator('.swiper-slide-active').getByTestId('aitv-player-center-play');
    this.shortsVideoElement = page.locator('.swiper-slide-active video.vjs-tech');
    this.activeShortPlaying = page.locator('.swiper-slide-active video-js.vjs-playing');

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

  /**
   * A single episode cell inside the episodes popup, keyed by 1-based episode number.
   * Parameterized locator, so it lives in the method rather than the constructor.
   */
  episodePopupItem(episodeNumber: number): Locator {
    return this.page.getByTestId(`aitv-episodes-sheet-item-${episodeNumber}`);
  }

  /**
   * Open the episodes popup from the "Episode X / Y" selector in the series row UNDER
   * the player (the old in-player Episodes button was removed by the player redesign).
   */
  async openEpisodesPopup(): Promise<void> {
    await expect(this.seriesEpisodeSelectorBtn, 'Episode selector button is not visible').toBeVisible({ timeout: 15_000 });
    await expect(this.seriesEpisodeSelectorBtn, 'Episode selector button is not enabled').toBeEnabled();
    await this.seriesEpisodeSelectorBtn.click();
    await expect(this.seriesEpisodesPopup, 'Episodes popup did not open').toBeVisible({ timeout: 10_000 });
  }

  /**
   * Click the episode cell for the given 1-based episode number inside the popup.
   * Selecting an episode closes the popup and NAVIGATES to that episode's watch URL
   * (client-side router.push) — callers should wait for the URL change.
   */
  async selectEpisodeFromPopup(episodeNumber: number): Promise<void> {
    const item = this.episodePopupItem(episodeNumber);
    await expect(item, `Episode ${episodeNumber} popup item is not visible`).toBeVisible({ timeout: 10_000 });
    await expect(item, `Episode ${episodeNumber} popup item is not enabled`).toBeEnabled();
    await item.click();
  }

  /**
   * Pause the video and keep it paused (re-pauses on any later `play`). Guards tests
   * that interact with the page from the ~5s fixture videos finishing and auto-advancing
   * to the next episode / a recommended video mid-interaction.
   */
  async holdPaused(): Promise<void> {
    await expect(this.videoElement, 'Video element is not visible').toBeVisible({ timeout: 15_000 });
    await this.page.evaluate(() => {
      const video = document.querySelector('video.vjs-tech') as HTMLVideoElement | null;
      if (!video) return;
      video.pause();
      video.addEventListener('play', () => video.pause());
    });
  }

  /**
   * Wake up the transient player controls by moving the mouse over the player area.
   * Uses `page.mouse.move` (no actionability checks) instead of `Locator.hover()`
   * because the center play/pause overlay intercepts pointer events over the paused
   * player and makes `hover()` retry forever.
   */
  private async wakePlayerControls(): Promise<void> {
    await expect(this.playerContainer, 'Video player container is not visible').toBeVisible({ timeout: 15_000 });
    const box = await this.playerContainer.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
  }

  /**
   * Enter the player's native fullscreen via the control-bar toggle, then wait for
   * `document.fullscreenElement` to be set (the desktop action rail renders only in
   * this state).
   */
  async enterFullscreen(): Promise<void> {
    await this.wakePlayerControls();
    await expect(this.playerFullscreenBtn, 'Fullscreen button is not visible').toBeVisible({ timeout: 10_000 });
    await expect(this.playerFullscreenBtn, 'Fullscreen button is not enabled').toBeEnabled();
    await this.playerFullscreenBtn.click();
    await this.page.waitForFunction(() => !!document.fullscreenElement, undefined, { timeout: 10_000 });
  }

  /**
   * Exit native fullscreen via the same control-bar toggle (its aria-label flips to
   * "exit fullscreen") and wait for `document.fullscreenElement` to clear.
   */
  async exitFullscreen(): Promise<void> {
    await this.wakePlayerControls();
    await expect(this.playerFullscreenBtn, 'Fullscreen (exit) button is not visible').toBeVisible({ timeout: 10_000 });
    await expect(this.playerFullscreenBtn, 'Fullscreen (exit) button is not enabled').toBeEnabled();
    await this.playerFullscreenBtn.click();
    await this.page.waitForFunction(() => !document.fullscreenElement, undefined, { timeout: 10_000 });
  }

  async clickPlay(): Promise<void> {
    await expect(this.playButton, 'Play button is not visible').toBeVisible({ timeout: 5_000 });
    await expect(this.playButton, 'Play button is not enabled').toBeEnabled();
    await this.playButton.click();
  }

  /**
   * Hide the autoplaying short <video-js> for a stable visual snapshot. The video plays,
   * buffers, or (in the Docker Linux browsers) fails the mp4 codec and paints a
   * "No compatible source" error modal — all non-deterministic. `opacity: 0` blanks the whole
   * <video-js> subtree (a child can't override it) while preserving layout; the error/loading
   * modals are also removed globally in case they mount outside it, and the transient player
   * controls are hidden. The overlaid action column + up-next rail sit OUTSIDE <video-js> and
   * stay visible (the rail's thumbnail images are masked at shot time — see shortRailImages).
   */
  async hideShortPlayer(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        video-js { opacity: 0 !important; }
        .vjs-error-display, .vjs-modal-dialog, .vjs-loading-spinner { display: none !important; }
        [data-testid^="aitv-player-"] { visibility: hidden !important; }
      `,
    });
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
