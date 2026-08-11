# VOX Studio — Codex Master Prompts

## Prompt 00 — Bootstrap

You are the lead engineer implementing VOX Studio from the attached PRD, Architecture Bible and Technical Blueprint.

Create the repository from scratch if empty.

Rules:
- TypeScript-first.
- Keep domain boundaries explicit.
- Use Zod at boundaries.
- No direct provider calls from domain code.
- No destructive asset overwrites.
- Every async operation is observable and idempotent.
- Build the premium production workspace early.
- Do not add speculative dependencies.

Implement Phase 0 only:
monorepo, apps, packages, lint, typecheck, tests, CI, env validation, DB skeleton, UI shell, worker skeleton.

Finish by running lint, typecheck, tests and build.
Fix failures before stopping.

## Prompt 01 — Asset Universe

Implement Characters, Studios, Styles, Voices, Wardrobes, Props, Assets, Versions and Production Recipes.

Use the canonical Prof. Tradeo specification as seed data.
Create upload/preview/select/version flows.
Add compatibility metadata.
No generation provider integration yet.

Acceptance:
user can create a production recipe and select it in an episode.

## Prompt 02 — Script Doctor + Director

Implement:
script ingestion → language detection → Script Doctor → Story Graph → AI Director → Scene Contracts.

Persist every intermediate artifact.
Support Arabic and English.
Validate all structured output with Zod.
Provide mock provider implementations for deterministic tests.

## Prompt 03 — Generation

Implement provider interfaces and async generation jobs.
Add adapters behind interfaces.
Do not expose provider-specific request formats to UI/domain.
Add retry, timeout, fallback, cancellation, progress and cost tracking.

## Prompt 04 — Mentor

Implement Mentor agents and aggregator.
Checks:
story, language, continuity, visual, audio, pacing, humanization.
Return issues + evidence + severity + fix plan.
Implement automatic fixes only for safe issues.
Block export on unresolved blockers.

## Prompt 05 — Editor + Render

Implement:
storyboard, canvas preview, scene inspector, replace/regenerate, timeline, captions, audio, transitions, render.
Use non-destructive editing.
Render through the chosen composition/media pipeline.
Create 16:9 and 9:16 profiles.

## Prompt 06 — Thumbnail + Reframe

Generate multiple thumbnail concepts from key moments.
Score and select.
Implement 16:9/9:16/1:1/4:5 reframe profiles.
Protect faces, key subjects and text safe zones.

## Prompt 07 — Final QA

Run full production smoke test:
Arabic script + Prof. Tradeo + VOX style + studio + voice → full episode → Mentor → fix → render → thumbnail → 16:9 + 9:16.

Fix all P0/P1 issues.
Run tests, lint, typecheck, build and E2E.
Do not declare complete until the end-to-end path works.
