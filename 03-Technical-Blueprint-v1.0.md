# VOX Studio — Technical Blueprint v1.0

## Recommended stack
- Frontend: Next.js + React + TypeScript
- UI: Tailwind CSS + shadcn/ui primitives + custom VOX design tokens
- Monorepo: pnpm + Turborepo
- Backend API: NestJS or a TypeScript modular API layer
- Contracts: Zod
- Database: PostgreSQL + Prisma
- Workflow orchestration: Temporal TypeScript SDK
- Queue/short-lived cache: Redis where useful
- Media: FFmpeg + ffprobe
- Programmatic composition: Remotion or an alternative renderer where licensing is acceptable
- Object storage: S3-compatible storage
- Search: PostgreSQL FTS initially; pgvector when semantic retrieval is needed
- Testing: Vitest/Jest + Playwright
- Observability: OpenTelemetry-compatible instrumentation

## Monorepo
apps/
  web/
  api/
  worker/
  renderer/
packages/
  ui/
  contracts/
  domain/
  ai/
  media/
  database/
  config/
  observability/
  testing/
  eslint-config/
  tsconfig/

## Backend modules
auth
workspaces
projects
episodes
scripts
stories
characters
studios
styles
voices
assets
production
generation
mentor
timeline
rendering
thumbnails
exports
usage

## API
POST /workspaces
GET /projects
POST /projects
POST /episodes
POST /episodes/:id/script
POST /episodes/:id/analyze
POST /episodes/:id/story
POST /episodes/:id/production-plan
POST /scenes/:id/generate
POST /scenes/:id/regenerate
POST /episodes/:id/mentor/review
POST /episodes/:id/mentor/fix
POST /episodes/:id/render
POST /episodes/:id/thumbnails
POST /episodes/:id/export
GET /jobs/:id
GET /assets
POST /assets
POST /styles/import
POST /characters/import
POST /studios/import

## Database essentials
workspaces
users
workspace_members
projects
episodes
scripts
story_graphs
characters
character_versions
studios
studio_versions
styles
style_versions
voices
wardrobes
props
assets
asset_versions
production_recipes
scenes
scene_versions
shots
timelines
timeline_tracks
timeline_clips
generation_jobs
provider_runs
mentor_reviews
mentor_issues
revision_jobs
renders
thumbnails
exports
usage_events
audit_events

## Zod
Every API input/output and provider boundary uses a schema.
Persisted JSON must validate before entering a workflow.

## Temporal workflows
episodeProductionWorkflow
scriptAnalysisWorkflow
storyPlanningWorkflow
sceneGenerationWorkflow
mentorReviewWorkflow
revisionWorkflow
renderWorkflow
thumbnailWorkflow
exportWorkflow

## Job principles
- idempotency key
- retry policy
- exponential backoff
- provider fallback
- timeout
- cancellation
- progress events
- structured error
- cost record

## Media pipeline
ingest → preprocess → generate → validate → upscale → normalize → compose → audio mix → captions → color → render → probe → export.

## First vertical slice
Script upload
→ analysis
→ story graph
→ director
→ 5–10 scene contracts
→ image/video generation
→ voice
→ mentor
→ auto-fix
→ timeline
→ render
→ thumbnail
→ 16:9 + 9:16.

## Environment
Never commit secrets. Use typed env validation and separate development/staging/production configuration.

## CI
install → lint → typecheck → unit → integration → build → E2E → artifact/license checks.

## Premium UI architecture
Production workspace is the primary screen:
left Asset Rail, center Canvas, right Mentor/Inspector, bottom Storyboard/Timeline.
Dark editorial shell, restrained accent colors, dense but calm information hierarchy.
