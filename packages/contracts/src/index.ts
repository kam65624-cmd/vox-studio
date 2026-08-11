import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const EpisodeStatusSchema = z.enum([
  "DRAFT",
  "PLANNING",
  "STORYBOARDING",
  "GENERATING",
  "VALIDATING",
  "MENTOR_REVIEW",
  "REVISING",
  "READY_TO_RENDER",
  "RENDERING",
  "EXPORTED",
]);

export const SceneTypeSchema = z.enum([
  "HOST",
  "EXPLAINER",
  "MINI_HOST",
  "REACTION",
  "DATA",
  "METAPHOR",
  "ARCHIVE",
  "GRAPHIC",
  "TRANSITION",
  "OUTRO",
]);

export const MentorSeveritySchema = z.enum(["BLOCKER", "MAJOR", "MINOR", "SUGGESTION"]);

export const ProductionLanguageSchema = z.enum(["ar", "en", "ar-en"]);

export const ExportProfileSchema = z.enum(["16:9", "9:16", "1:1", "4:5"]);

export const AssetTypeSchema = z.enum([
  "CHARACTER",
  "STUDIO",
  "STYLE",
  "VOICE",
  "WARDROBE",
  "PROP",
  "GENERIC",
]);

// ─── Base ─────────────────────────────────────────────────────────────────────

export const IdSchema = z.string();

export const TimestampsSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Workspace / Project ──────────────────────────────────────────────────────

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export const CreateProjectSchema = z.object({
  workspaceId: z.string().optional().default("ws-default-001"),
  name: z.string().min(1, "Project name is required").max(200),
  description: z.string().max(1000).optional(),
  language: ProductionLanguageSchema.default("ar"),
  productionType: z.string().optional().default("Podcast"),
  productionRecipeId: z.string().optional(),
  aspectRatio: z.string().optional(),
  targetDuration: z.number().optional(),
  characterId: z.string().optional(),
  styleId: z.string().optional(),
  voiceId: z.string().optional(),
});

// ─── Episode ──────────────────────────────────────────────────────────────────

export const CreateEpisodeSchema = z.object({
  projectId: IdSchema,
  title: z.string().min(1).max(200),
  language: ProductionLanguageSchema,
  productionRecipeId: IdSchema.optional(),
});

// ─── Script ───────────────────────────────────────────────────────────────────

export const UploadScriptSchema = z.object({
  episodeId: IdSchema.optional(),
  content: z.string().min(10, "Script must be at least 10 characters").max(100_000),
  language: ProductionLanguageSchema.optional(),
});

export const ScriptDoctorAnalysisSchema = z.object({
  detectedLanguage: ProductionLanguageSchema,
  wordCount: z.number(),
  estimatedDurationSeconds: z.number(),
  hookQualityScore: z.number().min(0).max(100),
  coreThesis: z.string(),
  keyTakeaways: z.array(z.string()),
  pacingFeedback: z.string(),
  structure: z.array(
    z.object({
      paragraphIndex: z.number(),
      purpose: z.string(),
      text: z.string(),
      suggestedSceneType: SceneTypeSchema,
    })
  ),
});

// ─── Story Graph ──────────────────────────────────────────────────────────────

export const StoryGraphNodeSchema = z.object({
  id: IdSchema,
  sequenceIndex: z.number(),
  act: z.enum(["HOOK", "PREMISE", "ESCALATION", "CLIMAX", "RESOLUTION"]),
  title: z.string(),
  summary: z.string(),
  sceneType: SceneTypeSchema,
  estimatedDurationSeconds: z.number(),
  narrativeGoal: z.string(),
});

export const StoryGraphSchema = z.object({
  id: IdSchema,
  episodeId: IdSchema,
  nodes: z.array(StoryGraphNodeSchema),
  approved: z.boolean().default(false),
  version: z.number().default(1),
  createdAt: z.string(),
});

// ─── Scene Contract ───────────────────────────────────────────────────────────

export const ShotSchema = z.object({
  type: z.enum(["WIDE", "MEDIUM", "CLOSE", "EXTREME_CLOSE", "OVER_SHOULDER", "POV"]),
  angle: z.string().optional(),
  motion: z.string().optional(),
});

