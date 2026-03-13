# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Run all functional tests:**
```
npx playwright test --project=functional
```

**Run a single test file:**
```
npx playwright test tests/auth/auth.spec.ts --project=functional
```

**Run a single test by name:**
```
npx playwright test --grep "Success login as user" --project=functional
```

**Run visual tests (desktop):**
```
# Must be run inside Docker
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-desktop-chromium
```

**Run visual tests (mobile):**
```
# Must be run inside Docker
docker run --rm -v "$PWD:/app" test npx playwright test --project=visual-mobile-webkit
```

**View test report:**
```
npx playwright show-report
```

## Environment Setup

Local config is loaded from `.env.dev` (not committed). Required variables:
- `BASE_URL` — frontend URL (e.g. `https://web3tv.dev`)
- `API_URL` — backend API base URL
- `USER_LOGIN_ADMIN` — admin username for API-based user verification
- `USER_PASSWORD` — default password used by `AuthApi.createAndVerifyUser()` (`Admin1@@`)

## Architecture

### Layer structure

```
tests/
  auth/         — Authentication tests
  user/         — Account settings tests
  subscription/ — Subscription & paid content tests
  hero/         — HERO integration tests
  studio/       — Video upload, player, channel tests
  validation/   — Input validation tests
  visualSuite/  — Visual regression tests (Docker only)
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
1. **API-based (preferred for speed):** `AuthApi.createAndVerifyUser()` — creates user via REST API and grants `ROLE_USER_VERIFIED` using an admin token obtained via PKCE OAuth flow. Password is always `Admin1@@` (`process.env.USER_PASSWORD`).
2. **UI-based (for registration flow tests):** `RegistrationFlow.registerAndVerifyUserViaEmail()` — registers via browser, then reads verification link from a real mailbox using the `mail.tm` disposable email service.

**Flows wrap Pages:** `AuthFlow`, `RegistrationFlow`, `UploadVideoFlow` compose multiple Page Objects into end-to-end sequences. Tests instantiate flows, not page objects directly (except for specific page-level assertions).

**Serial describes for stateful tests:** Multi-step feature tests (e.g., upload then verify visibility) use `test.describe.serial` with shared `let` variables to pass state (URLs, usernames) between test steps.

**Email verification via mail.tm:** `MailTmHelper` creates real disposable mailboxes at `api.mail.tm` and polls for verification emails (verification links, password reset links, 2FA codes).

**Playwright projects:**
- `functional` — all non-visual specs, Chromium 1920×1080
- `visual-desktop-chromium` — desktop visual regression, Docker only
- `visual-mobile-webkit` — mobile visual regression (iPhone 15), Docker only

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
