import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const ProductionStatus = z.enum([
  "DRAFT",
  "PLANNING",
  "SCRIPTING",
  "GENERATING",
  "DOWNLOADING",
  "VALIDATING",
  "MENTOR_REVIEW",
  "REVISING",
  "READY_TO_RENDER",
  "RENDERING",
  "QA",
  "EXPORTED",
  "FAILED",
]);
export type ProductionStatus = z.infer<typeof ProductionStatus>;

export const ProductionStage = z.enum([
  "script",
  "plan",
  "assets",
  "download",
  "timeline",
  "captions",
  "mentor",
  "humanization",
  "render",
  "qa",
  "finalize",
  "done",
]);
export type ProductionStage = z.infer<typeof ProductionStage>;

export const RuntimeMode = z.enum(["mock", "auto", "real"]);
export type RuntimeMode = z.infer<typeof RuntimeMode>;

export const Capability = z.enum([
  "TEXT",
  "REASONING",
  "VOICE",
  "IMAGE",
  "IMAGE_EDIT",
  "VIDEO",
  "MUSIC",
  "SFX",
]);
export type Capability = z.infer<typeof Capability>;

export const Language = z.enum(["ar", "en"]);
export type Language = z.infer<typeof Language>;

export const MediaType = z.enum(["image", "audio", "video", "captions", "json", "other"]);
export type MediaType = z.infer<typeof MediaType>;

// ─── Projects / Episodes ─────────────────────────────────────────────────────

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProductionConfigSchema = z.object({
  topic: z.string().min(1),
  language: Language,
  format: z.string().default("podcast"),
  durationTargetSec: z.number().int().positive().default(45),
  speakerCount: z.number().int().min(1).default(2),
  sceneCount: z.number().int().min(1).default(2),
  shotCount: z.number().int().min(1).default(4),
  style: z.string().default("Premium cinematic podcast"),
  resolution: z.object({ width: z.number(), height: z.number() }).default({ width: 1280, height: 720 }),
  fps: z.number().default(24),
});
export type ProductionConfig = z.infer<typeof ProductionConfigSchema>;

export const EpisodeSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  config: ProductionConfigSchema,
  status: ProductionStatus,
  stage: ProductionStage.optional(),
  stageMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Episode = z.infer<typeof EpisodeSchema>;

// ─── Dialogue / Script ───────────────────────────────────────────────────────

export const DialogueLineSchema = z.object({
  speaker: z.string(),
  role: z.string().default("HOST"),
  text: z.string(),
  lineIndex: z.number().int(),
});
export type DialogueLine = z.infer<typeof DialogueLineSchema>;

export const ScriptDocumentSchema = z.object({
  episodeId: z.string(),
  language: Language,
  title: z.string(),
  topic: z.string(),
  hook: z.string(),
  summary: z.string(),
  lines: z.array(DialogueLineSchema).min(1),
  reasoning: z.string().optional(),
});
export type ScriptDocument = z.infer<typeof ScriptDocumentSchema>;

// ─── Plan / Scenes / Shots ───────────────────────────────────────────────────

export const ShotSchema = z.object({
  id: z.string(),
  index: z.number().int(),
  type: z.string(),
  description: z.string(),
  visualPrompt: z.string(),
  durationSec: z.number(),
  camera: z.string(),
  transitionIn: z.string(),
});
export type Shot = z.infer<typeof ShotSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  index: z.number().int(),
  type: z.string(),
  narrativePurpose: z.string(),
  dialogueLineIndices: z.array(z.number().int()),
  shots: z.array(ShotSchema),
  durationSec: z.number(),
  visualIntent: z.string(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const PlanDocumentSchema = z.object({
  episodeId: z.string(),
  storyGraph: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }).default({ nodes: [], edges: [] }),
  scenes: z.array(SceneSchema),
  durationTargetSec: z.number(),
  continuityRules: z.array(z.string()).default([]),
  reasoning: z.string().optional(),
});
export type PlanDocument = z.infer<typeof PlanDocumentSchema>;

// ─── Assets / Artifacts ──────────────────────────────────────────────────────

