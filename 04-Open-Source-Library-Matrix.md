# VOX Studio — Open-Source / Commercial Library Matrix

This is a selection matrix, not a blind dependency list. Verify licenses again at lockfile time.

## Core
| Area | Candidate | Use | Decision |
|---|---|---|---|
| Web | Next.js | app shell | USE |
| Monorepo | Turborepo | build/cache | USE |
| Validation | Zod | contracts | USE |
| ORM | Prisma | DB access | USE |
| UI | shadcn/ui | primitives | USE WITH CUSTOM DESIGN |
| Styling | Tailwind | tokens/utilities | USE |
| Forms | React Hook Form | complex forms | USE |
| Client state | Zustand | local editor state | USE selectively |
| Server state | TanStack Query | API cache | USE |

## Media
| Area | Candidate | Use | Decision |
|---|---|---|---|
| Codec/transcode | FFmpeg | final media pipeline | USE |
| Probe | ffprobe | media validation | USE |
| Composition | Remotion | React-driven video | EVALUATE LICENSE |
| Browser media | WebCodecs | previews where supported | OPTIONAL |
| Audio waveform | wavesurfer.js | timeline/audio UX | USE IF NEEDED |
| Timeline helpers | custom | editorial timeline | BUILD |

## AI / orchestration
| Area | Candidate | Use | Decision |
|---|---|---|---|
| Workflows | Temporal | durable production workflows | USE |
| MCP | official TypeScript SDK | tool integration | OPTIONAL |
| Vector search | pgvector | creative memory | ADD WHEN NEEDED |
| Embeddings | provider-specific | semantic retrieval | ADAPTER |

## QA / observability
| Area | Candidate | Use |
|---|---|---|
| E2E | Playwright | browser workflows |
| Unit | Vitest | fast unit tests |
| OpenTelemetry | tracing/metrics |
| Sentry or equivalent | production errors |

## Licensing cautions
FFmpeg is primarily LGPLv2.1+, but optional GPL components can change obligations. Keep a controlled build configuration and document enabled components.
Remotion has special licensing/commercial terms; do not assume it is a conventional permissive open-source dependency. The official repository explicitly points users to its commercial licensing terms.
shadcn/ui supports Next.js and monorepo setups.

## Do not add unless justified
- multiple UI kits
- multiple state libraries
- multiple ORMs
- multiple workflow engines
- a full third-party timeline editor before requirements are proven
- random AI SDKs directly in domain code
- heavy vector infrastructure before semantic retrieval is actually needed

## Source verification notes
FFmpeg licensing: official FFmpeg legal/license pages.
Remotion licensing: official repository/documentation.
shadcn monorepo/Next.js support: official documentation.
