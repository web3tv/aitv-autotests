# Pipeline Flow — `/pipeline` v5.0

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
Phase 8    Visual Verification       — MCP screenshots of affected UI/emails vs design (always);
     │                                 saved to docs/<task>-screenshots/ + SETUP.md journal:
     │                                 on first creation of a docs/<task>-* folder, create SETUP.md
     │                                 recording how users/content/fixture were set up (who, how,
     │                                 with what params), progress and how to resume — keep it
     │                                 updated through the remaining phases
Phase 9    Code Writing              — POM → Flow → spec + run tests
     │
Phase 10   Code Review               — code-reviewer agent
     │
Phase 11   Coverage Update           — update TEST_COVERAGE.md
     │
     ✅ Summary (incl. SETUP.md updated)
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
| 6-8   | MCP Playwright | Execute UI checks + visual screenshots |
| 9     | test-runner | Run Playwright tests |
| 10    | code-reviewer | Review written code |
| 11    | coverage-mapper | Update TEST_COVERAGE.md |
