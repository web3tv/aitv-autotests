# AI Agent Instructions for web3tv-autotests

## Project Overview
This is a **Playwright-based E2E test automation suite** for web3tv, a web application with authentication, channels, video content, and user profiles. Tests are organized by feature and include functional and visual regression testing.

## Architecture

### Page Object Model (POM)
- **Pages** (`src/pages/`): Encapsulate UI selectors and low-level interactions (buttons, inputs, navigation)
- **Flows** (`src/flows/`): Orchestrate multi-step user journeys by composing pages (e.g., `AuthFlow` uses `LoginPage`, `HeaderPage`, `UserDropdownPage`)
- **Tests** (`tests/`): Use flows to assert business outcomes rather than UI details

**Pattern Example:** `AuthFlow.loginSuccess()` orchestrates login → checks URL → waits for API response → verifies UI elements.

### API Layer
- `AuthApi.ts`: Handles direct API calls for user creation, registration, and auth token management
- Uses Playwright's `APIRequestContext` with base URL `https://api.web3tv.dev`
- Critical for test data setup without UI interaction

### Utilities
- `dataGenerator.ts`: Generates unique emails and usernames using pattern `randomString+randomNumbers@domain`
- `mailTmHelper.ts`, `videoPlayerHelper.ts`: Domain-specific test helpers
- `incognitoHelper.ts`: Private browsing context setup

## Test Structure

### Projects (in `playwright.config.ts`)
1. **`functional`**: Excludes visual tests, runs on standard resolution (1920×1080)
2. **`visual-desktop-chromium`**: Visual regression tests, **runs only in Docker**
3. **`visual-mobile-chromium`**: Mobile visual tests, **runs only in Docker**

### Test Organization
- `tests/auth.spec.ts`: Login/registration/logout flows
- `tests/content.spec.ts`: Channel/video operations
- `tests/validation/`: Specific validation rule testing
- `tests/visualSuite/`: Desktop and mobile visual regressions

## Critical Commands

```bash
# Local functional testing (dev config)
npm run test:dev

# OldStage environment testing
npm run test:oldstage

# Docker: Visual regression tests (required for visual tests)
docker run --rm -v "${PWD}:/app" -w /app mcr.microsoft.com/playwright:v1.57.0-jammy npx playwright test tests/visualSuite

# Run specific test file
npx playwright test tests/auth.spec.ts
```

## Key Patterns & Conventions

### Environment Configuration
- Uses `.env.dev` and `.env.oldstage` (load via dotenv, excluded from git)
- Variables: `BASE_URL`, `USER_LOGIN_PUBLIC`, `USER_PASSWORD`, etc.
- CI mode detected via `process.env.CI` for headless execution

### Selectors
Use semantic selectors (accessibility-first):
```typescript
page.getByRole('button', { name: 'Login' })
page.getByRole('textbox', { name: 'Enter email or username' })
page.getByText(/handle|username/i)  // regex patterns for flexible matching
```

### Wait Strategies
- Always wait for navigation: `page.waitForURL('/')`
- Wait for API responses: `page.waitForResponse('/api/users/whoami', {timeout: 40_000})`
- Explicit waits preferred over implicit timeouts

### Test Reliability
- Screenshots/videos captured on failure only
- HTML reports generated (open automatically in dev, saved in CI)
- Retries: 1 attempt in CI, 0 in local dev
- Default test timeout: 90s, expect timeout: 10s

## Common Tasks

### Adding a New Test
1. Create page locators in `src/pages/` (or reuse existing)
2. Compose flow method in `src/flows/` combining page interactions
3. Use flow in test file with assertions on business outcomes

### Extending Authentication
- Add methods to `AuthFlow` (user logout, password reset, etc.)
- Page methods in `LoginPage` remain low-level (click, fill, navigate)
- Use `AuthApi` for backend setup operations

### Running Specific Tests
```typescript
test.only('Focus on one test')  // temporary during development
test.skip('Skip flaky test')    // document reasons in comments
```

## Docker & CI Context
- Visual tests **must run in Docker** (consistent browser rendering)
- CI uses single worker, 1 retry for stability
- Docker image: `mcr.microsoft.com/playwright:v1.57.0-jammy`
- Reports auto-opened locally, stored as artifacts in CI

## Testing External Integrations
- **MailTm integration**: Temporary email service for registration testing
- **Ethers.js**: Web3 wallet interactions (in dependencies)
- **API-first approach**: Prefer API calls for test setup over UI when possible

## Debugging
- Traces saved on first retry (`trace: 'on-first-retry'`)
- Screenshots on failure only (reduces noise)
- Use `page.pause()` in tests for interactive debugging
- Check `playwright-report/` or `test-results/` after runs
