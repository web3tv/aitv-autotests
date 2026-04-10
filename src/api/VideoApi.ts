import { APIRequestContext } from "@playwright/test";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

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
        const chainAbstraction = items.find(
            (c: { slug?: string }) => c?.slug === "chain-abstraction"
        );
        const picked = chainAbstraction ?? items[0];

        if (!picked?.id) {
            throw new Error(
                "No video categories available from /videos/categories/"
            );
        }

        this.defaultCategoryIdCache = picked.id as number;
        return this.defaultCategoryIdCache;
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

    async setChannelPublic(
        token: string,
        channelId: string,
        handle: string
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
                    name: `${handle} Channel`,
                    handle,
                    description: "",
                    descriptionShort: "",
                    privacySettings: "public",
                    isDefault: true,
                    backgroundPictureId: null,
                },
            }
        );

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(
                `Failed to set channel public: ${response.status()} ${body}`
            );
        }
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
                    name: `${handle} Channel`,
                    handle,
                    description: "",
                    descriptionShort: "",
                    privacySettings: "public",
                    isDefault: true,
                    backgroundPictureId: null,
                    defaultVideoDescription,
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
        const stats = fs.statSync(filePath);
        const filename = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = ext === ".mov" ? "video/quicktime" : "video/mp4";
        const fileBuffer = fs.readFileSync(filePath);
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
        const fileBuffer = fs.readFileSync(filePath);
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
        }
    ): Promise<void> {
        const multipart: Record<string, string> = {};
        if (options.title) multipart.title = options.title;
        if (options.description) multipart.description = options.description;
        const catId = options.categoryId ?? (await this.getDefaultCategoryId());
        multipart["categoryIds[0]"] = String(catId);
        if (options.privacySetting) multipart.privacySetting = options.privacySetting;

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
            "categoryIds[0]": catId,
            privacySetting: "paid",
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
                    const categorySlug = item?.categories?.[0]?.slug;
                    const videoSlug = item?.slug;
                    if (videoType && categorySlug && videoSlug) {
                        return `${process.env.BASE_URL}/${videoType}/${categorySlug}/${videoSlug}`;
                    }
                    return undefined;
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
        } = {}
    ): Promise<UploadedVideo> {
        const title = options.title ?? `Video_${Date.now()}`;
        const channelId = await this.getChannelId(token);

        // 1. Init
        const initResult = await this.initUpload(token, channelId, filePath);
        const id = initResult.id;
        let videoPlayerFeUrl = initResult.videoPlayerFeUrl;

        // 2. Upload chunk (single chunk for files < 50MB)
        await this.uploadChunk(token, id, filePath);

        // 3. Complete
        await this.completeUpload(token, id);

        // 4. Update metadata + visibility
        const isPaid = options.privacySetting === "paid" && options.subId;
        await this.updateVideo(token, id, {
            title,
            description: options.description ?? `${Date.now()}`,
            categoryId: options.categoryId,
            privacySetting: isPaid ? undefined : options.privacySetting,
        });

        // 4b. Bind subscription for paid videos (via frontend proxy)
        if (isPaid) {
            await this.bindSubscription(token, id, options.subId!, {
                title,
                description: options.description ?? `${Date.now()}`,
                categoryId: options.categoryId,
            });
        }

        // 5. Wait for processing (optional) — builds correct video URL from response
        if (options.waitForProcessing) {
            const builtUrl = await this.waitForProcessing(
                token, id, options.contentType ?? "video"
            );
            if (builtUrl) videoPlayerFeUrl = builtUrl;
        }

        return { id, title, channelId, videoPlayerFeUrl };
    }
}
