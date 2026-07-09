# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Run all functional tests:**
```
npx playwright test --project=functional
```

**Run a single test file:**
```
npx playwright test tests/auth/emailAuth.spec.ts --project=functional
```

**Run a single test by name:**
```
npx playwright test --grep "Success login as user" --project=functional
```

**Seed the shared fixture — run LOCALLY once per stand (needs the DB port-forward):**
```
kubectl port-forward -n web3tv svc/mariadb 3307:3306   # DB for content-wipe + subscribers
npm run seed:fixture                                    # ENV_FILE=.env.web3tv npm run seed:fixture for dev1
```
This get-or-creates a FIXED channel (`@qavischan`) and refreshes its content — public/short/private/unlisted videos (+ a multi-paragraph-description one), a series with episodes, and a follower count. It writes
**nothing** to commit: all read-only specs (visual + functional) call
`resolveSharedFixture()` (`tests/fixtures/sharedFixture.ts`), which logs in as the
fixed owner and looks the content up **by title from the current stand at runtime**. So
the fixture is **env-agnostic** (same code works on dev1 and dev2 — the account is
deterministic, only the content slugs differ per stand) and **CI never seeds nor touches
the DB**: it resolves live over the network, and the `fixture-check` setup project
(a dependency of `functional`/visual) fails the run fast with a re-seed hint if the
content is missing. The fixed accounts are created once and reused (never deleted — the
auth service permanently reserves a handle), so re-seed only after a DB drop / content
change. The DB is needed **only when seeding** (locally).

**Run visual tests (desktop 1920×1080):**
```
# Must be run inside Docker; needs the visual fixture seeded first (see above)
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium
```

**Run visual tests (mobile iPhone 15 Pro Max):**
```
# Must be run inside Docker
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
```

**Run tests by tag:**
```
npm run test:critical                                   # @critical smoke (functional --grep @critical)
npm run test:regression                                 # full functional regression
npm run test:nodb                                       # everything except @db (no DB port-forward needed)
npx playwright test --project=functional --grep @emails # any tag
```

**Run DB tests (`@db`) — needs port-forward first:**
```
kubectl port-forward -n web3tv svc/mariadb 3307:3306    # local 3307 matches DB_PORT
npx playwright test --project=functional --grep @db
```

**Run production smoke tests:**
```
ENV_FILE=.env.prod npx playwright test --project=prodSmoke
```

**View test report:**
```
npx playwright show-report
```

## Environment Setup

Three environments, each with its own `.env` file (committed to the repo — they contain no secrets; fill in `EMAIL_ACCOUNT`/`EMAIL_PASSWORD` locally if you need mail/2FA flows). Default is `.env.web3tv2`.

| Env | File | Host |
|-----|------|------|
| dev1 | `.env.web3tv` | web3tv.dev |
| dev2 (default) | `.env.web3tv2` | web3tv2.dev |
| prod | `.env.prod` | ai.tv |

Switch via `ENV_FILE` (`ENV_FILE=.env.prod npx playwright test ...`) or, in the VS Code Playwright extension, via `playwright.env` in `.vscode/settings.json`. See README for details.

The committed `.env.prod` is the ONLY source of prod configuration (CI prod-smoke reads it directly) — change prod config by editing this file; there is no `PROD_ENV_FILE` secret anymore.

Required variables:
- `BASE_URL` — frontend URL (e.g. `https://web3tv2.dev`)
- `API_URL` — backend API base URL
- `USER_LOGIN_ADMIN` — admin username for admin-token operations
- `USER_PASSWORD` — default password used by `AuthApi.createAndVerifyUser()` (`Admin1@@`)
- `DB_HOST` / `DB_PORT` — DB connection for `@db` tests (`127.0.0.1` / `3307`, via the kubectl port-forward above)
- `EMAIL_DOMAIN` — domain for locally-built addresses in fast/static-OTP flows that never read a mailbox (`AuthApi.createUserFast`)
- `EMAIL_ACCOUNT` — the real Gmail inbox used for email reading, e.g. `aitvtests@gmail.com` (all test mail lands here via plus-addressing)
- `EMAIL_PASSWORD` — Gmail **App Password** (16 chars, requires 2FA on the account) used for IMAP access by `GmailHelper`

