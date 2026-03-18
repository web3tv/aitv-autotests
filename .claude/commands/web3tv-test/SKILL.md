---
name: web3tv-test
description: Write Playwright tests for the web3tv-autotests project by analyzing existing structure, page objects, selectors, and test examples
version: 1.0.0
---

# web3tv-test Skill

You are an expert QA automation engineer working in the **web3tv-autotests** project located at `/Users/maksimpopov/Desktop/web3tv-autotests`.

When the user invokes this skill (via `/web3tv-test`), follow these steps **in order**:

---

## Step 1 — Understand the user's goal

Ask the user (or use already provided context) to describe:
1. **What feature/page** they want to test
2. **The test steps** (user actions, expected results)
3. **Which spec file** to write to (or create a new one)

If the user has already described the steps in their message, skip asking and proceed directly.

---

## Step 2 — Analyze the project

Use the MCP tools or Read/Glob/Grep to gather context:

1. **Read `CLAUDE.md`** at the project root — understand architecture, coding rules, key patterns.
2. **Read `MEMORY.md`** at `/Users/maksimpopov/.claude/projects/-Users-maksimpopov-Desktop-web3tv-autotests/memory/MEMORY.md` — read all project memories for patterns and conventions.
3. **Find the relevant Page Objects** in `src/pages/` that correspond to the pages involved in the test.
4. **Find the relevant Flows** in `src/flows/` if available.
5. **Read 1-2 existing similar spec files** in `tests/` to understand the test style.
6. **Read the target spec file** if adding to an existing one.

---

## Step 3 — Identify or create selectors

For each UI element the test needs to interact with:

1. **Check the existing Page Object** — does the locator already exist?
2. If not, use `mcp__web3tv-playwright__get_project_context` or navigate the source to find the HTML/component and derive a selector.
3. If a new locator is needed, **add it to the Page Object class** following the existing style:
   ```typescript
   readonly submitBtn = this.page.locator('button[type="submit"]');
   ```
4. Prefer `getByRole`, `getByLabel`, `getByTestId`, then CSS locators — in that order.
5. Always check element availability before interaction (project rule):
   ```typescript
   await expect(page.submitBtn, 'Submit button is not visible').toBeVisible();
   await expect(page.submitBtn, 'Submit button is not enabled').toBeEnabled();
   await page.submitBtn.click();
   ```

---

## Step 4 — Write the test

Follow these project conventions strictly:

### File placement
- Auth tests → `tests/auth/`
- User/account tests → `tests/user.spec.ts`
- Subscription tests → `tests/subscription/`
- Studio/upload tests → `tests/studio/`
- Validation tests → `tests/validation/`

### Test structure
- Multi-step stateful tests → single `test()` with `test.step()` blocks
- Each step that leaves user logged in → add explicit logout at the end
- Steps that need login → must be preceded by logout (unless first step)
- `loginFailed` steps do NOT need preceding logout

### User creation
- **Prefer API-based**: `AuthApi.createAndVerifyUser()` — fast, reliable
- **UI-based only** for registration flow tests: `RegistrationFlow.registerAndVerifyUserViaEmail()`

### Navigation
- Always use `waitUntil: 'domcontentloaded'` for `page.goto()` on video pages
- Never use `waitUntil: 'networkidle'`

### `waitForResponse`
- Always set up `waitForResponse` BEFORE the action that triggers the request

### Imports
- Follow the existing import order in the target spec file
- Import from `src/pages/`, `src/flows/`, `src/api/`, `src/utils/` as needed

### Example test shape:
```typescript
import { test, expect } from '@playwright/test';
import { AuthApi } from '../../src/api/AuthApi';
import { AuthFlow } from '../../src/flows/AuthFlow';
import { SomePage } from '../../src/pages/SomePage';

test('Feature description', async ({ page, request }) => {
  const authApi = new AuthApi(request);
  const authFlow = new AuthFlow(page);
  const somePage = new SomePage(page);

  let username: string;
  let password: string;

  await test.step('Setup — create user', async () => {
    ({ username, password } = await authApi.createAndVerifyUser());
  });

  await test.step('Step description', async () => {
    await authFlow.loginSuccess(username, password);
    // actions...
    await authFlow.logout();
  });

  await test.step('Another step', async () => {
    // ...
  });
});
```

---

## Step 5 — Write files and run the test

1. Write any updated Page Object files.
2. Write the test file using `mcp__web3tv-playwright__write_test` or the Write tool.
3. **Run the test** using `mcp__web3tv-playwright__run_test` to verify it passes.
4. If the test fails, read the error, fix the issue, and re-run. Do not give up after one failure.
5. Report the result to the user.

---

## Key files reference

| Purpose | Path |
|---|---|
| Auth flow | `src/flows/AuthFlow.ts` |
| Registration flow | `src/flows/RegistrationFlow.ts` |
| Upload flow | `src/flows/UploadVideoFlow.ts` |
| Auth API helper | `src/api/AuthApi.ts` |
| Sidebar | `src/pages/components/SideBarPage.ts` |
| Upload page | `src/pages/components/UploadVideoPage.ts` |
| Video player | `src/pages/components/VideoPlayerPage.ts` |
| Header | `src/pages/components/HeaderPage.ts` |
| Login page | `src/pages/auth/LoginPage.ts` |

---

## Rules summary (never break these)

- Always assert `.toBeVisible()` and `.toBeEnabled()` before interacting with elements
- Never use `waitUntil: 'networkidle'`
- Always set up `waitForResponse` before the triggering action
- Use `test.step()` for multi-step tests, not `test.describe.serial`
- Run the test after writing it — do not just list (`--list`)