export const SceneContractSchema = z.object({
  id: IdSchema,
  sequenceIndex: z.number().int().min(0),
  narrativePurpose: z.string(),
  sceneType: SceneTypeSchema,
  dialogueRange: z.object({ start: z.number(), end: z.number() }),
  dialogueText: z.string().optional(),
  characterRefs: z.array(IdSchema),
  studioRef: IdSchema.optional(),
  styleRef: IdSchema.optional(),
  propRefs: z.array(IdSchema),
  visualIntent: z.string(),
  shot: ShotSchema,
  camera: z.string(),
  motion: z.string(),
  graphics: z.string().optional(),
  transitionIn: z.string().optional(),
  transitionOut: z.string().optional(),
  voiceRef: IdSchema.optional(),
  music: z.string().optional(),
  sfx: z.string().optional(),
  durationSeconds: z.number().positive(),
  continuityDependencies: z.array(IdSchema),
});

// ─── Mentor ───────────────────────────────────────────────────────────────────

export const MentorIssueSchema = z.object({
  id: IdSchema,
  mentorType: z.enum([
    "STORY",
    "SCENE",
    "CONTINUITY",
    "VISUAL",
    "LANGUAGE",
    "AUDIO",
    "PACING",
    "HUMANIZATION",
  ]),
  severity: MentorSeveritySchema,
  title: z.string(),
  evidence: z.string(),
  impact: z.string(),
  fixSuggestion: z.string(),
  sceneRef: IdSchema.optional(),
  autoFixable: z.boolean(),
  resolved: z.boolean().default(false),
  overridden: z.boolean().default(false),
});

export const MentorReviewSchema = z.object({
  id: IdSchema,
  episodeId: IdSchema,
  qualityScore: z.number().min(0).max(100),
  issues: z.array(MentorIssueSchema),
  approved: z.boolean(),
  createdAt: z.string(),
});

// ─── Production Recipe ────────────────────────────────────────────────────────

export const ProductionRecipeSchema = z.object({
  id: IdSchema,
  name: z.string(),
  characterId: IdSchema.optional(),
  studioId: IdSchema.optional(),
  styleId: IdSchema.optional(),
  voiceId: IdSchema.optional(),
  wardrobeId: IdSchema.optional(),
  defaultTransitionLanguage: z.string().optional(),
  captionsEnabled: z.boolean().default(true),
  musicEnabled: z.boolean().default(false),
  sfxEnabled: z.boolean().default(false),
  mentorRules: z.record(z.unknown()).optional(),
});

// ─── Job ──────────────────────────────────────────────────────────────────────

export const JobStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);

