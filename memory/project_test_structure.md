---
name: Test folder structure
description: Tests are organized into subfolders under tests/ — paths to spec files
type: project
---

Tests are organized into subfolders under `tests/`:

- `tests/auth/auth.spec.ts` — Authentication
- `tests/user/user.spec.ts` — Account settings
- `tests/subscription/subscriptionPlan.spec.ts` — Subscription & paid content
- `tests/hero/heroIntegration.spec.ts` — HERO integration
- `tests/studio/content.spec.ts` — Video upload & visibility
- `tests/studio/videoPlayer.spec.ts` — Video player playback
- `tests/studio/channel.spec.ts` — Channel management
- `tests/validation/handleValidation.spec.ts` — Handle validation
- `tests/validation/usernameValidation.spec.ts` — Username validation
- `tests/visualSuite/` — Visual regression (Docker only)

**Why:** Reorganized from flat `tests/` root into subfolders for scalability and consistency.
**How to apply:** Always use full subfolder paths when referencing or running spec files (e.g. `tests/auth/auth.spec.ts`, not `tests/auth.spec.ts`).
