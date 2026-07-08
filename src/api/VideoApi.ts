import { APIRequestContext } from "@playwright/test";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname, "../../");

interface UploadedVideo {
    id: string;
    title: string;
    channelId: string;
    videoPlayerFeUrl: string;
}

export class VideoApi {
    private defaultCategoryIdCache: number | null = null;

    constructor(
        private request: APIRequestContext,
        private baseUrl = process.env.API_URL!
    ) {}

    async getDefaultCategoryId(): Promise<number> {
        if (this.defaultCategoryIdCache !== null) {
            return this.defaultCategoryIdCache;
        }

        const response = await this.request.get(
            `${this.baseUrl}/videos/categories/`,
            { headers: { Accept: "application/json" } }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to fetch video categories: ${response.status()} ${body}`
            );
        }

        const json = await response.json();
        const items = json?.items ?? json?.data?.items ?? [];
        const picked = items[0];

        if (!picked?.id) {
            throw new Error(
                "No video categories available from /videos/categories/"
            );
        }

        this.defaultCategoryIdCache = picked.id as number;
        return this.defaultCategoryIdCache;
    }

    /** Resolves a video category id by its slug (e.g. "education"). */
    async getCategoryIdBySlug(slug: string): Promise<number> {
        const response = await this.request.get(`${this.baseUrl}/videos/categories/`, {
            headers: { Accept: "application/json" },
        });
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to fetch video categories: ${response.status()} ${body}`);
        }
        const json = await response.json();
        const items = json?.items ?? json?.data?.items ?? [];
        const match = items.find((c: any) => c?.slug === slug);
        if (!match?.id) {
            throw new Error(`Video category with slug "${slug}" not found`);
        }
        return match.id as number;
    }

    async getChannelId(token: string): Promise<string> {
        const response = await this.request.get(`${this.baseUrl}/channels`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            params: { mine: "true", maxResults: "50" },
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to get channels: ${response.status()} ${body}`);
        }

        const json = await response.json();
        const channelId = json?.data?.items?.[0]?.id ?? json?.items?.[0]?.id;

        if (!channelId) {
            throw new Error("No channel found for user");
        }

        return channelId;
    }

    async getChannelInfo(token: string): Promise<{ id: string; name: string; handle: string }> {
        const response = await this.request.get(`${this.baseUrl}/channels`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            params: { mine: "true", maxResults: "50" },
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to get channels: ${response.status()} ${body}`);
        }

        const json = await response.json();
        const channel = json?.data?.items?.[0] ?? json?.items?.[0];

        if (!channel) {
            throw new Error("No channel found for user");
        }

        const handleStr = typeof channel.handle === 'string' ? channel.handle : channel.handle?.name;
        return { id: channel.id, name: channel.name, handle: handleStr };
    }

    /**
     * Creates a SERIES (a playlist with type='series'). Episodes are attached to it
     * later via {@link updateVideo} `seriesId`. Backend dedupes by user+type+title.
     */
    async createSeries(
        token: string,
        options: { title: string; channelId: string; description?: string; privacyStatus?: "public" | "private" | "unlisted" }
    ): Promise<{ id: string; slug: string }> {
        const response = await this.request.post(`${this.baseUrl}/playlists/`, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            data: {
                title: options.title,
                type: "series",
                privacyStatus: options.privacyStatus ?? "public",
                channelId: options.channelId,
                description: options.description ?? "",
            },
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to create series: ${response.status()} ${body}`);
        }

        const json = await response.json();
        const series = json?.data ?? json;
        if (!series?.id || !series?.slug) {
            throw new Error(`Series created but id/slug missing: ${JSON.stringify(series)}`);
        }
        return { id: series.id, slug: series.slug };
    }

    /**
     * Returns the ordered episodes of a series (by playlist position) with ready-to-open
     * public watch URLs. Episodes use the `video` URL segment (backend maps EPISODE → 'video').
     */
    async getSeriesEpisodes(
        token: string,
        seriesSlug: string
    ): Promise<Array<{ id: string; slug: string; title: string; categorySlug: string; watchUrl: string }>> {
        const response = await this.request.get(`${this.baseUrl}/playlists/${seriesSlug}`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to fetch series ${seriesSlug}: ${response.status()} ${body}`);
        }
        const json = await response.json();
        const playlist = json?.data ?? json;
        const videos: any[] = playlist?.videos ?? [];
        // Backend returns videos ordered by playlist position; sort defensively in case
        // a `position` field is present and the transport reorders.
        videos.sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0));
        return videos.map((v) => {
            const categorySlug = v?.category?.slug ?? v?.categories?.[0]?.slug ?? "";
            return {
                id: v.id,
                slug: v.slug,
                title: v.title,
                categorySlug,
                watchUrl: `${process.env.BASE_URL}/video/${categorySlug}/${v.slug}`,
            };
        });
    }

    /**
     * Lists the authenticated owner's studio content of a given type (the same
     * `/videos/studio/` endpoint as {@link waitForProcessing} but WITHOUT an `id`, so it
     * returns all items). Used to resolve the shared visual fixture's watch URLs at
     * runtime by title, so the fixture is env-agnostic (no committed per-env slugs).
     * NB: `type=video` also returns series episodes (item.type === 'episode').
     */
    async listStudioContent(
        token: string,
        type: 'video' | 'short'
    ): Promise<Array<{ title: string; slug: string; type: string; categorySlug: string }>> {
        const response = await this.request.get(`${this.baseUrl}/videos/studio/`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            params: { withFacets: 'true', type },
        });
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to list studio content (type=${type}): ${response.status()} ${body}`);
        }
        const json = await response.json();
        const items: any[] = json?.data?.items ?? json?.items ?? [];
        return items.map((v) => ({
            title: v?.title,
            slug: v?.slug,
            type: v?.type,
            categorySlug: v?.category?.slug ?? v?.categories?.[0]?.slug ?? '',
        }));
    }

    /** Lists the authenticated owner's playlists/series (`GET /playlists/?mine=true`). */
    async listMyPlaylists(
        token: string
    ): Promise<Array<{ id: string; title: string; slug: string; type: string }>> {
        const response = await this.request.get(`${this.baseUrl}/playlists/`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            params: { mine: 'true' },
        });
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to list playlists: ${response.status()} ${body}`);
        }
        const json = await response.json();
        const items: any[] = json?.data?.items ?? json?.items ?? [];
        return items.map((p) => ({ id: p?.id, title: p?.title, slug: p?.slug, type: p?.type }));
    }

    async setDefaultVideoDescription(
        token: string,
        channelId: string,
        handle: string,
        defaultVideoDescription: string
    ): Promise<void> {
        const response = await this.request.put(
            `${this.baseUrl}/channels/${channelId}`,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                data: {
                    name: handle,
                    handle,
                    description: "",
                    descriptionShort: "",
                    privacySettings: "public",
                    isDefault: true,
                    backgroundPictureId: null,
                    defaultVideoDescription: `${defaultVideoDescription}`,
                },
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to set default video description: ${response.status()} ${body}`
            );
        }
    }

    private async initUpload(
        token: string,
        channelId: string,
        filePath: string
    ): Promise<{ id: string; videoPlayerFeUrl: string }> {
        const filePath_ = path.isAbsolute(filePath) ? filePath : path.resolve(PROJECT_ROOT, filePath);
        const stats = fs.statSync(filePath_);
        const filename = path.basename(filePath_);
        const ext = path.extname(filePath_).toLowerCase();
        const mimeType = ext === ".mov" ? "video/quicktime" : "video/mp4";
        const fileBuffer = fs.readFileSync(filePath_);
        const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        const response = await this.request.post(`${this.baseUrl}/videos/`, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            data: {
                channelId,
                filename,
                size: stats.size,
                mimeType,
                checksum,
            },
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to init upload: ${response.status()} ${body}`);
        }

        const json = await response.json();
        return {
            id: json.id,
            videoPlayerFeUrl: json.videoPlayerFeUrl,
        };
    }

    private async uploadChunk(
        token: string,
        videoId: string,
        filePath: string
    ): Promise<void> {
        const filePath_ = path.isAbsolute(filePath) ? filePath : path.resolve(PROJECT_ROOT, filePath);
        const fileBuffer = fs.readFileSync(filePath_);
        const size = fileBuffer.length;

        const md5Hash = crypto
            .createHash("md5")
            .update(fileBuffer)
            .digest("hex");

        const sha256Hash = crypto
            .createHash("sha256")
            .update(fileBuffer)
            .digest("hex");

        const MAX_CHUNK_SIZE = 52428800; // 50MB
        const contentRange = `bytes 0-${size}/${size}/${MAX_CHUNK_SIZE}`;

        const response = await this.request.post(
            `${this.baseUrl}/videos/${videoId}/chunk`,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/octet-stream",
                    "Content-Range": contentRange,
                    "Content-MD5": md5Hash,
                    "Content-Checksum": sha256Hash,
                    Authorization: `Bearer ${token}`,
                },
                data: fileBuffer,
            }
        );

        if (response.status() !== 202 && !response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to upload chunk: ${response.status()} ${body}`);
        }
    }

    private async fetchVideoUrl(
        token: string,
        videoId: string,
        contentType: "video" | "short" = "video"
    ): Promise<string> {
        const response = await this.request.get(`${this.baseUrl}/videos/studio/`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            params: { withFacets: "true", id: videoId, type: contentType },
        });
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to fetch video: ${response.status()} ${body}`);
        }
        const json = await response.json();
        const item = (json?.data?.items ?? json?.items)?.[0];
        const videoType = item?.type;
        const categorySlug = item?.category?.slug ?? item?.categories?.[0]?.slug;
        const videoSlug = item?.slug;
        if (videoType && categorySlug && videoSlug) {
            return `${process.env.BASE_URL}/${videoType}/${categorySlug}/${videoSlug}`;
        }
        throw new Error(
            `Cannot build URL for video ${videoId}: ` +
            `type=${videoType}, categorySlug=${categorySlug}, slug=${videoSlug}`
        );
    }

    private async completeUpload(token: string, videoId: string): Promise<void> {
        const response = await this.request.post(
            `${this.baseUrl}/videos/${videoId}/complete`,
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to complete upload: ${response.status()} ${body}`);
        }
    }

    async updateVideo(
        token: string,
        videoId: string,
        options: {
            title?: string;
            description?: string;
            categoryId?: number;
            privacySetting?: "public" | "private" | "paid" | "unlisted";
            publishedAt?: string;
            coverVerticalImgPath?: string;
            seriesId?: string;
            tags?: string[];
            contentRating?: number;
        }
    ): Promise<void> {
        const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = {};
        if (options.title) multipart.title = options.title;
        if (options.description) multipart.description = options.description;
        if (options.contentRating !== undefined) multipart.contentRating = String(options.contentRating);
        // Genre tags (e.g. "Action", "Adventure") — sent as tags[0], tags[1], ...
        (options.tags ?? []).forEach((tag, i) => {
            multipart[`tags[${i}]`] = tag;
        });
        // Attach this video to a series playlist (turns it into an episode).
        // NOTE: the /videos/{id} form does NOT accept `isSeriesRoot` — sending it
        // fails with "This form should not contain extra fields." Episode order/root
        // is derived by the backend from playlist position, so we only send seriesId.
        if (options.seriesId) {
            multipart.seriesId = options.seriesId;
        }
        const catId = options.categoryId ?? (await this.getDefaultCategoryId());
        multipart["categoryId"] = String(catId);
        if (options.privacySetting) multipart.privacySetting = options.privacySetting;
        if (options.publishedAt) multipart.publishedAt = options.publishedAt;
        if (options.coverVerticalImgPath) {
            const absPath = path.isAbsolute(options.coverVerticalImgPath)
                ? options.coverVerticalImgPath
                : path.resolve(PROJECT_ROOT, options.coverVerticalImgPath);
            const ext = path.extname(absPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
            multipart.coverVerticalImg = {
                name: path.basename(absPath),
                mimeType,
                buffer: fs.readFileSync(absPath),
            };
        }

        const response = await this.request.post(
            `${this.baseUrl}/videos/${videoId}`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                multipart,
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to update video: ${response.status()} ${body}`);
        }
    }

    async bindSubscription(
        token: string,
        videoId: string,
        subId: string,
        meta: { title: string; description: string; categoryId?: number }
    ): Promise<void> {
        const feBaseUrl = process.env.BASE_URL!;
        const tokensData = JSON.stringify({
            token_type: "Bearer",
            expires_in: 3600,
            access_token: token,
            refresh_token: "",
            valid_until: Date.now() + 3600_000,
        });

        const catId = String(meta.categoryId ?? (await this.getDefaultCategoryId()));
        const boundary = "----PlaywrightFormBoundary" + Date.now();
        const fields: Record<string, string> = {
            title: meta.title,
            description: meta.description,
            "categoryId": catId,
            privacySetting: "paid",
            publishedAt: new Date().toISOString(),
        };

        let body = "";
        for (const [name, value] of Object.entries(fields)) {
            body +=
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
        }
        body += `--${boundary}--\r\n`;

        const response = await this.request.post(
            `${feBaseUrl}/api/videos/update/${videoId}?subIds[0]=${encodeURIComponent(subId)}`,
            {
                headers: {
                    Accept: "*/*",
                    "Content-Type": `multipart/form-data; boundary=${boundary}`,
                    Cookie: `tokensData=${encodeURIComponent(tokensData)}`,
                },
                data: body,
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to bind subscription: ${response.status()} ${body}`
            );
        }
    }

    async waitForProcessing(
        token: string,
        videoId: string,
        contentType: "video" | "short" = "video",
        maxAttempts = 24,
        intervalMs = 5_000
    ): Promise<string | undefined> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const response = await this.request.get(
                `${this.baseUrl}/videos/studio/`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        withFacets: "true",
                        id: videoId,
                        type: contentType,
                    },
                }
            );

            if (response.ok()) {
                const json = await response.json();
                const items = json?.data?.items ?? json?.items;
                const state = items?.[0]?.status?.uploadState;
                if (state === "completed") {
                    const item = items[0];
                    const videoType = item?.type;
                    const categorySlug = item?.category?.slug ?? item?.categories?.[0]?.slug;
                    const videoSlug = item?.slug;
                    if (videoType && categorySlug && videoSlug) {
                        return `${process.env.BASE_URL}/${videoType}/${categorySlug}/${videoSlug}`;
                    }
                    throw new Error(
                        `Video ${videoId} completed but URL fields are missing: ` +
                        `type=${videoType}, categorySlug=${categorySlug}, slug=${videoSlug}. ` +
                        `Full item: ${JSON.stringify(item)}`
                    );
                }
                if (state === "failed") {
                    throw new Error(`Video ${videoId} processing failed`);
                }
            }

            await new Promise((r) => setTimeout(r, intervalMs));
        }

        throw new Error(`Video ${videoId} processing timed out after ${maxAttempts} attempts`);
    }

    async deleteVideo(token: string, videoId: string): Promise<void> {
        const response = await this.request.delete(
            `${this.baseUrl}/videos/${videoId}`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to delete video: ${response.status()} ${body}`);
        }
    }

    /**
     * Full upload flow: init → chunk → complete → update metadata (+ optional visibility & processing wait)
     */
    async uploadVideo(
        token: string,
        filePath: string,
        options: {
            title?: string;
            description?: string;
            categoryId?: number;
            privacySetting?: "public" | "private" | "paid" | "unlisted";
            contentType?: "video" | "short";
            subId?: string;
            waitForProcessing?: boolean;
            coverVerticalImgPath?: string;
            publishedAt?: string;
            seriesId?: string;
            tags?: string[];
            contentRating?: number;
        } = {}
    ): Promise<UploadedVideo> {
        const title = options.title ?? `Video_${Date.now()}`;
        const channelInfo = await this.getChannelInfo(token);
        const channelId = channelInfo.id;
        console.log(`[VideoApi] Uploading "${title}" for channel: "${channelInfo.name}" (@${channelInfo.handle})`);

        // 1. Init
        const initResult = await this.initUpload(token, channelId, filePath);
        const id = initResult.id;
        let videoPlayerFeUrl: string;

        // 2. Upload chunk (single chunk for files < 50MB)
        await this.uploadChunk(token, id, filePath);

        // 3. Complete
        await this.completeUpload(token, id);

        // 4. Update metadata + visibility
        const isPaid = options.privacySetting === "paid" && options.subId;
        const publishedAt =
            options.publishedAt ??
            (options.privacySetting !== 'private' && options.privacySetting ? new Date().toISOString() : undefined);
        await this.updateVideo(token, id, {
            title,
            description: options.description ?? `${Date.now()}`,
            categoryId: options.categoryId,
            privacySetting: isPaid ? undefined : options.privacySetting,
            coverVerticalImgPath: options.coverVerticalImgPath,
            publishedAt,
            seriesId: options.seriesId,
            tags: options.tags,
            contentRating: options.contentRating,
        });

        // 4b. Bind subscription for paid videos (via frontend proxy)
        if (isPaid) {
            await this.bindSubscription(token, id, options.subId!, {
                title,
                description: options.description ?? `${Date.now()}`,
                categoryId: options.categoryId,
            });
        }

        // 5. Build video URL; if processing is required — wait for completion first.
        // Episodes (seriesId set) are listed under a different studio type, so the
        // public URL is resolved from the series playlist instead — tolerate failure here.
        try {
            if (options.waitForProcessing) {
                const builtUrl = await this.waitForProcessing(
                    token, id, options.contentType ?? "video"
                );
                if (!builtUrl) {
                    throw new Error(`No player URL available for video ${id} after processing`);
                }
                videoPlayerFeUrl = builtUrl;
            } else {
                videoPlayerFeUrl = await this.fetchVideoUrl(token, id, options.contentType ?? "video");
            }
        } catch (e) {
            // Only tolerate the "can't build episode URL" case; real processing failures must surface.
            if (!options.seriesId) throw e;
            if (e instanceof Error && /processing failed|timed out/i.test(e.message)) throw e;
            videoPlayerFeUrl = "";
        }

        return { id, title, channelId, videoPlayerFeUrl };
    }

    async getVideoViewCount(token: string, videoId: string): Promise<number> {
        const response = await this.request.get(`${this.baseUrl}/videos/studio/`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            params: { id: videoId },
        });
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to get video stats: ${response.status()} ${body}`);
        }
        const json = await response.json();
        const items = json?.data?.items ?? json?.items;
        return Number(items?.[0]?.statistics?.view_count ?? 0);
    }

    async getChannelViewCount(token: string): Promise<number> {
        const response = await this.request.get(`${this.baseUrl}/channels`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            params: { mine: 'true', maxResults: '50' },
        });
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to get channel stats: ${response.status()} ${body}`);
        }
        const json = await response.json();
        const channel = json?.data?.items?.[0] ?? json?.items?.[0];
        return Number(channel?.statistics?.view_count ?? 0);
    }

    async getNotifications(token: string): Promise<any[]> {
        const response = await this.request.get(
            `${this.baseUrl}/user/notifications/on-platform`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to get notifications: ${response.status()} ${body}`
            );
        }

        const json = await response.json();
        return json?.items ?? json?.data?.items ?? [];
    }

    async getVideoById(
        videoId: string,
        token: string
    ): Promise<any> {
        const response = await this.request.get(
            `${this.baseUrl}/videos/`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                params: { id: videoId },
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to get video ${videoId}: ${response.status()} ${body}`
            );
        }

        const json = await response.json();
        return json?.items?.[0];
    }

    async waitForChapters(
        videoId: string,
        token: string,
        maxAttempts = 36,
        intervalMs = 10_000
    ): Promise<Array<{ startTime: number; title: string }>> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const videoItem = await this.getVideoById(videoId, token);
            const chapters = videoItem?.chapters;

            if (Array.isArray(chapters) && chapters.length > 0) {
                return chapters;
            }

            if (attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, intervalMs));
            }
        }

        throw new Error(
            `Chapters for video ${videoId} not generated after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)`
        );
    }

    /** Поллит, пока крон не опубликует запланированное видео (privacySettings → public). */
    async waitForVideoPublished(
        videoId: string,
        token: string,
        maxAttempts = 40,
        intervalMs = 5000
    ): Promise<boolean> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const v = await this.getVideoById(videoId, token);
            if (v?.privacySettings === "public") return true;
            if (attempt < maxAttempts - 1) await new Promise(r => setTimeout(r, intervalMs));
        }
        return false;
    }

    /** Поллит on-platform уведомления в поисках video_release по конкретному videoId. */
    async waitForReleaseNotification(
        token: string,
        videoId: string,
        maxAttempts = 20,
        intervalMs = 3000
    ): Promise<boolean> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const notifs = await this.getNotifications(token);
            if (notifs.some(n => n?.type === "video_release" && n?.payload?.videoId === videoId)) return true;
            if (attempt < maxAttempts - 1) await new Promise(r => setTimeout(r, intervalMs));
        }
        return false;
    }

    /**
     * Список "coming soon" (запланированных) видео с главной AI.TV: GET /videos/coming-soon.
     * Возвращает только id + обложку + per-user флаг подписки (без title/slug — их в ответе нет).
     * Токен опционален: без него `isNotifyOnReleaseSubscribed` всегда false (аноним).
     */
    async getComingSoon(
        token?: string
    ): Promise<Array<{ id: string; coverPicture: Record<string, string> | null; coverVerticalImg: Record<string, string> | null; isNotifyOnReleaseSubscribed: boolean }>> {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await this.request.get(`${this.baseUrl}/videos/coming-soon`, { headers });
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to get coming-soon videos: ${response.status()} ${body}`);
        }
        const json = await response.json();
        return json?.items ?? json?.data?.items ?? [];
    }

    /** Pre-subscribe на релиз "coming soon" видео: POST /videos/{id}/notify-on-release */
    async subscribeToVideoRelease(token: string, videoId: string): Promise<void> {
        const response = await this.request.post(
            `${this.baseUrl}/videos/${videoId}/notify-on-release`,
            { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
        );
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to subscribe to video release: ${response.status()} ${body}`);
        }
    }

    /**
     * Включает уведомления о релизе подписанного видео (on-platform + email).
     * Бэк шлёт email только внутри проверки VIDEO_RELEASE (поле `subscriptions`),
     * а сам email — по `emailSubscriptionActivity`; PUT перезаписывает настройки
     * целиком, поэтому отправляем оба поля. На бэке дефолт обоих может быть false.
     */
    async enableReleaseNotifications(token: string): Promise<void> {
        const response = await this.request.put(
            `${this.baseUrl}/user/notifications/settings/`,
            {
                headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
                data: { subscriptions: true, emailSubscriptionActivity: true },
            }
        );
        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to update notification settings: ${response.status()} ${body}`);
        }
    }
}
