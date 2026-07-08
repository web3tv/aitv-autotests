# Pipeline Flow — `/web3tv-pipeline` v3.0

```
Phase 0    Branch Setup              — creates test/<name> branch from main
     │
Phase 1    Jira Analysis             — jira-reader agent parses task
     │
Phase 2    Code Analysis             — checkout task branch + codebase-analyzer (Symfony + Next.js)
     │                                 + shared-fixture impact check: run fixture-check; if the task
     │                                   touches channel/player DOM, listing endpoints, seeded content
     │                                   or auth — update the fixture + re-seed (see CLAUDE.md)
Phase 3    Test Design               — clarifying questions + test cases + ASCII diagrams
     │
     ⏸ answers to clarifying questions
     │
Phase 4    Autotests Mapping         — test-analyzer + TEST_COVERAGE.md mapping
     │
Phase 5    Approval                  — full plan review
     │
     ⏸ user approval
     │
Phase 6    MCP Smoke Check           — basic functionality via MCP Playwright (optional)
     │
Phase 7    MCP Edge Cases Check      — edge cases via MCP Playwright (optional)
     │
Phase 8    Code Writing              — POM → Flow → spec + run tests
     │
Phase 9    Code Review               — code-reviewer agent
     │
Phase 10   Coverage Update           — update TEST_COVERAGE.md
     │
     ✅ Summary
```

## Pause Points

| Phase | What is asked |
|-------|---------------|
| 3     | Clarifying questions about the feature (3-5 questions based on Jira + code) |
| 5     | Full plan approval: scope, test cases, infrastructure, MCP checks |
| 6-7   | Agent proposes checks, user selects which to run or skips |

## Agents Used

| Phase | Agent | Purpose |
|-------|-------|---------|
| 0     | branch-setup | Create branch |
| 1     | jira-reader | Parse Jira issue |
| 2     | codebase-analyzer | Analyze backend + frontend code |
| 3     | test-case-designer | Design test cases |
| 4     | test-analyzer | Analyze existing test infrastructure |
| 6-7   | MCP Playwright | Execute UI checks |
| 8     | test-runner | Run Playwright tests |
| 9     | code-reviewer | Review written code |
| 10    | coverage-mapper | Update TEST_COVERAGE.md |
