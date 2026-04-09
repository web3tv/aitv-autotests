# web3.tv Autotests

Playwright-based E2E test suite for [web3.tv](https://web3.tv) platform.

## Prerequisites

- Node.js 18+
- Playwright browsers: `npx playwright install`
- `.env.dev` file (not committed) with required variables:

```env
BASE_URL=https://web3tv.dev
API_URL=https://api.web3tv.dev
STUDIO_URL=https://studio.web3tv.dev
USER_LOGIN_ADMIN=adminuser
USER_PASSWORD=Admin1@@
```

Admin user setup: create user with handle `adminuser` and assign `ROLE_ADMIN`.

## Running Tests

### Critical (smoke) — before each deploy

```bash
npm run test:critical
```

Runs 13 tests tagged `@critical` covering the key user journey:
auth, registration, upload, player, visibility, embed, paid subscription, profile, channel settings.

### Full regression — all functional tests

```bash
npm run test:regression
```

### Single file / single test

```bash
npx playwright test tests/auth/emailAuth.spec.ts --project=functional
npx playwright test --grep "Success login as user" --project=functional
```

### Visual regression (Docker only)

```bash
# Desktop — main domain
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium

# Desktop — studio domain
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-studio-desktop-chromium

# Mobile (iPhone 15)
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
```

### View report

```bash
npx playwright show-report
```

## Test Tags

| Tag | Purpose | Command |
|-----|---------|---------|
| `@critical` | Smoke suite, pre-deploy gate | `npm run test:critical` |
| _(no tag)_ | Full regression | `npm run test:regression` |

Tag is set via Playwright's `tag` property:

```typescript
test('Success login', { tag: '@critical', annotation: { type: 'TC', description: 'AUTH-001' } }, async ({ page }) => {
    // ...
});
```

List critical tests without running:

```bash
npx playwright test --project=functional --grep @critical --list
```

## Project Structure

```
tests/
  auth/         — Authentication (email, wallet, 2FA)
  user/         — Account & profile settings
  subscription/ — Paid subscriptions & auth popup
  hero/         — HERO integration
  studio/       — Upload, player, channel, embed, visibility
  validation/   — Input validation
  visualSuite/  — Visual regression (Docker only)
src/
  flows/        — High-level user journey orchestrators
  pages/        — Page Object Model classes
  api/          — API helpers (bypass UI for test setup)
  utils/        — Utilities (mail.tm, wallet mock, video player)
test-data/
  fixtures/     — Static assets (videos, photos)
```

## Playwright Projects

| Project | Browser | Viewport | Notes |
|---------|---------|----------|-------|
| `functional` | Chromium | 1920x1080 | All non-visual tests |
| `visual-desktop-chromium` | Chromium | 1920x1080 | Docker only |
| `visual-studio-desktop-chromium` | Chromium | 2560x2000 | Docker only, studio domain |
| `visual-mobile-webkit` | WebKit (iPhone 15 Pro Max) | device default | Docker only |

## Test Coverage

See [TEST_COVERAGE.md](TEST_COVERAGE.md) for full test case mapping with statuses: `[AUTO]`, `[CRITICAL]`, `[TODO]`, `[BLOCKED]`, `[MANUAL]`.
