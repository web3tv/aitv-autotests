/**
 * Fixed seed content for the video/channel visual tests. Using CONSTANTS (not
 * `Date.now()`-based values) makes the watch-page title/description/genre chips and
 * the channel grid tiles deterministic, so those regions can be screenshot for real
 * instead of masked. The title is deliberately long (but ≤100 chars — the backend
 * limit) to exercise the two-line wrap/ellipsis; the description is long to exercise
 * the truncation + "more" control.
 *
 * The public titles (video/series/short) embed the unique `QAVISCHAN` marker so global
 * search (W3-2692) resolves them deterministically — the stand carries historical
 * orphan videos from earlier seed runs that reused the old generic titles, and the
 * `QAVISCHAN` token guarantees a search hit maps to THIS fixture and no other content.
 */
export const FIXTURE_VIDEO_TITLE =
    'Уникальное длинное название видео QAVISCHAN для проверки переноса строки и эллипсиса';

export const FIXTURE_VIDEO_DESCRIPTION =
    'Длинное описание видео для проверки обрезки текста и кнопки «more». '.repeat(8).trim();

export const FIXTURE_VIDEO_CATEGORY_SLUG = 'education';

export const FIXTURE_VIDEO_GENRES = ['Action', 'Adventure', 'Comedy'];

/** Age rating — renders the "18+" badge next to the title (deterministic). */
export const FIXTURE_VIDEO_CONTENT_RATING = 18;

/** Fixed series seeded on the visual channel — populates the channel "Series" tab. */
export const FIXTURE_SERIES_TITLE = 'QAVISCHAN Unique Series';
export const FIXTURE_SERIES_EPISODE_COUNT = 3;

/** Fixed short seeded on the channel — populates the "Shorts" tab (auto-plays in grid). */
export const FIXTURE_SHORT_TITLE = 'QAVISCHAN Unique Short';
/** Non-public videos on the same channel — used to assert they stay HIDDEN publicly. */
export const FIXTURE_PRIVATE_TITLE = 'QA Visual Private';
export const FIXTURE_UNLISTED_TITLE = 'QA Visual Unlisted';

// A video whose description has multiple paragraphs with EMPTY spacer paragraphs, for
// DESC-PARA-001 (the watch page must preserve empty <p></p> separators). Seeded as
// UNLISTED so it is reachable by direct link but does NOT add a tile to the channel
// grid (keeps the channel visual baselines unchanged). The test opens it anonymously.
export const FIXTURE_DESC_TITLE = 'QA Visual Description';
export const FIXTURE_DESC_PARAGRAPHS = [
    'First paragraph of the video description',
    'Second paragraph of the video description',
    'Third paragraph of the video description',
];
/** Quill sends description as HTML with `<p>` tags; empty paragraphs = `<p></p>`. */
export const FIXTURE_DESC_HTML = FIXTURE_DESC_PARAGRAPHS.map((p) => `<p>${p}</p>`).join('<p></p>');
