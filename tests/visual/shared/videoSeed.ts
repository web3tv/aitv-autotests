/**
 * Fixed seed content for the video/channel visual tests. Using CONSTANTS (not
 * `Date.now()`-based values) makes the watch-page title/description/genre chips and
 * the channel grid tiles deterministic, so those regions can be screenshot for real
 * instead of masked. The title is deliberately long (but ≤100 chars — the backend
 * limit) to exercise the two-line wrap/ellipsis; the description is long to exercise
 * the truncation + "more" control.
 */
export const VISUAL_VIDEO_TITLE =
    'Длинное название видеоролика Длинное название видеоролика Длинное название QA Visual';

export const VISUAL_VIDEO_DESCRIPTION =
    'Длинное описание видео для проверки обрезки текста и кнопки «more». '.repeat(8).trim();

export const VISUAL_VIDEO_CATEGORY_SLUG = 'education';

export const VISUAL_VIDEO_GENRES = ['Action', 'Adventure', 'Comedy'];

/** Age rating — renders the "18+" badge next to the title (deterministic). */
export const VISUAL_VIDEO_CONTENT_RATING = 18;
