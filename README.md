# web3.tv Autotests

Playwright-based E2E test suite for [web3.tv](https://web3.tv) and [ai.tv](https://ai.tv).

## Prerequisites

- Node.js 20+
- `web3tv/.env.dev` file (not committed) with required variables:

Admin user: создать пользователя с хендлом `adminuser` и ролью `ROLE_ADMIN`.

## Setup

```bash
npm install
npx playwright install
```

## Running Tests

Все команды запускаются из **корня репо**.

### web3tv

```bash
# Critical (smoke) — перед деплоем
npx playwright test --config=web3tv/playwright.config.ts --project=functional --grep @critical

# Full regression — все функциональные тесты
npx playwright test --config=web3tv/playwright.config.ts --project=functional

# Один файл
npx playwright test --config=web3tv/playwright.config.ts web3tv/tests/auth/emailAuth.spec.ts --project=functional

# По названию теста
npx playwright test --config=web3tv/playwright.config.ts --grep "Success login as user" --project=functional
```

### aitv

```bash
npx playwright test --config=aitv/playwright.config.ts --project=functional
```

### Shortcuts (npm scripts)

```bash
npm run test:web3tv    # web3tv functional
npm run test:aitv      # aitv functional
npm run test:critical  # web3tv @critical
npm run test:all       # оба проекта
```

### Switching environments

```bash
# dev2 (web3tv)
ENV_FILE=.env.dev2 npx playwright test --config=web3tv/playwright.config.ts --project=functional

# prod smoke
ENV_FILE=.env.prod npx playwright test --config=web3tv/playwright.config.ts --project=prodSmoke
```

### Visual regression (Docker only)

```bash
# Desktop — main domain
docker run --rm -v "$PWD:/app" -w /app test bash -c "npm ci && npx playwright test --config=web3tv/playwright.config.ts --project=visual-desktop-chromium"

# Desktop — studio domain
docker run --rm -v "$PWD:/app" -w /app test bash -c "npm ci && npx playwright test --config=web3tv/playwright.config.ts --project=visual-studio-desktop-chromium"

# Mobile (iPhone 15)
docker run --rm -v "$PWD:/app" -w /app test bash -c "npm ci && npx playwright test --config=web3tv/playwright.config.ts --project=visual-mobile-webkit"
```

### View report

```bash
npx playwright show-report web3tv/playwright-report
```

## Project Structure

```
web3tv-autotests/
  web3tv/                     — web3tv project
    tests/
      auth/         — Authentication (email, wallet, 2FA)
      user/         — Account & profile settings
      subscription/ — Paid subscriptions & auth popup
      hero/         — HERO integration
      studio/       — Upload, player, channel, embed, visibility
      validation/   — Input validation
      visualSuite/  — Visual regression (Docker only)
    playwright.config.ts
    package.json
    .env.dev / .env.dev2 / .env.prod   (gitignored)

  aitv/                       — aitv project (mirrors web3tv)
    tests/
      ...
    playwright.config.ts
    package.json
    .env.dev / .env.prod               (gitignored)

  src/                        — Shared code
    flows/        — High-level user journey orchestrators
    pages/        — Page Object Model classes
    api/          — API helpers (bypass UI for test setup)
    utils/        — Utilities (mail.tm, wallet mock, video player)

  test-data/
    fixtures/     — Static assets (videos, photos)

  package.json                — Root (npm workspaces)
  package-lock.json
```

## Playwright Projects

| Project | Browser | Viewport | Notes |
|---------|---------|----------|-------|
| `functional` | Chromium | 1920×1080 | All non-visual tests |
| `prodSmoke` | Chromium | 1920×1080 | Production smoke tests |
| `visual-desktop-chromium` | Chromium | 1920×1080 | Docker only |
| `visual-studio-desktop-chromium` | Chromium | 2560×2000 | Docker only, studio domain |
| `visual-mobile-webkit` | WebKit (iPhone 15 Pro Max) | device default | Docker only |

## Test Tags

| Tag | Purpose | Command |
|-----|---------|---------|
| `@critical` | Smoke suite, pre-deploy gate | `npm run test:critical` |
| _(no tag)_ | Full regression | `npm run test:web3tv` |

```typescript
test('Success login', { tag: '@critical', annotation: { type: 'TC', description: 'AUTH-001' } }, async ({ page }) => {
    // ...
});
```

List tests without running:

```bash
npx playwright test --config=web3tv/playwright.config.ts --project=functional --list
npx playwright test --config=web3tv/playwright.config.ts --project=functional --grep @critical --list
```

## Test Coverage

See [TEST_COVERAGE.md](TEST_COVERAGE.md) for full test case mapping with statuses: `[AUTO]`, `[CRITICAL]`, `[TODO]`, `[BLOCKED]`, `[MANUAL]`.
