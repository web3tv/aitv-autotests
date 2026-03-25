---
name: web3tv-pipeline
description: Full test automation pipeline — clarify → analyze → check existing → write code → review → map coverage
version: 1.0.0
---

# web3tv-pipeline — Full Test Automation Pipeline

You are orchestrating a **6-phase test automation pipeline** for the **web3tv-autotests** project.
Each phase is a distinct step. Complete each phase fully before moving to the next.
Some phases use the **Agent tool** for parallel research — this is explicitly noted.

**IMPORTANT:** You MUST execute ALL phases (0 through 6) in order. Do NOT skip any phase.

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

## Phase 1 — Clarification + Jira Analysis (interactive)

**Goal:** Understand exactly what the user wants to test. Accepts a Jira link OR a text description.

### Option A — User provides a Jira link

Launch the **jira-reader** agent (`.claude/agents/jira-reader.md`).
Pass the Jira issue URL or key. The agent will:
- Fetch the issue via REST API
- Parse summary, description, subtasks, labels
- Cross-reference with TEST_COVERAGE.md
- Return a structured mapping: [AUTO], [TODO], [BLOCKED], new cases

Present the agent's mapping to the user and **ask clarifying questions** based on gaps:
- "Jira mentions X but TEST_COVERAGE.md doesn't have it — should we add a new case?"
- "TEST_COVERAGE.md has Y in this section but Jira doesn't mention it — include or skip?"

### Option B — User provides a text description

Ask the user (unless already provided):
1. **What feature/page** to test (e.g., "channel settings", "video comments")
2. **Key scenarios** — happy path, negative cases, edge cases
3. **Priority** — which cases are most important if time is limited
4. **Known blockers** — any features that don't work yet

Then read `TEST_COVERAGE.md` and cross-reference manually (same mapping format as Option A).

### In both cases

If the user's initial message already contains enough detail, confirm your understanding in 2-3 sentences and show the TEST_COVERAGE.md mapping before proceeding.

**DO NOT proceed to Phase 1.5 until the user confirms or you have enough context.**

---

## Phase 1.5 — Detailed Plan (requires user approval)

**Goal:** Present the user with a clear, detailed plan BEFORE any research or coding begins.

Based on the clarified requirements from Phase 1, write a structured plan:

### Plan format:

```
## Plan: [Feature Name]

### Scope
- What will be automated
- What is out of scope (and why)

### Test cases (preliminary)
1. **[TC-ID] Title** — brief description of what will be tested
2. **[TC-ID] Title** — ...
   (list ALL planned cases with their TEST_COVERAGE.md IDs if known)

### Implementation approach
- Which existing Page Objects / Flows / API helpers will be reused
- What new Page Objects / locators / methods will need to be created
- Which spec file(s) will be created or modified

### Estimated phases
- Phase 2: Research — what needs to be analyzed
- Phase 4: Coding — rough order of implementation
- Phase 5: Review — focus areas

### Risks & open questions
- Potential blockers
- Assumptions that need validation
```

Present this plan to the user and **wait for explicit approval**.
The user may adjust scope, reorder priorities, or remove cases — incorporate their feedback.

**DO NOT proceed to Phase 2 until the user approves the plan.**

---

## Phase 2 — Feature Analysis Agent (research)

**Goal:** Understand the feature's implementation and available test infrastructure.

Launch **two Agent subprocesses in parallel** using the Agent tool:

### Agent 2A — test-analyzer (`.claude/agents/test-analyzer.md`)
Use the `test-analyzer` agent. Pass the feature name from Phase 1 as context.
This agent will analyze Page Objects, Flows, API helpers, utilities, existing tests, and TEST_COVERAGE.md.

### Agent 2B — Existing Test Patterns
Launch a general-purpose Agent with this prompt:
```
"Analyze existing tests in web3tv-autotests related to [FEATURE].
1. Read 2-3 existing spec files in tests/ that cover similar functionality
2. Identify reusable patterns: user creation, login, navigation, assertions
3. Show concrete code examples of how similar tests are structured
Return: reusable patterns with code snippets."
```

**Wait for both agents to complete**, then synthesize their findings into a brief summary for the user.

---

## Phase 3 — Test Case Design

**Goal:** Design the test cases before writing code.

Launch the **test-case-designer** agent (`.claude/agents/test-case-designer.md`).
Pass as context:
- Feature description from Phase 1
- Infrastructure report from Phase 2 (test-analyzer output)
- List of TC-IDs to implement

The agent will return detailed test cases with steps, assertions, reusable infrastructure, and implementation order.

Present the agent's output to the user for approval.

**DO NOT proceed to Phase 4 until the user approves the test plan.**

---

## Phase 4 — Code Writing Agent

**Goal:** Write the test code following all project conventions.

Follow these rules strictly (from CLAUDE.md and MEMORY.md):
- `test.step()` for logical steps — ALWAYS
- `expect().toBeVisible()` + `expect().toBeEnabled()` before every interaction
- All locators in Page Object constructor — NEVER inline
- Each `test()` creates its own user via `AuthApi.createAndVerifyUser()`
- `waitUntil: 'domcontentloaded'` — NEVER `networkidle`
- `waitForResponse` BEFORE the action that triggers it
- TC annotation: `test('TC-ID: Title', ...)`

Steps:
1. Create/update Page Objects if new locators are needed
2. Create/update Flows if new orchestration is needed
3. Write the spec file with all test cases
4. **Run each test** via `mcp__web3tv-playwright__run_test` — this is MANDATORY
5. If a test fails — read the error, fix, re-run. Do not give up.

---

## Phase 5 — Senior Review Agent

**Goal:** Review the written code for quality and correctness.

Launch the **code-reviewer** agent (`.claude/agents/code-reviewer.md`).
Pass the list of all written/modified files as context.

If the review finds issues — fix them and re-run the affected tests.

---

## Phase 6 — Coverage Mapping Agent

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
- [TC-ID]: [title] — ✅ passing / ❌ failing (reason)

### Files modified:
- tests/... (new/updated)
- src/pages/... (new locators)
- src/flows/... (new methods)
- TEST_COVERAGE.md (updated)

### Coverage change:
- [TODO] → [AUTO]: N cases
- New [BLOCKED]: N cases (with Jira links)
```
