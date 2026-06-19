# AITV Autotests

Playwright-based E2E test suite for the AITV platform.

## Stack

- **[Playwright](https://playwright.dev/)** — browser automation & test runner
- **TypeScript** — test language
- **mysql2** — direct DB access for tests tagged `@db`
- **dotenv** — environment configuration
- **mail.tm** — disposable email for registration flows

## Prerequisites

- Node.js 18+
- Install dependencies: `npm install`
- Install browsers: `npx playwright install`
- `.env.web3tv2` file (not committed) with required variables:

```env
BASE_URL=https://web3tv.dev
API_URL=https://api.web3tv.dev
USER_LOGIN_ADMIN=adminuser
USER_PASSWORD=Admin1@@
```

Admin user: create user with handle `adminuser` and assign `ROLE_ADMIN`.

### Switching environment

По умолчанию тесты загружают `.env.web3tv2`. Создай отдельный файл для каждого окружения, например `.env.prod`.

**Из терминала:**

```bash
ENV_FILE=.env.prod npx playwright test --project=functional
```

**Из IDE (VS Code Playwright extension):**

Расширение не поддерживает передачу переменных окружения через UI. Чтобы переключить env при запуске из IDE — добавь `playwright.env` в `.vscode/settings.json`:

```json
{
  "playwright.env": {
    "ENV_FILE": ".env.prod"
  }
}
```

После изменения перезагрузи список тестов кнопкой ↺ в Test Explorer. Чтобы вернуться на дефолтный env — удали блок `playwright.env` или смени значение на `.env.web3tv2`.

All `.env.*` files are gitignored.

## Running Tests

### Critical (smoke) — before each deploy

```bash
npm run test:critical
```

Runs tests tagged `@critical` covering the key user journey: auth, registration, upload, player, visibility, paid subscription, profile, channel settings.

### Full regression

```bash
npm run test:regression
```

### Single file / single test

```bash
npx playwright test tests/auth/auth.spec.ts --project=functional
npx playwright test --grep "Success login as user" --project=functional
```

### Tests with DB access (`@db` tag)

Tests tagged `@db` connect directly to the database via `mysql2`. Before running, set up port-forward to the DB:

```bash
kubectl port-forward svc/mysql 3306:3306 -n <namespace>
```

Then run:

```bash
npx playwright test --project=functional --grep @db
```

### Visual regression (Docker only)

Visual tests must be run inside Docker to ensure pixel-perfect consistency across machines.

```bash
# Desktop 1920×1080
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium

# Desktop 2560×1080
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-large-chromium

# Mobile (iPhone 15 Pro Max)
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
| `@db` | Requires DB port-forward | `--grep @db` |
| _(no tag)_ | Full regression | `npm run test:regression` |

## Playwright Projects

| Project | Browser | Viewport | Notes |
|---------|---------|----------|-------|
| `functional` | Chromium | 1920×1080 | All functional tests |
| `prodSmoke` | Chromium | 1920×1080 | Production smoke, use `ENV_FILE=.env.prod` |
| `visual-desktop-chromium` | Chromium | 1920×1080 | Docker only |
| `visual-desktop-large-chromium` | Chromium | 2560×1080 | Docker only |
| `visual-mobile-webkit` | WebKit | iPhone 15 Pro Max | Docker only |

## Project Structure

```
tests/
  auth/         — Authentication tests
  user/         — Account & profile settings
  subscription/ — Paid subscriptions
  studio/       — Upload, player, channel, embed, visibility
  validation/   — Input validation
  visualSuite/
    desktop/    — Desktop visual regression specs
    mobile/     — Mobile visual regression specs
src/
  flows/        — High-level user journey orchestrators
  pages/        — Page Object Model classes
  api/          — API helpers (bypass UI for test setup)
  utils/        — Utilities (mail.tm, video player, data generation)
test-data/
  fixtures/     — Static assets (videos, photos)
```

## Test Coverage

See [TEST_COVERAGE.md](TEST_COVERAGE.md) for full test case mapping.
