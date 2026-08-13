# VOX Studio — Rapid Implementation Plan

Goal: reach a usable premium MVP in the shortest practical path.

## Phase 0 — Repo bootstrap
- create monorepo
- install baseline
- env validation
- CI
- UI shell
- database connection
- worker skeleton

## Phase 1 — Asset Universe
- Character
- Studio
- Style
- Voice
- Wardrobe
- Prop
- Asset
- versioning
- production recipe

## Phase 2 — Script to Story
- script upload/paste
- language detection
- Script Doctor
- Story Graph
- Director
- Scene Contracts

## Phase 3 — Generation
- provider interfaces
- first image/video/voice adapters
- async jobs
- retries/fallback
- media storage

## Phase 4 — Mentor
- story
- language
- continuity
- visual
- pacing
- humanization
- quality score
- fix plan

## Phase 5 — Editor
- storyboard
- preview
- scene inspector
- asset replacement
- timeline
- captions
- audio
- transitions

## Phase 6 — Render
- composition
- FFmpeg
- audio mix
- captions
- probes
- 16:9/9:16
- thumbnails

## Phase 7 — Hardening
- E2E
- visual regression
- performance
- error states
- cost tracking
- audit logs
- security review

## Execution rule
Each phase must finish with:
lint + typecheck + tests + build + manual smoke test.
Do not start a new phase with failing gates.

## MVP shortcuts
Do not build marketplace, advanced collaboration, public API, enterprise admin, or a full Premiere clone before the core loop works.
