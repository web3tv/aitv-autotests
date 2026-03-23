import { Page, Frame, Locator, expect } from '@playwright/test';

export class EmbedPlayerPage {
    readonly page: Page;
    readonly frame: Frame;
    readonly videoElement: Locator;
    readonly playButton: Locator;
    readonly progressBar: Locator;

    readonly audioTrackButton: Locator;
    readonly audioTrackMenu: Locator;
    readonly hotspotsContainer: Locator;

    constructor(page: Page, frame: Frame) {
        this.page = page;
        this.frame = frame;
        this.videoElement = frame.locator('video.vjs-tech');
        this.playButton = frame.locator('.vjs-big-play-button');
        this.progressBar = frame.locator('.vjs-progress-holder');
        this.audioTrackButton = frame.locator('div.vjs-audio-button');
        this.audioTrackMenu = frame.locator('div.vjs-audio-button .vjs-menu-content');
        this.hotspotsContainer = frame.locator('#hotspots-container');
    }

    static async open(page: Page, videoId: string, contentType: 'video' | 'short' = 'video'): Promise<EmbedPlayerPage> {
        const baseUrl = process.env.BASE_URL!;
        const embedSrc = `${baseUrl}/embed/${videoId}?autoplay=false&muted=false`;
        const width = contentType === 'short' ? 420 : 560;
        const height = contentType === 'short' ? 745 : 315;

        await page.setContent(`
            <iframe
                src="${embedSrc}"
                title="Web3.TV video player"
                width="${width}"
                height="${height}"
                allow="accelerometer; autoplay; encrypted-media; gyroscope"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
            ></iframe>
        `);

        const frame = page.frame({ url: /\/embed\// });
        if (!frame) {
            throw new Error('Embed iframe frame not found');
        }

        await frame.waitForLoadState('domcontentloaded');

        return new EmbedPlayerPage(page, frame);
    }

    async assertEmbedVideoIsPlaying(): Promise<void> {
        await expect(this.videoElement, 'Embed video element is not visible').toBeVisible({ timeout: 15_000 });

        await expect(this.playButton, 'Embed play button is not visible').toBeVisible({ timeout: 5_000 });
        await expect(this.playButton, 'Embed play button is not enabled').toBeEnabled();
        await this.playButton.click();

        await this.frame.waitForSelector('.vjs-playing', { timeout: 5_000 });

        await this.frame.waitForFunction(
            () => {
                const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
                return video && video.readyState >= 2;
            },
            null,
            { timeout: 5_000 }
        );

        const start = await this.frame.evaluate(() => {
            const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
            return video ? video.currentTime : 0;
        });

        await this.page.waitForTimeout(1500);

        const end = await this.frame.evaluate(() => {
            const video = document.querySelector('video.vjs-tech') as HTMLVideoElement;
            return video ? video.currentTime : 0;
        });

        if (end <= start) {
            throw new Error('Embed video is not playing (currentTime did not advance)');
        }

        const progressStart = parseFloat(await this.progressBar.getAttribute('aria-valuenow') || '0');
        await this.page.waitForTimeout(3000);
        const progressEnd = parseFloat(await this.progressBar.getAttribute('aria-valuenow') || '0');

        if (progressEnd <= progressStart) {
            throw new Error(`Embed progress bar is not moving. Was: ${progressStart}, now: ${progressEnd}`);
        }
    }

    async assertAudioTracksAvailable(): Promise<void> {
        await expect(this.playButton, 'Embed play button is not visible').toBeVisible({ timeout: 5_000 });
        await expect(this.playButton, 'Embed play button is not enabled').toBeEnabled();
        await this.playButton.click();

        await this.frame.waitForSelector('.vjs-playing', { timeout: 10_000 });
        await this.page.waitForTimeout(2000);

        await expect(this.audioTrackButton, 'Audio track button is not visible').toBeVisible({ timeout: 5_000 });
        await expect(this.audioTrackButton, 'Audio track button should not be hidden').not.toHaveClass(/vjs-hidden/);

        const audioButton = this.audioTrackButton.locator('button');
        await expect(audioButton, 'Audio track button is not enabled').toBeEnabled();
        await audioButton.click();

        const originalTrack = this.audioTrackMenu.locator('li.vjs-main-menu-item');
        const alternativeTrack = this.audioTrackMenu.locator('li.vjs-alternative-menu-item');

        await expect(originalTrack, 'Original audio track is not visible').toBeVisible();
        await expect(alternativeTrack, 'Alternative audio track is not visible').toBeVisible();
    }

    async assertNoHotspots(): Promise<void> {
        await expect(this.playButton, 'Embed play button is not visible').toBeVisible({ timeout: 5_000 });
        await expect(this.playButton, 'Embed play button is not enabled').toBeEnabled();
        await this.playButton.click();

        await this.frame.waitForSelector('.vjs-playing', { timeout: 10_000 });
        await this.page.waitForTimeout(2000);

        const hotspotSvg = this.frame.locator('video-js svg');
        await expect(hotspotSvg, 'Hotspot SVG overlay should not exist in embed player').toHaveCount(0);

        const polygon = this.frame.locator('video-js polygon');
        await expect(polygon, 'Hotspot polygon should not exist in embed player').toHaveCount(0);
    }
}
