# Skills & Agents

## Skills (slash-commands)

### `/web3tv-pipeline` — Full Test Automation Pipeline
The main orchestrator. Takes a Jira link or text description and runs the full cycle:

```
Phase 0    Branch Setup            — creates test/<name> branch from main
Phase 1    Jira Analysis           — parses Jira task or text description
Phase 2    Code Analysis           — codebase-analyzer (Symfony + Next.js)
Phase 3    Test Design             — clarifying questions + test cases + ASCII diagrams
Phase 4    Autotests Mapping       — test-analyzer + TEST_COVERAGE.md mapping
Phase 5    Approval                — consolidated plan for user approval
Phase 6    MCP Smoke Check         — basic functionality via MCP Playwright (optional)
Phase 7    MCP Edge Cases Check    — edge cases via MCP Playwright (optional)
Phase 8    Code Writing            — POM → Flow → spec + run tests
Phase 9    Code Review             — code-reviewer agent
Phase 10   Coverage Update         — updates TEST_COVERAGE.md
```

Pause points: Phase 3 (clarifying questions), Phase 5 (approval), Phase 6-7 (select checks or skip).

See `.claude/PIPELINE_FLOW.md` for the visual flow diagram.

**Usage:** `/web3tv-pipeline` then provide a Jira link or feature description.

---

### `/jira` — Create Jira Issues
Creates Bug, Task, or Story in Jira Cloud via REST API.

- Translates summary/description to English
- Sets parent from `JIRA_PARENT_KEY`
- Credentials from `~/.claude/.env`

**Usage:** `/jira Bug: login page crashes on empty email` or `/jira` for interactive mode.

---

## Agents (used by pipeline internally)

Agents are sub-processes launched by `/web3tv-pipeline`. They are not invoked directly.

| Agent | File | Phase | Purpose |
|-------|------|-------|---------|
| **branch-setup** | `agents/branch-setup.md` | 0 | Creates `test/<name>` branch from latest main |
| **jira-reader** | `agents/jira-reader.md` | 1 | Fetches Jira issue, parses requirements |
| **codebase-analyzer** | `agents/codebase-analyzer.md` | 2 | Analyzes backend (Symfony) and frontend (Next.js) source code |
| **test-case-designer** | `agents/test-case-designer.md` | 3 | Designs detailed test cases with steps and assertions |
| **test-analyzer** | `agents/test-analyzer.md` | 4 | Analyzes existing POM, flows, API helpers, test coverage |
| **test-runner** | `agents/test-runner.md` | 8 | Runs Playwright tests with kubectl port-forward to MariaDB |
| **code-reviewer** | `agents/code-reviewer.md` | 9 | Reviews written test code for quality and conventions |
| **coverage-mapper** | `agents/coverage-mapper.md` | 10 | Updates TEST_COVERAGE.md after tests are written |
