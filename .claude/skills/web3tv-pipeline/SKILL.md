---
name: web3tv-pipeline
description: Full test automation pipeline — Jira → code analysis → test design → MCP check → write code → review → coverage
version: 3.0.0
---

# web3tv-pipeline — Full Test Automation Pipeline

You are orchestrating an **11-phase test automation pipeline** for the **web3tv-autotests** project.
Each phase is a distinct step. Complete each phase fully before moving to the next.
Some phases use the **Agent tool** for parallel research — this is explicitly noted.

**IMPORTANT:** You MUST execute ALL phases (0 through 10) in order. Phases 6 and 7 are optional — the user may skip them.

See `.claude/PIPELINE_FLOW.md` for the visual flow diagram.

---

## Phase 0 — Branch Setup

**Goal:** Ensure all work happens on a dedicated branch from `main`.

Launch the **branch-setup** agent (`.claude/agents/branch-setup.md`).
Pass the task description (from the user's initial message) as context — the agent will generate a branch name from it.

The agent will:
1. Check the current branch
2. If not on `main` — verify no uncommitted changes, switch to `main`, pull latest
3. If on `main` — pull latest
4. Create a new `test/<description>` branch and switch to it

**If the agent reports uncommitted changes** — inform the user and ask how to proceed (commit, stash, or abort).

After the branch is created, confirm the branch name to the user and proceed to Phase 1.

---

## Phase 1 — Jira Analysis

**Goal:** Understand the task. Accepts a Jira link OR a text description.

### Option A — User provides a Jira link

Launch the **jira-reader** agent (`.claude/agents/jira-reader.md`).
Pass the Jira issue URL or key. The agent will:
- Fetch the issue via REST API
- Parse summary, description, acceptance criteria, subtasks, labels
- Return a structured summary of the requirements

Present the summary to the user. Confirm understanding in 2-3 sentences.

### Option B — User provides a text description

Structure the requirements:
1. **What feature/page** is being tested
2. **Key scenarios** — happy path, negative cases, edge cases
3. **Known blockers** — features that don't work yet

Confirm understanding with the user.

**Note:** Do NOT map to TEST_COVERAGE.md yet — that happens in Phase 4.

---

## Phase 2 — Code Analysis

**Goal:** Understand how the feature is implemented in backend and frontend.

### Step 0 — Pull latest code

```bash
git -C /Users/maksimpopov/Desktop/web3tv-api-symfony pull
git -C /Users/maksimpopov/Desktop/web3tv-main_app-nextjs pull
```
Run both in parallel. If a repo is unavailable, skip and note it.

### Step 1 — Launch codebase-analyzer agent

Launch the **codebase-analyzer** agent (`.claude/agents/codebase-analyzer.md`).
Pass:
- Feature name and description from Phase 1
- Keywords: relevant API endpoints, entity names, page routes, component names
- Scope: "both" (backend + frontend)

The agent will analyze:
- **Backend (Symfony):** controllers, entities, DTOs, validators, services — endpoints, validation rules, business logic, error conditions
- **Frontend (Next.js):** pages, components, API calls — form fields, UI states, test-friendly selectors (data-testid)
- **Cross-reference:** match frontend API calls to backend endpoints, note discrepancies

Present the combined report to the user.

---

## Phase 3 — Test Design (interactive)

**Goal:** Design test coverage based on Jira requirements AND code analysis.

This phase has 3 steps:

### Step 1 — Clarifying Questions

Based on Phases 1 and 2, ask **3-5 targeted questions** to uncover gaps. Tailor questions to the specific feature — do not ask generic questions.

Question categories (pick the most relevant):
1. **Requirement vs code gaps** — Jira says X, but code implements Y differently. Which is correct?
2. **Access control** — Who should/shouldn't have access? What roles are involved?
3. **Error states** — What happens on API error? Is there a retry or error message?
4. **Boundaries** — Max length, file size, count limits? What happens at the boundary?
5. **Edge cases** — Empty states, concurrent operations, special characters?
6. **Destructive actions** — Confirmation dialogs? Undo support?
7. **Integration points** — Side effects (emails, notifications, events)?

Format each question with context:
```
**Q1 (Requirement gap):** Jira says video title max is 100 chars, but backend validates at 255 (`src/Entity/Video.php:42`). Which limit should the test verify?
```

**Wait for user answers.** If the user says "skip" — proceed with assumptions from the code.

### Step 2 — Test Cases

Launch the **test-case-designer** agent (`.claude/agents/test-case-designer.md`).
Pass as context:
- Feature description from Phase 1
- Code analysis from Phase 2 (endpoints, validation rules, UI states, actual values)
- User answers from Step 1

The agent will return detailed test cases with:
- Steps and assertions using **actual validation values** from the code
- Categories: happy path, negative, edge cases, access control, UI state
- Priority (P1/P2/P3)

### Step 3 — ASCII Diagrams (if needed)

If the feature has a complex flow (state machine, multi-step wizard, branching logic), create ASCII diagrams to visualize:
- User journey / state transitions
- Access control matrix
- Data flow between frontend and backend

Skip this step for simple features.

Present all test cases (and diagrams if any) to the user.

---

## Phase 4 — Autotests Mapping

**Goal:** Analyze existing test infrastructure and map to TEST_COVERAGE.md.

Launch the **test-analyzer** agent (`.claude/agents/test-analyzer.md`).
Pass the feature name and test cases from Phase 3 as context.

The agent will analyze:
- Existing Page Objects, Flows, API helpers, utilities
- Existing tests for this feature
- TEST_COVERAGE.md — [AUTO], [TODO], [BLOCKED] mapping

Present the mapping:
- What is already automated
- What needs to be created (new POM, Flow, locators, methods)
- What infrastructure can be reused

Also launch a general-purpose Agent in parallel to find reusable test patterns:
```
"Analyze existing tests in web3tv-autotests related to [FEATURE].
1. Read 2-3 existing spec files in tests/ that cover similar functionality
2. Identify reusable patterns: user creation, login, navigation, assertions
3. Show concrete code examples of how similar tests are structured
Return: reusable patterns with code snippets."
```

---

## Phase 5 — Approval

**Goal:** Get user confirmation before any coding or MCP checks.

Present a consolidated summary:

```
## Plan Summary

### Scope
- What will be automated
- What is out of scope (and why)

### Test cases
1. [TC-ID] Title — type (positive/negative/edge) — priority
2. ...

### Infrastructure
- Reuse: [existing POM, Flow, API helpers]
- Create: [new POM, locators, methods]
- Spec file: tests/[area]/[name].spec.ts

### MCP checks (Phase 6-7)
- Smoke: [list of basic checks to run via MCP]
- Edge cases: [list of edge case checks]

### Risks & blockers
- [list]
```

**Wait for explicit user approval before proceeding.**

---

## Phase 6 — MCP Smoke Check (optional)

**Goal:** Verify basic functionality works before writing tests.

### Step 1 — Propose checks

Based on happy-path test cases from Phase 3, propose a list of basic UI checks:
```
1. Login as user → navigate to [page] → verify [element] is visible
2. Click [button] → verify [result]
3. ...
```

Ask the user which checks to run, or if they want to skip this phase entirely.

### Step 2 — Execute checks

For each selected check, use MCP Playwright tools to:
- Navigate to the page
- Interact with elements
- Verify expected state
- Report result (pass/fail with details)

### Step 3 — Report

If a check fails:
- Report the failure with details (what was expected vs actual)
- Ask if the user wants to create a Jira issue for the bug
- Decide together whether to proceed with automation or wait for a fix

---

## Phase 7 — MCP Edge Cases Check (optional)

**Goal:** Verify edge cases and negative scenarios before writing tests.

Same flow as Phase 6, but for edge case / negative test cases from Phase 3:
- Invalid inputs, boundary values
- Access control (wrong role, anonymous user)
- Error states, empty states

### Step 1 — Propose checks
List edge case checks based on Phase 3 test cases. Ask user which to run or skip.

### Step 2 — Execute checks
Run selected checks via MCP Playwright.

### Step 3 — Report
Report results. Flag bugs. Adjust test cases if behavior differs from expectations.

---

## Phase 8 — Code Writing

**Goal:** Write the test code following all project conventions.

Follow these rules strictly (from CLAUDE.md and MEMORY.md):
- `test.step()` for logical steps — ALWAYS
- `expect().toBeVisible()` + `expect().toBeEnabled()` before every interaction
- All locators in Page Object constructor — NEVER inline
- Each `test()` creates its own user via `AuthApi.createAndVerifyUser()`
- `waitUntil: 'domcontentloaded'` — NEVER `networkidle`
- `waitForResponse` BEFORE the action that triggers it
- TC annotation convention — TC ID only in annotation, NOT in test name:
  ```typescript
  test('Search filters videos by title', {
      annotation: { type: 'TC', description: 'STUDIO-017' },
  }, async ({ page, request }) => { ... });
  ```

Steps:
1. Create/update Page Objects if new locators are needed
2. Create/update Flows if new orchestration is needed
3. Write the spec file with all test cases
4. **Run each test** via the test-runner agent — this is MANDATORY
5. If a test fails — read the error, fix, re-run. Do not give up.

---

## Phase 9 — Code Review

**Goal:** Review the written code for quality and correctness.

Launch the **code-reviewer** agent (`.claude/agents/code-reviewer.md`).
Pass the list of all written/modified files as context.

If the review finds issues — fix them and re-run the affected tests.

---

## Phase 10 — Coverage Update

**Goal:** Update TEST_COVERAGE.md to reflect the new automation.

Launch the **coverage-mapper** agent (`.claude/agents/coverage-mapper.md`).
Pass as context:
- List of implemented TC-IDs with their spec file paths
- Any blocked cases with Jira ticket references

The agent will update TEST_COVERAGE.md and return a diff summary.
Show the diff to the user.

---

## Summary format

After all phases complete, present a final summary:

```
## Pipeline Complete

### Tests written:
- [TC-ID]: [title] — passing / failing (reason)

### Files modified:
- tests/... (new/updated)
- src/pages/... (new locators)
- src/flows/... (new methods)
- TEST_COVERAGE.md (updated)

### MCP check results:
- Smoke: X/Y passed
- Edge cases: X/Y passed
- Bugs found: [list with Jira links if created]

### Coverage change:
- [TODO] → [AUTO]: N cases
- New [BLOCKED]: N cases (with Jira links)
```
