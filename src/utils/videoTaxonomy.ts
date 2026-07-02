/**
 * Reference taxonomy for the video upload modal (W3-2729).
 *
 * These are the category and genre labels the stepped content-upload modal
 * (W3-2702) is expected to display, exactly as the user sees them in the UI.
 *
 * Categories are filtered by content type through the backend `types` field on
 * `GET /videos/categories/`:
 *   - "video"   → shown for a Movie / single video upload
 *   - "episode" → shown when creating a Series
 *   - "short"   → the locked "Shorts" category (see SHORTS-001)
 *   - (none)    → e.g. "Live / Events" — never shown in the upload modal
 *
 * Genres come from `GET /videos/genres` and are the same for every content type.
 *
 * Keep this list in sync with W3-2729. When the taxonomy changes on purpose,
 * update these constants deliberately — the UI tests are meant to fail loudly
 * so a real product change is never rendered silently.
 */

/** Categories offered for a Movie / single-video upload (backend `types` includes "video"). */
export const EXPECTED_VIDEO_CATEGORIES = [
    'Animation',
    'Behind the AI',
    'Comedy',
    'Documentary',
    'Education',
    'Kids & Family',
    'Movie',
    'Music',
    'News & Commentary',
    'Podcast',
    'Short Film',
    'Trailer & Concept',
] as const;

/** Categories offered when creating a Series (backend `types` includes "episode"). */
export const EXPECTED_EPISODE_CATEGORIES = [
    'Animation',
    'Behind the AI',
    'Comedy',
    'Education',
    'Kids & Family',
    'Podcast',
    'Docuseries',
    'Miniseries',
    'Series',
    'Vertical Show',
] as const;

/** Genres offered for every content type (`GET /videos/genres`). */
export const EXPECTED_GENRES = [
    'Action', 'Adventure', 'Alien / UFO', 'Animation', 'Biographical',
    'Business', 'Celebrity / Pop Culture', 'Comedy', 'Courtroom / Legal', 'Crime',
    'Crypto / Web3', 'Cyberpunk', 'Disaster', 'Drama', 'Dystopian',
    'Educational', 'Experimental', 'Family', 'Fantasy', 'Film Noir',
    'Food', 'Gangster / Mafia', 'Heist', 'Historical', 'Horror',
    'Kids', 'Lifestyle', 'Martial Arts', 'Medical', 'Monster / Creature',
    'Music', 'Musical', 'Mystery', 'Nature / Animals', 'Political',
    'Post-Apocalyptic', 'Prison', 'Psychological', 'Reality', 'Romance',
    'Satire', 'Sci-Fi', 'Sitcom', 'Space', 'Sports',
    'Spy / Espionage', 'Superhero', 'Supernatural', 'Survival', 'Suspense',
    'Tech / AI', 'Teen / YA', 'Thriller', 'Travel', 'True Crime',
    'Vampire / Werewolf', 'War / Military', 'Western', 'Zombie',
] as const;