export const JobSchema = z.object({
  id: IdSchema,
  type: z.string(),
  status: JobStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  progressLabel: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  costUsd: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Asset Universe Schemas ────────────────────────────────────────────────────

export const CharacterSchema = z.object({
  id: IdSchema,
  assetId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  personality: z.string(),
  identity: z.string(),
  expressions: z.array(z.string()),
  gestures: z.array(z.string()),
  allowedStyleIds: z.array(z.string()),
  allowedStudioIds: z.array(z.string()),
  allowedVoiceIds: z.array(z.string()),
  status: z.enum(["active", "archived"]),
  isCanonical: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const StudioSchema = z.object({
  id: IdSchema,
  assetId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  elements: z.array(z.string()),
  lighting: z.string(),
  cameraPositions: z.array(z.string()),
  backgroundElements: z.array(z.string()),
  compatibleStyleIds: z.array(z.string()),
  compatibleCharacterIds: z.array(z.string()),
  status: z.enum(["active", "archived"]),
  isCanonical: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const StyleSchema = z.object({
  id: IdSchema,
  assetId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  palette: z.array(z.object({ name: z.string(), hex: z.string() })),
  texture: z.string(),
  composition: z.string(),
  lighting: z.string(),
  cameraLanguage: z.string(),
  motionLanguage: z.string(),
  transitionLanguage: z.string(),
  graphicsLanguage: z.string(),
  negativeRules: z.array(z.string()),
  isCanonical: z.boolean(),
  status: z.enum(["active", "archived"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const VoiceSchema = z.object({
  id: IdSchema,
  name: z.string(),
  language: ProductionLanguageSchema,
  locale: z.string(),
  gender: z.string(),
  tone: z.string(),
  speed: z.number(),
  pitch: z.number(),
  provider: z.string(),
  providerVoiceId: z.string(),
  sampleUrl: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const WardrobeSchema = z.object({
  id: IdSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  characterId: z.string(),
  colorPalette: z.array(z.string()),
  accessories: z.array(z.string()),
  styleCompatibility: z.array(z.string()),
  referenceImages: z.array(z.string()),
  isCanonical: z.boolean(),
  status: z.enum(["active", "archived"]),
  createdAt: z.string(),
});

export const PropSchema = z.object({
  id: IdSchema,
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  description: z.string(),
  studioCompatibility: z.array(z.string()),
  styleCompatibility: z.array(z.string()),
  referenceImages: z.array(z.string()),
  isCanonical: z.boolean(),
  createdAt: z.string(),
});

export const ProductionRecipeFullSchema = z.object({
  id: IdSchema,
  name: z.string(),
  character: CharacterSchema.optional(),
  studio: StudioSchema.optional(),
  style: StyleSchema.optional(),
  voice: VoiceSchema.optional(),
  wardrobe: WardrobeSchema.optional(),
  propIds: z.array(z.string()),
  defaultTransitionLang: z.string().optional(),
  captionsEnabled: z.boolean().default(true),
  musicEnabled: z.boolean().default(false),
  sfxEnabled: z.boolean().default(false),
  mentorRules: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Entity & Claims Graph ───────────────────────────────────────────────────

export const EntityTypeSchema = z.enum([
  "PERSON",
  "ORGANIZATION",
  "LOCATION",
  "CONCEPT",
  "FINANCIAL_INSTRUMENT",
  "BRAND",
  "EVENT",
]);

export const CanonicalEntitySchema = z.object({
  id: IdSchema,
  name: z.string(),
  type: EntityTypeSchema,
  description: z.string(),
  aliases: z.array(z.string()),
  sourceClaims: z.array(z.string()),
  affectedSceneIds: z.array(z.string()),
});

export const EntityGraphNodeSchema = z.object({
  entityId: IdSchema,
  name: z.string(),
  type: EntityTypeSchema,
  occurrences: z.array(z.object({
    sceneId: z.string(),
    context: z.string(),
  })),
});

export const EntityGraphSchema = z.object({
  nodes: z.array(EntityGraphNodeSchema),
  canonicalEntities: z.array(CanonicalEntitySchema),
  claimLedger: z.array(z.object({
    id: IdSchema,
    claim: z.string(),
    source: z.string().optional(),
    verified: z.boolean(),
    sceneIds: z.array(z.string()),
  })),
});

// ─── Creative DNA & Style Skills ─────────────────────────────────────────────

export const CreativeDNASchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  styleName: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  fontFamily: z.string(),
  composition: z.string(),
  cameraLanguage: z.string(),
  motionLanguage: z.string(),
  transitionLanguage: z.string(),
  negativeRules: z.array(z.string()),
  brandRules: z.array(z.string()),
  version: z.number().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const StyleSkillSchema = z.object({
  id: IdSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  visualGrammar: z.string(),
  colorSystem: z.object({
    primary: z.string(),
    accent: z.string(),
    background: z.string(),
  }),
  composition: z.string(),
  camera: z.string(),
  motion: z.string(),
  transitions: z.string(),
  typography: z.string(),
  texture: z.string(),
  props: z.array(z.string()),
  negativeRules: z.array(z.string()),
  promptGrammar: z.string(),
  qualityRules: z.array(z.string()),
});

// ─── P0-E Shot Graph & Production Graph ───────────────────────────────────────

export const ShotTypeSchema = z.enum([
  "EXTREME_CLOSE",
  "CLOSE",
  "MEDIUM",
  "WIDE",
  "OVER_SHOULDER",
  "POV",
]);

export const ShotNodeSchema = z.object({
  id: IdSchema,
  sceneId: IdSchema,
  sequenceIndex: z.number(),
  shotType: ShotTypeSchema,
  framing: z.string(),
  cameraMovement: z.string(),
  subject: z.string(),
  durationSeconds: z.number(),
  dependencies: z.array(z.string()),
});

export const ProductionNodeTypeSchema = z.enum([
  "CHARACTER_RIG",
  "STUDIO_ENVIRONMENT",
  "STYLE_SKILL",
  "SHOT_GENERATION",
  "VOICE_SEGMENT",
  "MUSIC_TRACK",
  "GRAPHIC_OVERLAY",
  "TRANSITION_COMP",
]);

export const ProductionNodeSchema = z.object({
  id: IdSchema,
  type: ProductionNodeTypeSchema,
  label: z.string(),
  sceneId: IdSchema.optional(),
  shotId: IdSchema.optional(),
  status: z.enum(["PENDING", "GENERATING", "READY", "FAILED"]),
  dependencies: z.array(IdSchema),
  costEstimateUsd: z.number().default(0),
});

export const ProductionGraphSchema = z.object({
  id: IdSchema,
  episodeId: IdSchema,
  shots: z.array(ShotNodeSchema),
  nodes: z.array(ProductionNodeSchema),
  totalDurationSeconds: z.number(),
  estimatedGenerationCostUsd: z.number(),
});

// ─── P0-F Continuity & Drift Detector ─────────────────────────────────────────

export const DriftTypeSchema = z.enum([
  "PALETTE_DRIFT",
  "WARDROBE_DRIFT",
  "CAMERA_JUMP",
  "NEGATIVE_RULE_VIOLATION",
  "LIGHTING_DRIFT",
  "PROPS_DISCREPANCY",
]);

export const DriftSeveritySchema = z.enum(["CRITICAL", "WARNING", "INFO"]);

export const DriftViolationSchema = z.object({
  id: IdSchema,
  driftType: DriftTypeSchema,
  severity: DriftSeveritySchema,
  sceneAId: IdSchema,
  sceneBId: IdSchema.optional(),
  description: z.string(),
  fixRecommendation: z.string(),
});

export const ContinuityReportSchema = z.object({
  id: IdSchema,
  episodeId: IdSchema,
  overallContinuityScore: z.number().min(0).max(100),
  violations: z.array(DriftViolationSchema),
  cleanSceneIds: z.array(IdSchema),
  checkedAt: z.string(),
});

// ─── P0-H Refilm Queue, Surgical Regeneration & Humanization ───────────────────

export const RefilmStatusSchema = z.enum([
  "OPEN",
  "PLANNED",
  "RUNNING",
  "RECHECKING",
  "PASSED",
  "FAILED",
  "IGNORED",
  "OVERRIDDEN",
]);

export const RefilmActionSchema = z.enum([
  "REPAIR",
  "REGENERATE",
  "IGNORE",
  "OVERRIDE",
  "COMPARE",
]);

export const RefilmTaskSchema = z.object({
  id: IdSchema,
  episodeId: IdSchema,
  sceneId: IdSchema,
  shotId: IdSchema.optional(),
  severity: MentorSeveritySchema,
  issueType: z.string(),
  description: z.string(),
  rootCause: z.string(),
  suggestedFix: z.string(),
  affectedNodes: z.array(z.string()),
  dependencyImpact: z.string(),
  action: RefilmActionSchema,
  status: RefilmStatusSchema,
  repairAttempts: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RegenerationImpactSchema = z.object({
  targetNodeId: z.string(),
  directlyAffectedNodes: z.array(z.string()),
  downstreamAffectedNodes: z.array(z.string()),
  reusableNodes: z.array(z.string()),
  mustNotRegenerateNodes: z.array(z.string()),
  estimatedScope: z.string(),
  estimatedCostUsd: z.number(),
  estimatedDurationSeconds: z.number(),
});

export const PartialRegenerationPlanSchema = z.object({
  id: IdSchema,
  episodeId: IdSchema,
  reason: z.string(),
  rootNodeId: z.string(),
  affectedNodeIds: z.array(z.string()),
  preservedNodeIds: z.array(z.string()),
  regenerationOrder: z.array(z.string()),
  requiredAssets: z.array(z.string()),
  creativeDnaRequirements: z.array(z.string()),
  styleSkillRequirements: z.array(z.string()),
  continuityConstraints: z.array(z.string()),
  expectedOutput: z.string(),
  validationGates: z.array(z.string()),
  createdAt: z.string(),
});

export const RepairExecutionResultSchema = z.object({
  taskId: IdSchema,
  success: z.boolean(),
  repairedSceneIds: z.array(z.string()),
  executionNotes: z.string(),
  timestamp: z.string(),
});

export const RecheckResultSchema = z.object({
  taskId: IdSchema,
  passed: z.boolean(),
  newQualityScore: z.number(),
  remainingBlockersCount: z.number(),
  decision: z.enum(["APPROVE", "ESCALATE", "RETRY"]),
  recheckedAt: z.string(),
});

export const HumanizationTypeSchema = z.enum([
  "TOO_REPETITIVE",
  "TOO_PREDICTABLE",
  "TOO_MECHANICAL",
  "TOO_DENSE",
  "TOO_SLOW",
  "TOO_FAST",
]);

export const HumanizationIssueSchema = z.object({
  id: IdSchema,
  type: HumanizationTypeSchema,
  sceneId: IdSchema.optional(),
  description: z.string(),
  suggestedVariation: z.string(),
});

export const HumanizationPlanSchema = z.object({
  id: IdSchema,
  episodeId: IdSchema,
  issues: z.array(HumanizationIssueSchema),
  plannedChanges: z.array(
    z.object({
      sceneId: z.string(),
      changeType: z.string(),
      fromValue: z.string(),
      toValue: z.string(),
    })
  ),
  protectedConstraints: z.array(z.string()),
  createdAt: z.string(),
});

export const HumanizationReportSchema = z.object({
  id: IdSchema,
  episodeId: IdSchema,
  rhythmScore: z.number().min(0).max(100),
  repetitionCount: z.number(),
  issues: z.array(HumanizationIssueSchema),
  evaluatedAt: z.string(),
});

// ─── Export types ─────────────────────────────────────────────────────────────

export type EpisodeStatus = z.infer<typeof EpisodeStatusSchema>;
export type SceneType = z.infer<typeof SceneTypeSchema>;
export type MentorSeverity = z.infer<typeof MentorSeveritySchema>;
export type ProductionLanguage = z.infer<typeof ProductionLanguageSchema>;
export type ExportProfile = z.infer<typeof ExportProfileSchema>;
export type AssetType = z.infer<typeof AssetTypeSchema>;
export type SceneContract = z.infer<typeof SceneContractSchema>;
export type MentorIssue = z.infer<typeof MentorIssueSchema>;
export type MentorReview = z.infer<typeof MentorReviewSchema>;
export type ProductionRecipe = z.infer<typeof ProductionRecipeSchema>;
export type Job = z.infer<typeof JobSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type ScriptDoctorAnalysis = z.infer<typeof ScriptDoctorAnalysisSchema>;
export type StoryGraphNode = z.infer<typeof StoryGraphNodeSchema>;
export type StoryGraph = z.infer<typeof StoryGraphSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Studio = z.infer<typeof StudioSchema>;
export type Style = z.infer<typeof StyleSchema>;
export type Voice = z.infer<typeof VoiceSchema>;
export type Wardrobe = z.infer<typeof WardrobeSchema>;
export type Prop = z.infer<typeof PropSchema>;
export type ProductionRecipeFull = z.infer<typeof ProductionRecipeFullSchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export type CanonicalEntity = z.infer<typeof CanonicalEntitySchema>;
export type EntityGraphNode = z.infer<typeof EntityGraphNodeSchema>;
export type EntityGraph = z.infer<typeof EntityGraphSchema>;
export type CreativeDNA = z.infer<typeof CreativeDNASchema>;
export type StyleSkill = z.infer<typeof StyleSkillSchema>;
export type ShotNode = z.infer<typeof ShotNodeSchema>;
export type ProductionNode = z.infer<typeof ProductionNodeSchema>;
export type ProductionGraph = z.infer<typeof ProductionGraphSchema>;
export type DriftType = z.infer<typeof DriftTypeSchema>;
export type DriftSeverity = z.infer<typeof DriftSeveritySchema>;
export type DriftViolation = z.infer<typeof DriftViolationSchema>;
export type ContinuityReport = z.infer<typeof ContinuityReportSchema>;
export type RefilmStatus = z.infer<typeof RefilmStatusSchema>;
export type RefilmAction = z.infer<typeof RefilmActionSchema>;
export type RefilmTask = z.infer<typeof RefilmTaskSchema>;
export type RegenerationImpact = z.infer<typeof RegenerationImpactSchema>;
export type PartialRegenerationPlan = z.infer<typeof PartialRegenerationPlanSchema>;
export type RepairExecutionResult = z.infer<typeof RepairExecutionResultSchema>;
export type RecheckResult = z.infer<typeof RecheckResultSchema>;
export type HumanizationType = z.infer<typeof HumanizationTypeSchema>;
export type HumanizationIssue = z.infer<typeof HumanizationIssueSchema>;
export type HumanizationPlan = z.infer<typeof HumanizationPlanSchema>;
export type HumanizationReport = z.infer<typeof HumanizationReportSchema>;




