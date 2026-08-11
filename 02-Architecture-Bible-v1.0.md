# VOX Studio — Architecture Bible v1.0

## Core principle
AI generates and proposes. The Production System owns truth, continuity, quality and state.

## Layers
1. Presentation
2. Application / Use Cases
3. Domain
4. AI Orchestration
5. Media Infrastructure
6. Async Processing
7. Persistence

## Domains
workspaces, projects, episodes, scripts, stories, characters, studios, styles, voices, props, assets, scenes, shots, timelines, production, mentor, rendering, thumbnails, exports, usage.

## Core entities
Workspace
Project
Episode
Script
StoryGraph
Character / CharacterVersion
Studio / StudioVersion
Style / StyleVersion
Voice
Wardrobe
Prop
Asset / AssetVersion
Scene / SceneVersion
Shot
Timeline / Track / Clip
GenerationJob
ProviderRun
MentorReview
MentorIssue
RevisionJob
Render
Thumbnail
Export
ProductionRecipe

## Rules
- Domain code never calls an AI provider directly.
- Providers implement adapters behind interfaces.
- Generation never decides quality.
- Mentor never mutates media directly.
- Every scene has a Scene Contract.
- Canonical assets are versioned.
- Timeline edits are non-destructive.
- Export requires quality gates.
- Every async job is observable and idempotent.
- User overrides are audited.

## Production state
DRAFT → PLANNING → STORYBOARDING → GENERATING → VALIDATING → MENTOR_REVIEW → REVISING → READY_TO_RENDER → RENDERING → EXPORTED.

## Provider abstraction
TextModelProvider
ImageModelProvider
VideoModelProvider
VoiceModelProvider
MusicProvider
SfxProvider
TranscriptionProvider
UpscalerProvider

## Scene Contract
id, narrativePurpose, storyNode, dialogueRange, characterRefs, studioRef, styleRef, propRefs, visualIntent, shot, camera, motion, graphics, transitionIn, transitionOut, voice, music, sfx, duration, continuityDependencies.

## Continuity
Track character, wardrobe, props, studio, lighting, time, camera, style and narrative state.
Use inheritance/dependencies instead of re-prompting every scene from scratch.

## Mentor
Mentor agents:
Story, Scene, Continuity, Visual, Language, Audio, Pacing, Humanization.
Aggregator produces Quality Score + Issues + Fix Plan.

## Regeneration
Scene changes flow through a dependency graph so only affected scenes/assets are regenerated.

## Events
episode.created
script.analyzed
story.generated
story.approved
scene.planned
scene.generated
scene.validated
mentor.review_started
mentor.issue_found
mentor.approved
mentor.revision_requested
render.started
render.completed
render.failed
export.created

## Storage
Database: metadata/state.
Object storage: media.
Cache: reusable intermediates.
Search/vector layer: semantic retrieval of assets and creative memory.

## Security
Provider keys and storage credentials remain server-side.
No browser-to-provider secret exposure.

## Testing
Unit, integration, provider contract, workflow, visual regression and end-to-end tests.

## Architecture invariants
No direct provider calls from domains.
No quality claims before validation.
No destructive canonical asset overwrite.
No export with unresolved blockers.
No provider-specific logic in UI.