## Architecture

### Layer structure

Tests are organized **by product domain** (folders), and **cross-cutting slices are
tags, not folders** (e.g. run all input-validation with `--grep @validation`). A
type-specific top-level folder is used only when it maps to a distinct Playwright
project/runtime: `visual/` (Docker projects), `production/` (prod env), `api/`
(no-browser contract tests).

```
tests/
  auth/         — Authentication (login, registration, 2FA, reset, email templates) + registration-page validation
  account/      — Account & profile settings, notifications (profile/notifications are test.fixme WIP)
  content/      — Creator: create & manage video content
    upload/     — Movie/Series/Shorts/Taxonomy upload + upload validation
    manage/     — Visibility, description, analytics, NFT conversion, studio search
    channel/    — Channel create/edit settings + edit-page validation
  player/       — Viewer: video player, embed player, series playback
  api/          — Contract tests hitting endpoints directly (no browser)
  production/   — Production setup + smoke specs (prodSmoke project)
  visual/
    desktop/    — Desktop visual regression specs (Docker only)
    mobile/     — Mobile visual regression specs (Docker only)
    shared/     — Reusable visual test bodies (listingVisualScenarios) — not a spec, imported by entry points
  fixtures/     — SHARED FIXTURES (see "Fixtures" below)
    sharedFixture.ts     — shared read-only channel @qavischan: resolveSharedFixture() + fixed creds
    videoSeed.ts         — seeded-content constants (titles/category/genres) — single source of truth
    fixtureCheck.setup.ts — `fixture-check` setup project: validates the shared fixture is live before a run
  skip/         — Parked/disabled specs (excluded via testIgnore `**/skip/**`); deferred-coverage inventory (fixme/skip/parked) = [BLOCKED] rows in TEST_COVERAGE.md
src/
  flows/        — High-level user journey orchestrators
  pages/        — Page Object Model classes
    auth/       — Login, Register, Forgot/Reset password pages
    account/    — Account, Profile, Security pages
    studio/     — Creator studio pages (Content, Profile, Membership, Channel)
    channel/    — Public channel view
    components/ — Shared components (Header, Sidebar, UserDropdown, UploadVideo)
    heroPay/    — Payment integration page
  api/          — Direct API helpers (bypass UI for setup)
  utils/        — Utilities (Gmail IMAP mail, data generation, player helpers, wallet mock, seed helpers — see the folder for the full set)
scripts/        — one-off tools: seedFixture.ts (seed the shared fixture), deleteUser.ts
test-data/
  fixtures/     — STATIC assets (video files, photos) — NOT to be confused with tests/fixtures/
docs/           — TESTING_STRATEGY.md (strategy), FIXTURES_AUDIT.md (fixtures audit)
```

### Fixtures (don't conflate the two "fixture" meanings)

- **`tests/fixtures/sharedFixture.ts`** — the single **read-only** channel `@qavischan` for visual + view-only functional tests. `resolveSharedFixture()` logs in as the fixed owner and resolves content URLs **by title from the current stand** (env-agnostic, nothing committed): `channelUrl`, `videoUrl`, `shortUrl`, `privateVideoUrl`, `unlistedVideoUrl`, `descriptionVideoUrl`, `seriesId`/`seriesSlug`/`episodeUrls`, owner + non-owner creds. Read-only — never mutate it (see the "Independent user per test" exception).
- **`tests/fixtures/videoSeed.ts`** — seeded-content constants (`FIXTURE_VIDEO_TITLE`, `FIXTURE_SERIES_TITLE`, category, genres, rating…). Single source of truth: `scripts/seedFixture.ts` creates the content by them, `resolveSharedFixture()` and assertions find it by them.
- **`tests/fixtures/fixtureCheck.setup.ts`** — the `fixture-check` setup project (a dependency of `functional`/visual). Calls `resolveSharedFixture()` once; if content is missing it fails the run with a re-seed hint.
- **`test-data/fixtures/`** — NOT Playwright fixtures: **static assets** (video files, photos) uploaded during tests.

### Key design patterns

**Two user creation strategies:**
1. **API-based (preferred for speed):** `AuthApi.createAndVerifyUser()` — registers via the email OTP flow over REST (`/auth/start` → read code from the Gmail inbox via IMAP → `/auth/verify` → `/auth/complete`). Password is always `Admin1@@` (`process.env.USER_PASSWORD`). (PKCE admin token via `getAdminToken()` is separate — used for admin-only operations, not for this flow.)
2. **UI-based (for registration flow tests):** `RegistrationFlow.registerAndVerifyUserViaEmail()` — registers via browser, then reads the verification link from the real Gmail inbox over IMAP.

**Flows wrap Pages:** `AuthFlow`, `RegistrationFlow`, `UploadVideoFlow` compose multiple Page Objects into end-to-end sequences. Use flows for complex, reusable multi-step journeys (login, registration, upload). For everything else, tests instantiate Page Objects directly, and use API helpers (`AuthApi`, `VideoApi`) for fast setup that bypasses the UI. Mixing flows + direct Page Objects in one test is normal.

**Serial describes for stateful tests:** Multi-step feature tests (e.g., upload then verify visibility) use `test.describe.serial` with shared `let` variables to pass state (URLs, usernames) between test steps.

**Email verification via Gmail IMAP:** `GmailHelper` reads a single real Gmail inbox (`EMAIL_ACCOUNT`) over IMAP using a Gmail App Password (`EMAIL_PASSWORD`). Per-test isolation comes from **plus-addressing** — `generateEmail()` returns `<account>+qa_<rnd>@gmail.com`, so every test gets a unique address while all mail lands in one inbox. The "token" threaded through `waitForMessage`/`extract*` is the recipient address itself (it's the filter key in the shared inbox). Searches run against `[Gmail]/All Mail` + `[Gmail]/Spam` (not just INBOX — under bursts Gmail delivers some mail past the inbox). Extracts verification links, password-reset links, verification/2FA codes. `createMailbox()`/`getToken()` are compatibility no-ops. Prereq: 2FA + App Password on the Gmail account.

**Playwright projects:**
- `functional` — all non-visual specs, Chromium 1920×1080
- `prodSmoke` — smoke tests for prod (`ENV_FILE=.env.prod`), Chromium 1920×1080
- `visual-desktop-chromium` — desktop visual regression 1920×1080, Docker only
- `visual-mobile-webkit` — mobile visual regression (iPhone 15 Pro Max), Docker only

**Tags:** set via `{ tag: '@...' }` in `test()`/`test.describe()`, run with `--grep @tag`. Tags carry cross-cutting slices that would otherwise fragment the domain folders. Current tags: `@critical` (pre-deploy smoke), `@db` (needs DB port-forward), `@emails` (email template content), `@validation` (input-validation specs across auth/content).

## Coding Rules

**Check element availability before interacting:**
Before any click, fill, or other action on a page element, always assert it is visible and enabled first. Use `expect` with a descriptive failure message:

```typescript
// WRONG
await loginPage.registerWalletBtn.click();

// CORRECT
await expect(loginPage.registerWalletBtn, 'Register Wallet button is not visible').toBeVisible();
await expect(loginPage.registerWalletBtn, 'Register Wallet button is not enabled').toBeEnabled();
await loginPage.registerWalletBtn.click();
```

Apply this pattern consistently in all Page Object methods and Flow steps. The message should name the element and describe the failure (e.g. `'Submit button is not enabled'`, `'Email input is not visible'`).

**TC annotation convention:**
Each test must have a TC ID in `annotation`, **not** in the test name. One TC ID = one `test()`.

```typescript
// WRONG — ID duplicated in name
test('STUDIO-017: Search filters videos by title', {
    annotation: { type: 'TC', description: 'STUDIO-017' },
}, ...)

// CORRECT — ID only in annotation
test('Search filters videos by title', {
    annotation: { type: 'TC', description: 'STUDIO-017' },
}, ...)
```

**Wrap logical steps in `test.step()`:**
Every test must use `test.step()` for each logical phase (setup, action, assertion).

```typescript
test('My test', async ({ page }) => {
    await test.step('Create user and login', async () => { ... });
    await test.step('Navigate to page', async () => { ... });
    await test.step('Verify result', async () => { ... });
});
```

**Independent user per test:**
Each `test()` creates its own user via `AuthApi.createAndVerifyUser()`. Never share users or state between tests.

**Exception — shared read-only fixture:** a `test()` that only VIEWS content may reuse the shared pre-seeded channel `@qavischan` via `resolveSharedFixture()` (`tests/fixtures/sharedFixture.ts`) instead of seeding its own — it exposes public/short/private/unlisted/description video URLs, a series (`seriesId` + `episodeUrls`), and non-owner viewer creds. Two hard rules: (1) **never mutate the fixture** (no upload/edit/visibility change/follow/password change on `@qavischan` — the `functional` project runs in parallel, so a mutation is a cross-worker race and also breaks the visual baselines); any mutating test MUST seed its own resource (`AuthApi.createAndVerifyUser()` / `setupVideoViaApi()`). (2) The fixture is seeded locally with `npm run seed:fixture` (see Commands) and resolved live per-stand by `resolveSharedFixture()` — nothing is committed, and CI never touches the DB. The `fixture-check` setup project validates liveness over the network and fails the run fast with a re-seed hint if the content is missing (e.g. after a DB drop).

**Re-check the shared fixture against every task's changes (MANDATORY):**
Whenever a task touches anything the shared `@qavischan` fixture relies on, you MUST verify the fixture still holds — do NOT assume it survived a UI/API change. Ask on every task: *could this change break or outdate the fixture?* Triggers to watch: channel / video-page / player DOM (locators, `data-id`s used by `ChannelMainPage`, masks, `resolveSharedFixture`), the studio/playlist listing endpoints (`VideoApi.listStudioContent` / `listMyPlaylists` — the resolver reads them), the seeded-content shape (a new content type/field, renamed titles), or the account/auth/registration flow (fixed-account creation). Action: run `npx playwright test --project=fixture-check`; if it fails or the change alters what tests read/screenshot, update `tests/fixtures/sharedFixture.ts` (resolver), `tests/fixtures/videoSeed.ts` (seed constants) and/or `scripts/seedFixture.ts`, then re-seed (`npm run seed:fixture`) and re-run the affected specs. This is part of the pipeline (Phase 2 — see `.claude/PIPELINE_FLOW.md`), but applies to any change, pipeline or not.

**`waitForResponse` before trigger action:**
Register `page.waitForResponse` **before** the action that triggers the request, otherwise it's a race condition.

```typescript
// WRONG — response may fire before waitForResponse is registered
await sideBar.clickStudioContent();
await page.waitForResponse(r => r.url().includes('/api/videos') && r.status() === 200);

// CORRECT
const responsePromise = page.waitForResponse(
    r => r.url().includes('/api/videos') && r.status() === 200,
    { timeout: 15000 }
);
await sideBar.clickStudioContent();
await responsePromise;
```

**Never use `waitUntil: 'networkidle'` on video pages:**
Video pages continuously send network requests (streaming, player). Use `domcontentloaded` instead:

```typescript
await page.goto(url, { waitUntil: 'domcontentloaded' });
```

**Page Object locators — constructor only:**
All locators must be defined in the constructor. Never create locators inline in methods.

*Exception — parameterized locators:* a locator that depends on a method argument (e.g. ``page.getByTestId(`wallet-selector-${rdns}`)``) cannot live in the constructor and may be built inside the method. Anything static must still go in the constructor.

**Don't hardcode the environment/domain:**
Tests must work across dev1/dev2/prod. Don't hardcode hosts like `web3tv2.dev` — rely on `BASE_URL`/relative paths, and keep helpers domain-agnostic (e.g. email URL extractors in `GmailHelper` match `https://[^/]+/...`). Email subject matching in `waitForMessage` is case-insensitive.
