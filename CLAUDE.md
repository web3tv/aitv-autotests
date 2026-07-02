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

**Run visual tests (desktop 1920×1080):**
```
# Must be run inside Docker
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium
```

**Run visual tests (desktop 2560×1080):**
```
# Must be run inside Docker
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-large-chromium
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
npx playwright test --project=functional --grep @emails # any tag
```

**Run DB tests (`@db`) — needs port-forward first:**
```
kubectl port-forward -n web3tv svc/mariadb 3307:3306    # local 3307 matches DB_PORT
npx playwright test --project=functional --grep @db
```

**Setup production accounts (run once):**
```
ENV_FILE=.env.prod npx playwright test tests/production/setup.spec.ts --project=prodSmoke
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

Three environments, each with its own `.env` file (all gitignored). Default is `.env.web3tv2`.

| Env | File | Host |
|-----|------|------|
| dev1 | `.env.web3tv` | web3tv.dev |
| dev2 (default) | `.env.web3tv2` | web3tv2.dev |
| prod | `.env.prod` | ai.tv |

Switch via `ENV_FILE` (`ENV_FILE=.env.prod npx playwright test ...`) or, in the VS Code Playwright extension, via `playwright.env` in `.vscode/settings.json`. See README for details.

Required variables:
- `BASE_URL` — frontend URL (e.g. `https://web3tv2.dev`)
- `API_URL` — backend API base URL
- `USER_LOGIN_ADMIN` — admin username for admin-token operations
- `USER_PASSWORD` — default password used by `AuthApi.createAndVerifyUser()` (`Admin1@@`)
- `DB_HOST` / `DB_PORT` — DB connection for `@db` tests (`127.0.0.1` / `3307`, via the kubectl port-forward above)
- `EMAIL_DOMAIN` — domain used in generated test emails

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
  skip/         — Parked/disabled specs (excluded via testIgnore `**/skip/**`)
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
  utils/        — Utilities (mail.tm, data generation, video player, incognito)
test-data/
  fixtures/     — Static test assets (video files, photos)
```

### Key design patterns

**Two user creation strategies:**
1. **API-based (preferred for speed):** `AuthApi.createAndVerifyUser()` — registers via the email OTP flow over REST (`/auth/start` → read code from mail.tm → `/auth/verify` → `/auth/complete`). Password is always `Admin1@@` (`process.env.USER_PASSWORD`). (PKCE admin token via `getAdminToken()` is separate — used for admin-only operations, not for this flow.)
2. **UI-based (for registration flow tests):** `RegistrationFlow.registerAndVerifyUserViaEmail()` — registers via browser, then reads verification link from a real mailbox using the `mail.tm` disposable email service.

**Flows wrap Pages:** `AuthFlow`, `RegistrationFlow`, `UploadVideoFlow` compose multiple Page Objects into end-to-end sequences. Use flows for complex, reusable multi-step journeys (login, registration, upload). For everything else, tests instantiate Page Objects directly, and use API helpers (`AuthApi`, `VideoApi`) for fast setup that bypasses the UI. Mixing flows + direct Page Objects in one test is normal.

**Serial describes for stateful tests:** Multi-step feature tests (e.g., upload then verify visibility) use `test.describe.serial` with shared `let` variables to pass state (URLs, usernames) between test steps.

**Email verification via mail.tm:** `MailTmHelper` creates real disposable mailboxes at `api.mail.tm` and polls for verification emails (verification links, password reset links, 2FA codes).

**Playwright projects:**
- `functional` — all non-visual specs, Chromium 1920×1080
- `prodSmoke` — smoke tests for prod (`ENV_FILE=.env.prod`), Chromium 1920×1080
- `visual-desktop-chromium` — desktop visual regression 1920×1080, Docker only
- `visual-desktop-large-chromium` — desktop visual regression 2560×1080, Docker only
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

**Don't hardcode the environment/domain:**
Tests must work across dev1/dev2/prod. Don't hardcode hosts like `web3tv2.dev` — rely on `BASE_URL`/relative paths, and keep helpers domain-agnostic (e.g. email URL extractors in `MailTmHelper` match `https://[^/]+/...`). Email subject matching in `waitForMessage` is case-insensitive.
