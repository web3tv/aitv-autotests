import { APIRequestContext } from "@playwright/test";

interface CreatedComment {
    id: string;
    textDisplay: string;
    authorUsername: string;
}

export class CommentsApi {
    constructor(
        private request: APIRequestContext,
        private apiUrl = process.env.API_URL!
    ) {}

    /**
     * Creates a comment on a video; pass `parentId` to post a REPLY. A reply fires a
     * `comment_reply` on-platform notification for the parent-comment author (and the
     * video owner also gets one for every root comment on their video).
     * `channelId` is optional — omitted, the backend attributes the comment to the
     * poster's own default channel (root comments work without it; pass it explicitly
     * when commenting AS a specific channel, e.g. for replies).
     */
    async createComment(
        token: string,
        options: { videoId: string; textOriginal: string; parentId?: string; channelId?: string }
    ): Promise<CreatedComment> {
        const response = await this.request.post(`${this.apiUrl}/comments/`, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            data: options,
        });

        if (!response.ok()) {
            const body = await response.text();
            throw new Error(`Failed to create comment on video ${options.videoId}: ${response.status()} ${body}`);
        }

        return (await response.json()) as CreatedComment;
    }
}
