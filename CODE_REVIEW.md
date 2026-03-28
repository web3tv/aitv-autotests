# Code Review: W3-1943 Domain Split

Branch: `test/W3-1943`
Date: 2026-03-27

---

## In-scope issues (introduced in this branch)

### CRITICAL

**1. `tests/visualSuite/desktop/studioVisualSuites.spec.ts:13` — `networkidle` in `loginOnMainDomain()`**
- Per CLAUDE.md and MEMORY.md, `networkidle` must never be used.
- Fix: Replace with `domcontentloaded` or remove — `waitForResponse` on line 18 already guarantees auth.

**2. `src/pages/components/SideBarPage.ts:125-130` + `src/flows/UploadVideoFlow.ts:21-26` — duplicated `ensureOnStudioDomain()`**
- Same logic copy-pasted in two files with hardcoded fallback `'https://studio.web3tv.dev'`.
- Fix: Extract to shared utility in `src/utils/`.

**3. `src/flows/UploadVideoFlow.ts:24` — navigates to `${studioUrl}/studio` instead of `${studioUrl}/dashboard`**
- `/studio` may not be a valid route on the studio domain. `SideBarPage` correctly uses `/dashboard`.
- Fix: Align to `/dashboard`.

**4. `tests/visualSuite/desktop/studioVisualSuites.spec.ts` — no `test.step()` wrapping**
- Per CLAUDE.md, every logical step must be wrapped in `test.step()`.
- Fix: Wrap login, navigate, screenshot phases.

---

## Pre-existing issues (not introduced in this branch)

### CRITICAL

**5. `src/flows/AuthFlow.ts:106` — `waitUntil: 'networkidle'` in `prepareResetPasswordForm()`**

**6. `src/flows/AuthFlow.ts:209` — `page.waitForLoadState('networkidle')` in `walletRegisterSuccess()`**

**7. `src/pages/channel/ChannelMainPage.ts:131` — `page.reload({ waitUntil: 'networkidle' })` in `purhcaseMembershipFromMembershipPageTestNet()`**

**8. `src/pages/components/SideBarPage.ts:241-245` — inline locator in `clickMenuItem()` method body**
- CLAUDE.md: all locators must be in constructor. `clickMenuItem()` creates locator inline.

**9. `src/pages/studio/StudioMembershipPage.ts:62` — inline locator `page.getByRole('button', { name: 'Create' })` in `addMembershipPlan()`**

**10. `src/pages/studio/StudioMembershipPage.ts:49-64` — multiple interactions without `toBeVisible()` + `toBeEnabled()` assertions**
- Affected: `createPlanButton.click()`, `membershipNameInput.fill()`, `nextButton.click()`, `priceInput.click()`, `priceOption.click()`, `durationDropdown.click()`, `durationOption.click()`, `closeButton.click()`

**11. `src/pages/components/HeaderPage.ts:35-43` — `clickAddVideoBtn()`, `clickNewVideoBtn()`, `clickNewShortBtn()` click without `toBeVisible()` + `toBeEnabled()`**

**12. `src/pages/components/HeaderPage.ts:61` — `clickUserIcon()` checks `toBeEnabled()` but not `toBeVisible()`**

**13. `src/pages/components/UserDropdownPage.ts:21` — `clickAddChannelBtn()` checks `toBeEnabled()` but not `toBeVisible()`**

**14. `src/pages/components/UserDropdownPage.ts:27` — `clickLogoutBtn()` checks `toBeEnabled()` but not `toBeVisible()`**

### MEDIUM

**15. `tests/studio/videoVisibility.spec.ts` — duplicate TC IDs**
- VIS-001 assigned to 2 tests, VIS-003 to 2 tests, VIS-005 to 2 tests, VIS-007 to 2 tests.
- Per MEMORY.md (feedback_tc_one_per_test.md): one TC ID = one test.

**16. `tests/studio/videoVisibility.spec.ts` — shared state via `beforeAll`**
- Per MEMORY.md (feedback_independent_users.md): each test() should create its own user.
- Pre-existing architecture trade-off (API setup cost).

**17. `tests/validation/handleValidation.spec.ts:10,128` — TC annotations on `describe` level, not `test` level**
- All 8 tests inside each describe carry same 3 TC IDs — traceability broken.

**18. `tests/visualSuite/desktop/studioVisualSuites.spec.ts` — relies on cross-subdomain session cookie sharing**
- Login on main domain, then navigate to studio domain. If cookies are scoped to `web3tv.dev` only, studio won't see the session.
- Fix: Add comment documenting this assumption.

### LOW

**19. `src/pages/components/SideBarPage.ts:70` — Russian comment `// FEEDBACK MODAL (примерный локатор)`**

**20. `src/flows/UploadVideoFlow.ts:151-153` — empty `chooseMembership()` stub**

**21. `playwright.config.ts:47` — comment says `pw-tests` instead of `test` (Docker image name)**

**22. `.env.dev` — contains credentials in plaintext (DB_PASSWORD, TRON_SENDER_PRIVATE_KEY)**
- Verify `.gitignore` covers `.env.dev`.

---

## Summary

| Category | In-scope | Pre-existing | Total |
|----------|----------|--------------|-------|
| Critical | 4 | 10 | 14 |
| Medium | 0 | 4 | 4 |
| Low | 0 | 4 | 4 |
| **Total** | **4** | **18** | **22** |
