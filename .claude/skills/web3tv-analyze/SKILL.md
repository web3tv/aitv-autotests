---
name: web3tv-analyze
description: "Analyze a Jira task, explore backend/frontend code, ask clarifying questions, design test cases and automation plan"
version: 1.0.0
---

# web3tv-analyze — Feature Analysis & Test Design Orchestrator

You are orchestrating a **4-phase analysis pipeline** for the **web3tv-autotests** project.
The goal is to deeply understand a feature from Jira, analyze its implementation in backend (Symfony) and frontend (Next.js), design test cases, and produce an automation plan — **without writing any test code**.

**IMPORTANT:** Execute ALL phases (0 through 4) in order. Do NOT skip any phase. Each phase builds on the previous one.

---

## Phase 0 — Branch Setup

**Goal:** Ensure all work happens on a dedicated branch from `main`.

Launch the **branch-setup** agent (`.claude/agents/branch-setup.md`).
Pass the task description (from the user's initial message or Jira title) as context — the agent will generate a branch name from it.

The agent will:
1. Check the current branch
2. If not on `main` — verify no uncommitted changes, switch to `main`, pull latest
3. If on `main` — pull latest
4. Create a new `test/<description>` branch and switch to it

**If the agent reports uncommitted changes** — inform the user and ask how to proceed (commit, stash, or abort).

After the branch is created, confirm the branch name to the user and proceed to Phase 1.

---

## Phase 1 — Jira Analysis (interactive)

**Goal:** Extract feature requirements from Jira and identify existing test coverage.

### Option A — User provides a Jira link or key

Launch the **jira-reader** agent (`.claude/agents/jira-reader.md`).
Pass the Jira issue URL or key. The agent will:
- Fetch the issue via REST API
- Parse summary, description, acceptance criteria, subtasks, labels
- Cross-reference with TEST_COVERAGE.md
- Return structured mapping: [AUTO], [TODO], [BLOCKED], new cases

Present the mapping to the user.

### Option B — User provides a text description

Ask the user (unless already provided):
1. **What feature/page** to test
2. **Key scenarios** — happy path, negative, edge cases
3. **Known blockers** — features that don't work yet

Read `TEST_COVERAGE.md` and cross-reference manually.

### In both cases

Summarize your understanding in 2-3 sentences. Show the TEST_COVERAGE.md mapping.

**DO NOT proceed to Phase 2 until you have a clear understanding of the feature.**

---

## Phase 2 — Backend & Frontend Code Analysis

**Goal:** Understand how the feature is actually implemented to design accurate tests.

### Step 0 — Update repositories

Before analyzing code, **always pull the latest changes** in both repositories:

```bash
git -C /Users/maksimpopov/Desktop/web3tv-api-symfony pull
git -C /Users/maksimpopov/Desktop/web3tv-main_app-nextjs pull
```

Run both commands in parallel. If a pull fails (e.g., repo not cloned), inform the user and suggest cloning first.

### Step 1 — Launch analysis agents

Launch **two agents in parallel** using the Agent tool:

### Agent 2A — Backend Analysis

Launch the **codebase-analyzer** agent (`.claude/agents/codebase-analyzer.md`).
Pass:
- Feature name and description from Phase 1
- Keywords: relevant API endpoints, entity names, controller names
- Scope: "backend"

The agent will analyze Symfony controllers, entities, DTOs, validators, services and return:
- Endpoints (method, route, auth)
- Entity fields and constraints
- Validation rules
- Business logic and error conditions

### Agent 2B — Frontend Analysis

Launch the **codebase-analyzer** agent (`.claude/agents/codebase-analyzer.md`).
Pass:
- Feature name and description from Phase 1
- Keywords: page routes, component names
- Scope: "frontend"

The agent will analyze Next.js pages, components, API calls and return:
- Page routes and UI states
- Form fields and client-side validation
- API calls made by the frontend
- Test-friendly selectors (data-testid, etc.)

**Wait for both agents to complete**, then synthesize findings into a combined report.

---

## Phase 2.5 — Clarifying Questions (interactive)

**Goal:** Ask targeted questions based on Jira requirements AND code analysis to uncover gaps.

Based on Phases 1 and 2, generate **5-8 clarifying questions** grouped by category:

### Question categories:

1. **Requirement gaps** — Jira says X, but code implements Y differently. Which is correct?
2. **Missing edge cases** — Code handles case Z (e.g., rate limit, file size, status transition) that Jira doesn't mention. Should we test it?
3. **Access control** — Who should/shouldn't have access? Code shows roles X, Y — confirm?
4. **UI behavior** — Frontend has states (loading, error, empty) — which are important to test?
5. **Integration points** — Feature triggers side effects (emails, notifications, events) — test them?
6. **Data boundaries** — Validation limits found in code (min/max length, allowed formats) — confirm values?

Format each question with context:
```
**Q1 (Requirement gap):** Jira says video title max is 100 chars, but backend validates at 255 (`src/Entity/Video.php:42`). Which limit should the test verify?
```

**Wait for user answers before proceeding to Phase 3.**

If the user says "skip" or "no questions" — proceed with assumptions from the code.

---

## Phase 3 — Test Case Design

**Goal:** Design detailed test cases informed by Jira, code analysis, and clarifying answers.

Launch the **test-case-designer** agent (`.claude/agents/test-case-designer.md`).
Pass as context:
- Feature description from Phase 1
- Backend/frontend analysis from Phase 2 (endpoints, validation rules, UI states)
- User answers from Phase 2.5
- Existing coverage from TEST_COVERAGE.md

The agent will return detailed test cases grouped by category:
- **Happy path** — main user flows
- **Negative** — invalid input, permission denied, not found
- **Edge cases** — boundary values, concurrent operations, special characters
- **Access control** — role-based checks
- **UI state** — loading, empty, error states
- **Persistence** — data saved correctly after reload

For each test case:
- TC-ID, Title, Type (positive/negative/edge)
- Preconditions
- Steps with expected results
- Assertions (what to check, with expected values from code analysis)
- Priority (P1/P2/P3)

Present the test cases to the user for review.

**Wait for user approval / adjustments before proceeding to Phase 4.**

---

## Phase 4 — Automation Plan

**Goal:** Produce a concrete implementation plan — what to create, modify, and how to structure the tests.

Based on approved test cases from Phase 3 and infrastructure from Phase 2, create an automation plan:

### Plan format:

```
## Automation Plan: [Feature Name]

### New infrastructure needed
- **Page Objects:** new POM classes or new locators/methods in existing ones
  - `src/pages/[area]/[Name]Page.ts` — locators: [...], methods: [...]
- **Flows:** new flow classes or methods
  - `src/flows/[Name]Flow.ts` — methods: [...]
- **API helpers:** new API methods
  - `src/api/[Name]Api.ts` — methods: [...]

### Existing infrastructure to reuse
- Page Objects: [list with specific methods]
- Flows: [list with specific methods]
- API helpers: [list with specific methods]
- Utils: [list]

### Spec file structure
- File: `tests/[area]/[name].spec.ts`
- Test list (in execution order):
  1. **[TC-ID] Title** — uses: [POM.method], [Flow.method], asserts: [what]
  2. **[TC-ID] Title** — ...

### Implementation order
1. First: create/update Page Objects (locators + methods)
2. Then: create/update Flows (if needed)
3. Then: write spec file with all test cases
4. Finally: run and fix

### Risks & blockers
- [blocker 1 — with Jira reference if known]
- [risk 1 — e.g., "no data-testid on submit button, need to add or use alternative selector"]

### Estimated complexity
- Simple (1-3 tests, existing infra) / Medium (4-8 tests, minor new infra) / Complex (8+ tests, significant new infra)
```

Present the plan to the user.

---

## Output Summary

After all 4 phases, present a final summary:

```
## Analysis Complete: [Feature Name]

### Source
- Jira: [link or "text description"]
- Backend: [N controllers, M entities analyzed]
- Frontend: [N pages, M components analyzed]

### Test cases designed: N
- Happy path: X
- Negative: X
- Edge cases: X
- Access control: X
- UI state: X

### Coverage impact
- New [TODO] cases to automate: N
- Existing [AUTO] cases: N
- [BLOCKED] cases: N

### Next step
Run `/web3tv-pipeline` to implement the automation plan.
```

---

## Rules

- This skill is **analysis only** — do NOT write test code
- Always show findings to the user between phases — this is an interactive process
- Questions in Phase 2.5 must reference specific code (file paths, line numbers, actual values)
- Test cases in Phase 3 must use actual validation values from the code, not generic placeholders
- The automation plan in Phase 4 must reference actual existing Page Objects, Flows, and API helpers from the project
- Respond in the same language the user uses (Russian / English)
