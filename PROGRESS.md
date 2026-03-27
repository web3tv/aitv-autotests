# W3-1943: Studio Domain Split — Progress

Branch: `test/W3-1943`

---

## Plan

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Create branch from main | DONE |
| 1 | Jira analysis + clarification | DONE |
| 1.5 | Detailed plan approval | DONE |
| 2 | Feature analysis (POM, flows, tests) | DONE |
| 3 | Run tests, identify failures, fix | DONE |
| 4 | Run visual tests in Docker | DONE |
| 5 | Update TEST_COVERAGE.md (playlists, STUDIO-DOMAIN cases) | BLOCKED — waiting for frontend fixes |
| 6 | Code review (review agent) | BLOCKED — waiting for Phase 5 |
| 7 | Coverage mapping | BLOCKED — waiting for Phase 6 |

---

## What was done

### Phase 0-2: Research
- Branch `test/W3-1943` created
- Jira W3-1943 analyzed: 10 acceptance criteria, sidebar/upload/search/notifications changes
- Full infrastructure analysis: 14 affected spec files, 6 HIGH / 1 MEDIUM / 7 LOW severity

### Phase 3: Fixes applied

**Environment:**
- Added `STUDIO_URL=https://studio.web3tv.dev` to `.env.dev`

**SideBarPage.ts — full rework of studio section:**
- Removed old locators: `studioMemberships` (`[data-id="Memberships"]`), `studioProfileChannel` (`[data-id="Profile & Channel"]`)
- Added new locators: `studioAnalytics`, `studioSubscriptions`, `studioPlaylists`, `studioEditChannel`, `studioSettings`
- All studio methods now call `ensureOnStudioDomain()` before interaction
- Updated URL assertions: `/studio/content` → `/content`, `/studio/profile` → `/channel`, etc.
- New methods: `clickStudioAnalytics()`, `clickStudioSubscriptions()`, `clickStudioPlaylists()`, `clickStudioEditChannel()`, `clickStudioSettings()`

**HeaderPage.ts:**
- `userIcon` locator: added `.first()` — DOM now has two `#profile-button` (desktop + mobile)

**AuthFlow.ts:**
- `logout()`: workaround for redirect through `studio.web3tv.dev/logout?redirect=...` (see bug report)

**UploadVideoFlow.ts:**
- Added `ensureOnStudioDomain()` — upload now lives on studio domain
- `uploadVideo()` and `uploadShort()` navigate to studio before clicking Create button

**StudioMembershipPage.ts:**
- `goto()` uses absolute `STUDIO_URL + /membership` instead of relative `/studio/membership`

**Test files — renamed method calls:**
- `clickStudioProfileChannel()` → `clickStudioEditChannel()` in:
  - `studioTestHelpers.ts`
  - `handleValidation.spec.ts` (8 places)
  - `paidSubscription.spec.ts`
  - `notifications.spec.ts` (2 places)
- `clickStudioMemberships()` → `clickStudioSubscriptions()` in:
  - `paidSubscription.spec.ts`
  - `notifications.spec.ts` (2 places)

### Phase 4: Visual tests

**Desktop main (9 tests):** 9/9 passed
- 3 baselines updated (sidebar logged in, video page anonymous/logged in)

**Desktop studio (2 tests):** 2/2 passed — NEW
- Added `visual-studio-desktop-chromium` project in `playwright.config.ts`
- Created `tests/visualSuite/desktop/studioVisualSuites.spec.ts` (sidebar + header)
- Generated baselines

**Mobile (6 tests):** 6/6 passed — no changes needed

### Bug report
- Created `bug-reports/W3-1943-domain-split/BUG_REPORT.md`
- **BUG: Logout redirects through studio.web3tv.dev** — High severity, blocks ~6 tests
  - Workaround applied in `AuthFlow.logout()` with TODO comment
  - Screenshot: `bug2-logout-studio-redirect.png`

### Test results after fixes
- Before: **24 passed, 55 failed, 2 skipped**
- After: **~74 passed, ~5 failed, 2 skipped**
- Remaining failures: flaky tests (mail.tm timeout, toast timing), not domain-split related

---

## Waiting for frontend fixes

### 1. Duplicate `#profile-button` in DOM
Two `<button id="profile-button">` elements (desktop + mobile header). Workaround: `.first()` in HeaderPage.ts.

### 2. Logout redirect through studio domain
Logout navigates to `studio.web3tv.dev/logout?redirect=...` instead of directly to `/login`. Workaround in AuthFlow.ts.

### 3. Studio button hidden for anonymous + redirect (NEW)
Planned: anonymous users should not see Studio in sidebar, and visiting studio.web3tv.dev should redirect to web3tv.dev. Not yet implemented.

### 4. Sidebar "Subscriptions" → "Memberships" rename
Currently shows "Subscriptions", will be renamed later.

---

## What remains (after frontend fixes)

### 1. Update TEST_COVERAGE.md
- Add STUDIO-DOMAIN test cases as [TODO]
- Describe playlist logic (PLAYLIST-001..005)
- Add anonymous redirect / Studio button hidden cases

### 2. Code review (Phase 6)
Run code-reviewer agent on all modified files.

### 3. Coverage mapping (Phase 7)
Final TEST_COVERAGE.md update via coverage-mapper agent.

### 4. Remove workarounds
After frontend fixes, remove:
- `.first()` from HeaderPage.ts `userIcon`
- Logout workaround from AuthFlow.ts
- Update sidebar locator `Subscriptions` → `Memberships`

### 5. Final full test run
Confirm everything passes cleanly.
