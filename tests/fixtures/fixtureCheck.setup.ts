import { test, expect } from '@playwright/test';
import { resolveSharedFixture } from './sharedFixture';

/**
 * Preflight for the shared read-only fixture (`@qavischan`). Runs ONCE as a Playwright
 * setup project that `functional` and the visual projects depend on, so a stale/missing
 * fixture aborts the whole run with a clear "re-seed" message instead of surfacing as
 * confusing 404s / login failures deep inside the dependent tests.
 *
 * `resolveSharedFixture()` logs in as the fixed owner and resolves every content URL by
 * title from the CURRENT stand — so this both validates liveness AND is env-agnostic
 * (no committed per-env data). Re-seed with `npm run seed:fixture` if it fails.
 */
test('shared read-only fixture is seeded and live', async () => {
    const fx = await resolveSharedFixture();
    // resolveSharedFixture already throws (with a re-seed hint) if anything is missing;
    // assert the series is fully present so auto-advance (episode[0]→[1]) is valid.
    expect(fx.episodeUrls.length, 'Series has fewer episodes than expected — re-seed').toBeGreaterThanOrEqual(2);
});
