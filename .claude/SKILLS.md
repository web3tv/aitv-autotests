# Skills & Agents

## Global Skills (available in all projects)

| Skill | Location | Description |
|-------|----------|-------------|
| `/pipeline` | `~/.claude/commands/pipeline/` | Universal test automation pipeline (11 phases) |
| `/jira` | `~/.claude/commands/jira/` | Create Jira issues via REST API |
| `/project-manager` | `~/.claude/commands/project-manager/` | Requirements analysis (Russian) |

## Pipeline Phases (`/pipeline`)

```
Phase 0    Branch Setup            — creates test/<name> branch from main
Phase 1    Jira Analysis           — parses Jira task or text description
Phase 2    Code Analysis           — checkout task branch + analyze source repos
Phase 3    Test Design             — clarifying questions + test cases + ASCII diagrams
Phase 4    Autotests Mapping       — analyze existing tests + coverage mapping
Phase 5    Approval                — consolidated plan for user approval
Phase 6    MCP Smoke Check         — basic functionality via MCP Playwright (optional)
Phase 7    MCP Edge Cases Check    — edge cases via MCP Playwright (optional)
Phase 8    Code Writing            — page objects → flows → spec + run tests
Phase 9    Code Review             — code-reviewer agent
Phase 10   Coverage Update         — update coverage documentation
```

The pipeline reads project-specific conventions from CLAUDE.md and uses agents from `.claude/agents/` if they exist.

See `.claude/PIPELINE_FLOW.md` for the visual flow diagram.

## Project Agents (this project only)

Agents are sub-processes launched by `/pipeline`. They are defined per-project in `.claude/agents/`.

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
