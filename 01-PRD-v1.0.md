# VOX Studio — PRD v1.0

## 1. Product
VOX Studio is an AI-native editorial video production operating system. It turns a script into a coherent, branded, narrated, edited and quality-reviewed video.

The product is NOT a prompt-to-video toy. Its core loop is:
Script → Story Doctor → Story Graph → AI Director → Scene Contracts → Generation → Production Mentor → Revision → Timeline → Render → Thumbnail → Export.

## 2. Vision
Make high-quality editorial video production feel like assembling a reusable creative system: choose characters, studios, styles, voices and production recipes, then let the system execute and review the production.

## 3. Core users
- Solo creator
- Podcast/video producer
- Editorial content team
- Finance/markets media brand
- Future VIXOR marketing/content team

## 4. Core UX
A user can:
- create a project
- choose a character
- choose a studio/set
- choose a visual style
- choose wardrobe/props
- choose a voice
- upload/paste Arabic or English script
- let AI plan scenes
- inspect/reorder/regenerate scenes
- receive Mentor QA
- auto-fix approved issues
- render
- generate thumbnail
- export 16:9, 9:16, 1:1 and 4:5

## 5. Asset Universe
Persistent reusable entities:
Character, Character Version, Studio, Studio Version, Style, Style Version, Voice, Wardrobe, Prop, Asset, Asset Version, Production Recipe.

Canonical assets are versioned and never silently overwritten.

## 6. Character system
Each character stores:
identity, visual references, anatomy constraints, wardrobe, expressions, gestures, personality, voice, allowed styles, allowed studios and props.

## 7. Style system
A style is a structured Style DNA, not one prompt:
palette, typography, texture, composition, lighting, camera language, motion language, transition language, graphics language, negative rules.

Users can upload references and create a style pack.

## 8. Production recipe
A saved recipe combines:
character + studio + style + voice + wardrobe + camera defaults + transition language + captions + music/SFX + Mentor rules.

This is the main speed multiplier.

## 9. Script Doctor
Before production, the system checks:
- hook
- narrative clarity
- claims
- pacing
- repetition
- transitions
- language
- tone
- visual opportunities
- missing context

It produces a structured Story Graph.

## 10. AI Director
The Director converts the Story Graph into a Production Plan and Scene Contracts.
It does not directly call providers.

## 11. Scene types
HOST, EXPLAINER, MINI_HOST, REACTION, DATA, METAPHOR, ARCHIVE, GRAPHIC, TRANSITION, OUTRO.

## 12. VOX mixed-media language
The supplied VOX style reference establishes:
paper/collage textures, halftone, marker circles, torn paper, tape/stickers, charts, maps, archival cutouts, editorial typography and controlled red/mustard/teal accents.
The supplied board defines a mixed Studio + VOX sequence: Host Scene → Transition → VOX Explainer → Mini Host → Reaction Shot → Loop Back.

## 13. Humanization
The system must avoid obvious automation:
- repeated framing
- repetitive transitions
- generic B-roll
- overly literal visuals
- identical pacing
- excessive motion
- robotic pauses
- unnecessary exposition
- lack of reaction/contrast

Variation must be editorially motivated, not random.

## 14. Production Mentor
Independent QA layer:
Story Mentor, Scene Mentor, Continuity Mentor, Visual Mentor, Language Mentor, Audio Mentor, Pacing Mentor, Humanization Mentor.
Mentor returns issues and a fix plan. It does not blindly regenerate the whole episode.

## 15. Quality gates
Script → Story → Storyboard → Scene → Visual → Audio → Continuity → Mentor → Humanization → Render → Export.

BLOCKER issues prevent export unless explicitly overridden.

## 16. Multilingual
Arabic and English are first-class production languages.
The story can be shared, but dialogue timing, captions, typography, voice timing and localization are language-specific.
Prompts may remain English internally while output language follows the episode language.

## 17. Editor
MVP editor:
storyboard, preview, scene inspector, replace asset, regenerate, voice/music/SFX, captions, trim, transitions, timeline, render.
Do not build a full Premiere clone.

## 18. Thumbnail
Generate multiple concepts from episode key moments, score them, allow selection, and create platform variants.

## 19. Reframe
Export profiles:
16:9, 9:16, 1:1, 4:5.
Reframe should reposition important subjects/text rather than only crop.

## 20. Non-functional requirements
- deterministic asset references
- versioning
- retry/fallback
- idempotent jobs
- observability
- cost tracking
- audit trail
- secure provider credentials
- responsive premium UI
- accessible controls
- fast preview
- no destructive edits

## 21. MVP definition of done
A user can upload an Arabic or English script, select Prof. Tradeo + studio + VOX style + voice, generate a coherent episode, pass Mentor QA, revise automatically, render, generate a thumbnail and export 16:9 and 9:16.

## 22. Future
Teams, collaboration, marketplace, templates marketplace, advanced analytics, public API, enterprise controls.