export const ArtifactRecordSchema = z.object({
  id: z.string(),
  kind: z.string(),
  mediaType: MediaType,
  provider: z.string(),
  model: z.string(),
  capability: Capability,
  requestId: z.string().optional(),
  sourceUrl: z.string().optional(),
  storageKey: z.string(),
  fileName: z.string(),
  sizeBytes: z.number(),
  sha256: z.string(),
  mimeType: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.any()).default({}),
});
export type ArtifactRecord = z.infer<typeof ArtifactRecordSchema>;

export const ProviderRunSchema = z.object({
  id: z.string(),
  capability: Capability,
  provider: z.string(),
  model: z.string(),
  status: z.enum(["pending", "running", "succeeded", "failed", "blocked"]),
  requestId: z.string().optional(),
  request: z.record(z.any()).optional(),
  responseSummary: z.record(z.any()).optional(),
  artifactId: z.string().optional(),
  sizeBytes: z.number().optional(),
  error: z.string().optional(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});
export type ProviderRun = z.infer<typeof ProviderRunSchema>;

// ─── Production / Job ────────────────────────────────────────────────────────

export const ProductionRunSchema = z.object({
  episodeId: z.string(),
  workflowId: z.string(),
  status: ProductionStatus,
  stage: ProductionStage,
  runtimeMode: RuntimeMode,
  currentStageMessage: z.string().default(""),
  stageOrder: z.array(ProductionStage),
  stageIndex: z.number().int().default(0),
  progress: z.number().default(0),
  providerRuns: z.array(ProviderRunSchema).default([]),
  artifacts: z.array(ArtifactRecordSchema).default([]),
  error: z.string().optional(),
  startedAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
});
export type ProductionRun = z.infer<typeof ProductionRunSchema>;

// ─── Timeline ────────────────────────────────────────────────────────────────

export const TimelineClipSchema = z.object({
  id: z.string(),
  kind: z.enum(["image", "video", "audio", "caption"]),
  source: z.string(), // storage path of the media input
  startSec: z.number(),
  durationSec: z.number(),
  artifactId: z.string().optional(),
  text: z.string().optional(),
});
export type TimelineClip = z.infer<typeof TimelineClipSchema>;

export const TimelineSchema = z.object({
  episodeId: z.string(),
  width: z.number(),
  height: z.number(),
  fps: z.number(),
  clips: z.array(TimelineClipSchema),
  totalDurationSec: z.number(),
});
export type TimelineData = z.infer<typeof TimelineSchema>;

// ─── QA / Mentor ─────────────────────────────────────────────────────────────

export const QaCheckSchema = z.object({
  name: z.string(),
  status: z.enum(["pass", "warn", "fail"]),
  detail: z.string(),
});
export type QaCheck = z.infer<typeof QaCheckSchema>;

export const QaReportSchema = z.object({
  episodeId: z.string(),
  passed: z.boolean(),
  checks: z.array(QaCheckSchema),
  ffprobe: z.record(z.any()).optional(),
  generatedAt: z.string(),
});
export type QaReport = z.infer<typeof QaReportSchema>;

export const MentorIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(["blocker", "warning", "info"]),
  domain: z.string(),
  title: z.string(),
  evidence: z.string(),
  fix: z.string(),
});
export type MentorIssue = z.infer<typeof MentorIssueSchema>;

export const MentorReportSchema = z.object({
  episodeId: z.string(),
  qualityScore: z.number(),
  issues: z.array(MentorIssueSchema),
  humanization: z.record(z.any()).default({}),
  continuity: z.record(z.any()).default({}),
  approved: z.boolean(),
  generatedAt: z.string(),
});
export type MentorReport = z.infer<typeof MentorReportSchema>;

// ─── Provider results ────────────────────────────────────────────────────────

export const TextResultSchema = z.object({
  text: z.string(),
  requestId: z.string(),
  provider: z.string(),
  model: z.string(),
  usage: z.record(z.any()).optional(),
});
export type TextResult = z.infer<typeof TextResultSchema>;

export const MediaResultSchema = z.object({
  requestId: z.string(),
  provider: z.string(),
  model: z.string(),
  binaryUrl: z.string().optional(),
  buffer: z.any().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});
export type MediaResult = z.infer<typeof MediaResultSchema>;

// ─── Envelope / generic job signals ──────────────────────────────────────────

export const JobEventSchema = z.object({
  episodeId: z.string(),
  stage: ProductionStage,
  message: z.string(),
  ts: z.string(),
});
export type JobEvent = z.infer<typeof JobEventSchema>;
