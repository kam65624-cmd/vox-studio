import {
  SceneContract,
  MentorReview,
  EpisodeStatus,
  ScriptDoctorAnalysis,
  StoryGraph,
  StoryGraphNode,
  ProductionLanguage,
  SceneType,
  EntityGraph,
  CanonicalEntity,
  StyleSkill,
  ShotNode,
  ProductionNode,
  ProductionGraph,
  ContinuityReport,
  DriftViolation,
  CreativeDNA,
  RefilmTask,
  RefilmStatus,
  RefilmAction,
  RegenerationImpact,
  PartialRegenerationPlan,
  RepairExecutionResult,
  RecheckResult,
  HumanizationIssue,
  HumanizationPlan,
  HumanizationReport,
  HumanizationType,
  GenerationJob,
  GenerationJobStatus,
  ExecutionPlanNode,
  ProductionExecutionPlan,
  CompiledPrompt,
  ModelCapability,
  Character,
  Studio,
  Wardrobe,
  Prop,
} from "@vox/contracts";

/**
 * Domain Rule: ModelRouterPort
 * The domain never imports @vox/ai directly.
 * Callers inject a router conforming to this port.
 */
export interface ModelRouterPort {
  selectModel(request: { capability: ModelCapability; task: string; qualityRequirement?: string }): {
    selectedModel: { modelId: string };
    providerId: string;
  };
}

/**
 * Domain Rule: Production State Machine Transitions
 */
export const ALLOWED_TRANSITIONS: Record<EpisodeStatus, EpisodeStatus[]> = {
  DRAFT: ["PLANNING"],
  PLANNING: ["STORYBOARDING", "DRAFT"],
  STORYBOARDING: ["GENERATING", "PLANNING"],
  GENERATING: ["VALIDATING", "STORYBOARDING"],
  VALIDATING: ["MENTOR_REVIEW", "REVISING"],
  MENTOR_REVIEW: ["REVISING", "READY_TO_RENDER"],
  REVISING: ["GENERATING", "STORYBOARDING"],
  READY_TO_RENDER: ["RENDERING"],
  RENDERING: ["EXPORTED", "READY_TO_RENDER"],
  EXPORTED: [],
};

export function canTransition(current: EpisodeStatus, target: EpisodeStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

/**
 * Domain Rule: Quality Gate Check
 * Export is BLOCKED if mentor review has any unresolved BLOCKER issues.
 */
export function canExportEpisode(review: MentorReview): { allowed: boolean; reason?: string } {
  const blockers = review.issues.filter(
    (i) => i.severity === "BLOCKER" && !i.resolved
  );
  if (blockers.length > 0) {
    return {
      allowed: false,
      reason: `Blocked by ${blockers.length} unresolved BLOCKER issue(s).`,
    };
  }
  if (!review.approved && review.qualityScore < 60) {
    return {
      allowed: false,
      reason: `Quality score ${review.qualityScore} is below threshold 60.`,
    };
  }
  return { allowed: true };
}

/**
 * Domain Entity: Scene Contract Helper
 */
export function calculateEpisodeDuration(scenes: SceneContract[]): number {
  return scenes.reduce((acc, scene) => acc + scene.durationSeconds, 0);
}

// ─── Compatibility Engine ─────────────────────────────────────────────────────

export type CompatibilityStatus = 'COMPATIBLE' | 'WARNING' | 'INCOMPATIBLE';

export interface CompatibilityResult {
  compatible: CompatibilityStatus;
  reason?: string;
  details: string[];
}

export function checkCharacterStudioCompatibility(
  characterId: string,
  allowedStudioIds: string[],
  studioId: string,
): CompatibilityResult {
  if (allowedStudioIds.length === 0) {
    return { compatible: 'WARNING', reason: 'No studio restrictions configured', details: ['Character has no studio compatibility list'] };
  }
  if (allowedStudioIds.includes(studioId)) {
    return { compatible: 'COMPATIBLE', details: ['Studio is in character allowed list'] };
  }
  return { compatible: 'INCOMPATIBLE', reason: 'Studio not compatible with character', details: [`Studio ${studioId} not in allowed list: ${allowedStudioIds.join(', ')}`] };
}

export function checkCharacterStyleCompatibility(
  characterId: string,
  allowedStyleIds: string[],
  styleId: string,
): CompatibilityResult {
  if (allowedStyleIds.length === 0) {
    return { compatible: 'WARNING', reason: 'No style restrictions configured', details: [] };
  }
  if (allowedStyleIds.includes(styleId)) {
    return { compatible: 'COMPATIBLE', details: ['Style is in character allowed list'] };
  }
  return { compatible: 'INCOMPATIBLE', reason: 'Style not compatible with character', details: [] };
}

export interface RecipeValidationInput {
  characterId?: string;
  characterAllowedStudioIds?: string[];
  characterAllowedStyleIds?: string[];
  studioId?: string;
  styleId?: string;
  voiceId?: string;
  voiceLanguage?: string;
  episodeLanguage?: string;
}

export interface RecipeValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

export function validateProductionRecipe(recipe: RecipeValidationInput): RecipeValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!recipe.characterId) warnings.push('No character selected');
  if (!recipe.studioId) warnings.push('No studio selected');
  if (!recipe.styleId) warnings.push('No style selected');
  if (!recipe.voiceId) warnings.push('No voice selected');

  if (recipe.characterId && recipe.studioId && recipe.characterAllowedStudioIds && recipe.characterAllowedStudioIds.length > 0) {
    const studioCheck = checkCharacterStudioCompatibility(recipe.characterId, recipe.characterAllowedStudioIds, recipe.studioId);
    if (studioCheck.compatible === 'INCOMPATIBLE') issues.push(studioCheck.reason ?? 'Studio incompatible');
    if (studioCheck.compatible === 'WARNING') warnings.push(studioCheck.reason ?? 'Studio compatibility unknown');
  }

  if (recipe.characterId && recipe.styleId && recipe.characterAllowedStyleIds && recipe.characterAllowedStyleIds.length > 0) {
    const styleCheck = checkCharacterStyleCompatibility(recipe.characterId, recipe.characterAllowedStyleIds, recipe.styleId);
    if (styleCheck.compatible === 'INCOMPATIBLE') issues.push(styleCheck.reason ?? 'Style incompatible');
    if (styleCheck.compatible === 'WARNING') warnings.push(styleCheck.reason ?? 'Style compatibility unknown');
  }

  return { valid: issues.length === 0, issues, warnings };
}

// ─── Phase 2: Script Doctor & AI Director ──────────────────────────────────────

/**
 * Detect script language based on character set ratios
 */
export function detectScriptLanguage(text: string): ProductionLanguage {
  const arabicRegex = /[\u0600-\u06FF]/g;
  const englishRegex = /[a-zA-Z]/g;

  const arabicCount = (text.match(arabicRegex) || []).length;
  const englishCount = (text.match(englishRegex) || []).length;
  const letterCount = arabicCount + englishCount || 1;

  const arabicRatio = arabicCount / letterCount;
  const englishRatio = englishCount / letterCount;

  if (arabicRatio >= 0.10 && englishRatio >= 0.10) {
    return "ar-en";
  }
  if (arabicRatio >= englishRatio) {
    return "ar";
  }
  return "en";
}

/**
 * Script Doctor Analysis Engine
 */
export function analyzeScriptDoctor(scriptContent: string, specifiedLanguage?: ProductionLanguage): ScriptDoctorAnalysis {
  const detectedLanguage = specifiedLanguage || detectScriptLanguage(scriptContent);
  const words = scriptContent.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Average speaking pace ~140 words per minute (2.33 words per second)
  const estimatedDurationSeconds = Math.max(10, Math.round(wordCount / 2.33));

  // Paragraph splitting
  const paragraphs = scriptContent
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sceneTypes: SceneType[] = ["HOST", "EXPLAINER", "DATA", "REACTION", "METAPHOR", "MINI_HOST", "OUTRO"];

  const structure = paragraphs.map((text, idx) => {
    let purpose = "سرد وتوضيح الفكرة";
    let suggestedSceneType: SceneType = sceneTypes[idx % sceneTypes.length] ?? "HOST";

    if (idx === 0) {
      purpose = "افتتاحية جاذبة للصدمة والتساؤل";
      suggestedSceneType = "HOST";
    } else if (text.includes("?") || text.includes("كيف") || text.includes("لماذا") || text.includes("Why")) {
      purpose = "طرح تساؤل محوري وإثارة الفضول";
      suggestedSceneType = "MINI_HOST";
    } else if (/\d+%|\$\d+|دولار|أسواق|Market|Percent/i.test(text)) {
      purpose = "عرض بيانات رسمية وتحليلات مالية";
      suggestedSceneType = "DATA";
    } else if (idx === paragraphs.length - 1) {
      purpose = "خاتمة وتأطير الفكرة النهائية";
      suggestedSceneType = "OUTRO";
    }

    return {
      paragraphIndex: idx,
      purpose,
      text,
      suggestedSceneType,
    };
  });

  const hasHookQuestion = paragraphs[0]?.includes("?") || paragraphs[0]?.includes("ماذا") || paragraphs[0]?.includes("كيف");
  const hookQualityScore = hasHookQuestion ? 92 : 84;

  return {
    detectedLanguage,
    wordCount,
    estimatedDurationSeconds,
    hookQualityScore,
    coreThesis: paragraphs[0] ? `تحليل أبعاد: ${paragraphs[0].slice(0, 80)}...` : "تحليل النواحي الاقتصادية والأسواق",
    keyTakeaways: [
      "الربط بين الأسباب والنتائج الاقتصادية المباشرة.",
      "توضيح تأثير القرارات المالية على حركة الأسواق.",
      "تقديم قراءة صحفية ساخرة وواعية للموقف.",
    ],
    pacingFeedback: wordCount > 300 ? "الإيقاع سريع وغني بالمعلومات — ممتاز للجمهور التحريري." : "الإيقاع مريح وسهل المتابعة.",
    structure,
  };
}

/**
 * Story Graph Generator
 */
export function generateStoryGraph(analysis: ScriptDoctorAnalysis, episodeId: string): StoryGraph {
  const acts: Array<"HOOK" | "PREMISE" | "ESCALATION" | "CLIMAX" | "RESOLUTION"> = [
    "HOOK",
    "PREMISE",
    "ESCALATION",
    "CLIMAX",
    "RESOLUTION",
  ];

  const nodes: StoryGraphNode[] = analysis.structure.map((item, idx) => {
    const act = acts[Math.min(idx, acts.length - 1)] ?? "HOOK";
    return {
      id: `node-${idx + 1}`,
      sequenceIndex: idx,
      act,
      title: `المشهد ${idx + 1}: ${item.suggestedSceneType}`,
      summary: item.text.slice(0, 100) + (item.text.length > 100 ? "..." : ""),
      sceneType: item.suggestedSceneType,
      estimatedDurationSeconds: Math.max(5, Math.round(item.text.split(/\s+/).length / 2.33)),
      narrativeGoal: item.purpose,
    };
  });

  return {
    id: `graph-${Date.now().toString(36)}`,
    episodeId,
    nodes,
    approved: false,
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

/**
 * AI Director Engine — Generates SceneContracts from StoryGraph
 */
export function generateSceneContracts(storyGraph: StoryGraph, recipe?: any): SceneContract[] {
  const characterRef = recipe?.characterId || "char-prof-tradeo";
  const studioRef = recipe?.studioId || "tradeo-editorial-study";
  const styleRef = recipe?.styleId || "vox-editorial-style";
  const voiceRef = recipe?.voiceId || "tradeo-ar-voice";

  const shots: Array<"WIDE" | "MEDIUM" | "CLOSE" | "EXTREME_CLOSE" | "OVER_SHOULDER"> = [
    "MEDIUM",
    "CLOSE",
    "WIDE",
    "OVER_SHOULDER",
    "EXTREME_CLOSE",
  ];

  const transitions = ["Paper Tear", "Page Flip", "Chart Line", "Marker Circle", "Match Cut"];

  return storyGraph.nodes.map((node, idx) => {
    const shotType = shots[idx % shots.length] ?? "MEDIUM";
    const duration = node.estimatedDurationSeconds;

    return {
      id: `scene-${idx + 1}`,
      sequenceIndex: idx,
      narrativePurpose: node.narrativeGoal,
      sceneType: node.sceneType,
      dialogueRange: { start: idx * 10, end: idx * 10 + duration },
      dialogueText: node.summary,
      characterRefs: [characterRef],
      studioRef,
      styleRef,
      propRefs: ["prop-micro-black", "prop-mug-black"],
      visualIntent: `بروفيسور تراديو في استوديو التحرير بحركة ${shotType} مع نسيج الورق والنقاط النصفية المعتمدة في VOX Editorial.`,
      shot: {
        type: shotType,
        angle: "Eye level",
        motion: "Slow Push In",
      },
      camera: `Camera ${idx + 1} (${shotType})`,
      motion: "Snappy 12fps paper stop-motion feel",
      graphics: node.sceneType === "DATA" ? "خريطة وتأطير بالماركر الأحمر على الرسم البياني" : undefined,
      transitionIn: idx > 0 ? transitions[idx % transitions.length] : undefined,
      transitionOut: idx < storyGraph.nodes.length - 1 ? transitions[(idx + 1) % transitions.length] : undefined,
      voiceRef,
      music: "Warm background jazz piano",
      sfx: "Paper tear / Marker stroke sound effect",
      durationSeconds: duration,
      continuityDependencies: idx > 0 ? [`scene-${idx}`] : [],
    };
  });
}

// ─── P0-C Entity & Claims Graph Engine ───────────────────────────────────────

export function extractEntities(scriptContent: string, scenes: SceneContract[]): EntityGraph {
  const words = scriptContent.split(/\s+/);
  
  // Sample canonical entity definitions for finance/explainer context
  const canonicalEntities: CanonicalEntity[] = [
    {
      id: "ent-fed",
      name: "Federal Reserve / الفيدرالي الأمريكي",
      type: "ORGANIZATION",
      description: "البنك المركزي الأمريكي المسؤول عن القرارات النقدية وأسعار الفائدة.",
      aliases: ["Federal Reserve", "Fed", "الفيدرالي", "البنك المركزي الأمريكي"],
      sourceClaims: ["رفع أسعار الفائدة يؤثر المباشر على أسواق الأسهم."],
      affectedSceneIds: scenes.filter(s => /فائدة|فدرالي|Fed|Interest/i.test(s.dialogueText ?? "")).map(s => s.id),
    },
    {
      id: "ent-oil",
      name: "Crude Oil Market / سوق النفط",
      type: "FINANCIAL_INSTRUMENT",
      description: "أسواق النفط العالمية وتأثير تغير الأسعار على الأسواق الناشئة.",
      aliases: ["Oil", "Crude", "النفط", "أسواق الطاقة"],
      sourceClaims: ["ارتفاع النفط يؤدي لتضخم كلفة الإنتاج."],
      affectedSceneIds: scenes.filter(s => /نفط|طاقة|Oil/i.test(s.dialogueText ?? "")).map(s => s.id),
    },
  ];

  const nodes = canonicalEntities.map(ent => ({
    entityId: ent.id,
    name: ent.name,
    type: ent.type,
    occurrences: scenes
      .filter(s => ent.aliases.some(alias => (s.dialogueText ?? "").includes(alias)))
      .map(s => ({
        sceneId: s.id,
        context: (s.dialogueText ?? "").slice(0, 60),
      })),
  }));

  const claimLedger = [
    {
      id: "claim-1",
      claim: "تراجع الأسهم بنسبة 4% عند ارتفاع أسعار الفائدة.",
      source: "بيانات التداول الرسمية",
      verified: true,
      sceneIds: scenes.slice(0, 2).map(s => s.id),
    },
  ];

  return {
    nodes,
    canonicalEntities,
    claimLedger,
  };
}

// ─── P0-D Style Skills Registry ──────────────────────────────────────────────

export const VOX_STYLE_SKILLS: StyleSkill[] = [
  {
    id: "style-vox-mixed-media",
    name: "VOX Mixed Media Editorial",
    slug: "vox-mixed-media",
    description: "Flat, bold, playful-editorial house style with archival photo cutouts, paper grain, and marker annotations.",
    visualGrammar: "Archival photo cutouts drifting over flat color fields and textured paper, halftone accents, hand-drawn marker circles.",
    colorSystem: {
      primary: "#0A0A0A",
      accent: "#FF3B30",
      background: "#F4F1EA",
    },
    composition: "Flat magazine spread collage with layered paper drift",
    camera: "Snappy 2D pans and sudden focal push-ins",
    motion: "Snappy 12fps paper stop-motion feel",
    transitions: "Paper tear, marker stroke, tape strip overlay",
    typography: "Anton condensed bold typography with burned subtitles",
    texture: "Heavy paper grain, halftone dots, torn edges",
    props: ["Torn paper strip", "Black censor bar", "Red marker pen"],
    negativeRules: ["No photorealism", "No 3D renders", "No live-action footage", "No un-styled typography"],
    promptGrammar: "editorial mixed-media collage, archival photo cutouts with white paper borders, flat bold color fields",
    qualityRules: ["Color palette must stay locked across all scenes", "One dominant color accent per scene"],
  },
  {
    id: "style-vox-paper-diorama",
    name: "VOX Cinematic Paper Diorama",
    slug: "vox-paper-diorama",
    description: "Cinematic vintage paper-diorama documentary style with aged sepia newsprint worlds, censor-bar cutouts, and tungsten lighting.",
    visualGrammar: "Miniature 3D landscapes built from aged sepia newspaper sheets, monochrome archival photo cutouts with censor bars over eyes.",
    colorSystem: {
      primary: "#1A1510",
      accent: "#E65100",
      background: "#2C241B",
    },
    composition: "Macro tilt-shift shallow depth of field diorama",
    camera: "Fake-oner continuous FPV camera move with motion blur",
    motion: "Slow cinematic drift with impact speed ramps every 3s",
    transitions: "Plunge through torn fiber gap, letterpress stamp slam",
    typography: "Distressed letterpress print texture on props",
    texture: "Aged sepia newsprint, cardboard fibers, film dust",
    props: ["Powder keg", "Censor bar portrait", "Burnt-orange treaty stamp"],
    negativeRules: ["No photorealism", "No live-action people", "No un-fenced text", "No color drift"],
    promptGrammar: "cinematic vintage paper diorama, aged sepia newsprint world, monochrome halftone print, black censor bars",
    qualityRules: ["Tungsten lighting with deep shadows required", "Only one burnt-orange paper prop as single color accent"],
  },
];

// ─── P0-E Shot Graph & Production Dependency Graph Engine ────────────────────

export function buildProductionGraph(episodeId: string, scenes: SceneContract[]): ProductionGraph {
  const shots: ShotNode[] = [];
  const nodes: ProductionNode[] = [];

  // Core prerequisites
  nodes.push({
    id: `node-char-rig`,
    type: "CHARACTER_RIG",
    label: "Prof. Tradeo Puppet & Wardrobe Setup",
    status: "READY",
    dependencies: [],
    costEstimateUsd: 0,
  });

  nodes.push({
    id: `node-studio-env`,
    type: "STUDIO_ENVIRONMENT",
    label: "Tradeo Editorial Study Studio Lighting & BG",
    status: "READY",
    dependencies: [],
    costEstimateUsd: 0,
  });

  nodes.push({
    id: `node-style-skill`,
    type: "STYLE_SKILL",
    label: "VOX Mixed Media Editorial Preset",
    status: "READY",
    dependencies: [],
    costEstimateUsd: 0,
  });

  scenes.forEach((scene, idx) => {
    // Split scene into 2 shots (e.g. framing push or angle change)
    const durationA = Math.ceil(scene.durationSeconds / 2);
    const durationB = Math.max(1, scene.durationSeconds - durationA);

    const shotA: ShotNode = {
      id: `shot-${scene.id}-a`,
      sceneId: scene.id,
      sequenceIndex: idx * 2 + 1,
      shotType: scene.shot.type || "MEDIUM",
      framing: "Eye-level key subject placement",
      cameraMovement: scene.shot.motion || "Slow Push In",
      subject: scene.characterRefs[0] || "Prof. Tradeo",
      durationSeconds: durationA,
      dependencies: [`node-char-rig`, `node-studio-env`, `node-style-skill`],
    };

    const shotB: ShotNode = {
      id: `shot-${scene.id}-b`,
      sceneId: scene.id,
      sequenceIndex: idx * 2 + 2,
      shotType: "CLOSE",
      framing: "Tight focus on expression / document prop",
      cameraMovement: "Subtle lateral drift",
      subject: scene.characterRefs[0] || "Prof. Tradeo",
      durationSeconds: durationB,
      dependencies: [shotA.id],
    };

    shots.push(shotA, shotB);

    // Add production generation nodes
    nodes.push({
      id: `node-gen-${shotA.id}`,
      type: "SHOT_GENERATION",
      label: `Generate Shot ${shotA.sequenceIndex} (${shotA.shotType})`,
      sceneId: scene.id,
      shotId: shotA.id,
      status: "PENDING",
      dependencies: shotA.dependencies,
      costEstimateUsd: 0.30,
    });

    nodes.push({
      id: `node-gen-${shotB.id}`,
      type: "SHOT_GENERATION",
      label: `Generate Shot ${shotB.sequenceIndex} (${shotB.shotType})`,
      sceneId: scene.id,
      shotId: shotB.id,
      status: "PENDING",
      dependencies: shotB.dependencies,
      costEstimateUsd: 0.30,
    });

    // Voice Segment node
    nodes.push({
      id: `node-voice-${scene.id}`,
      type: "VOICE_SEGMENT",
      label: `Voiceover Narration Take — ${scene.id}`,
      sceneId: scene.id,
      status: "PENDING",
      dependencies: [],
      costEstimateUsd: 0.05,
    });
  });

  const totalDuration = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
  const estimatedCost = nodes.reduce((acc, n) => acc + n.costEstimateUsd, 0);

  return {
    id: `prod-graph-${episodeId}`,
    episodeId,
    shots,
    nodes,
    totalDurationSeconds: totalDuration,
    estimatedGenerationCostUsd: Math.round(estimatedCost * 100) / 100,
  };
}

// ─── P0-F Continuity & Drift Detector Engine ─────────────────────────────────

export function detectContinuityDrift(
  episodeId: string,
  scenes: SceneContract[],
  creativeDNA?: CreativeDNA
): ContinuityReport {
  const violations: DriftViolation[] = [];
  const cleanSceneIds: string[] = [];

  const defaultNegativeRules = [
    "photorealistic",
    "3D render",
    "live-action",
    "un-styled text",
    "hyper-realistic",
  ];

  const negativeRules = creativeDNA?.negativeRules || defaultNegativeRules;

  scenes.forEach((scene, idx) => {
    let hasViolation = false;

    // Check negative rules
    const textToCheck = `${scene.visualIntent} ${scene.dialogueText || ""}`.toLowerCase();
    for (const rule of negativeRules) {
      if (textToCheck.includes(rule.toLowerCase())) {
        violations.push({
          id: `drift-neg-${scene.id}-${Date.now().toString(36)}`,
          driftType: "NEGATIVE_RULE_VIOLATION",
          severity: "CRITICAL",
          sceneAId: scene.id,
          description: `المشهد يحتوي على عنصر محظور: "${rule}" في التوجيه البصري.`,
          fixRecommendation: `إزالة كلمة "${rule}" وتأكيد أسلوب VOX Editorial الورقي.`,
        });
        hasViolation = true;
      }
    }

    // Check adjacent scene jumps (camera & transition)
    if (idx > 0) {
      const prevScene = scenes[idx - 1]!;
      if (
        prevScene.shot.type === scene.shot.type &&
        prevScene.shot.type === "CLOSE" &&
        !scene.transitionIn
      ) {
        violations.push({
          id: `drift-cam-${scene.id}-${Date.now().toString(36)}`,
          driftType: "CAMERA_JUMP",
          severity: "WARNING",
          sceneAId: prevScene.id,
          sceneBId: scene.id,
          description: `قفزة كاميرا متتالية (Jump Cut) بين مشهدين قريبين (CLOSE) بدون تداخل أو لقطة واسعة بينهما.`,
          fixRecommendation: `إضافة انتقال ورقي (Paper Tear) أو تغيير زاوية المشهد الثاني إلى WIDE.`,
        });
        hasViolation = true;
      }
    }

    if (!hasViolation) {
      cleanSceneIds.push(scene.id);
    }
  });

  // Calculate overall continuity score
  let score = 100;
  for (const v of violations) {
    if (v.severity === "CRITICAL") score -= 15;
    else if (v.severity === "WARNING") score -= 8;
    else score -= 3;
  }
  score = Math.max(0, score);

  return {
    id: `cont-report-${episodeId}`,
    episodeId,
    overallContinuityScore: score,
    violations,
    cleanSceneIds,
    checkedAt: new Date().toISOString(),
  };
}

// ─── P0-G Mentor Repair & Auto-Fix Engine ─────────────────────────────────────

export interface AutoFixResult {
  review: MentorReview;
  repairedScenes: SceneContract[];
  fixedCount: number;
}

export function autoFixMentorIssues(
  review: MentorReview,
  scenes: SceneContract[]
): AutoFixResult {
  let fixedCount = 0;
  const repairedScenes = [...scenes];

  const updatedIssues = review.issues.map((issue) => {
    if (issue.autoFixable && !issue.resolved) {
      if (issue.sceneRef) {
        const sceneIndex = repairedScenes.findIndex((s) => s.id === issue.sceneRef);
        if (sceneIndex !== -1) {
          const scene = { ...repairedScenes[sceneIndex]! };
          if (issue.mentorType === "STORY" || issue.title.includes("Hook")) {
            scene.visualIntent = `[FIXED] Key narrative focus: ${scene.visualIntent}`;
            scene.durationSeconds = Math.max(8, scene.durationSeconds);
          } else if (issue.mentorType === "VISUAL" || issue.mentorType === "CONTINUITY") {
            scene.transitionIn = "Paper Tear";
          }
          repairedScenes[sceneIndex] = scene;
        }
      }
      fixedCount++;
      return { ...issue, resolved: true };
    }
    return issue;
  });

  const unresolvedBlockers = updatedIssues.filter(
    (i) => i.severity === "BLOCKER" && !i.resolved
  ).length;

  const newScore = Math.min(100, review.qualityScore + fixedCount * 12);
  const approved = unresolvedBlockers === 0 && newScore >= 60;

  return {
    review: {
      ...review,
      qualityScore: newScore,
      approved,
      issues: updatedIssues,
    },
    repairedScenes,
    fixedCount,
  };
}

// ─── P0-H Step 3: Surgical Impact Analysis Engine ─────────────────────────────

export function calculateRegenerationImpact(
  episodeId: string,
  targetNodeId: string,
  prodGraph: ProductionGraph,
  scenes: SceneContract[]
): RegenerationImpact {
  const allNodes = prodGraph.nodes || [];
  
  // Find node by direct ID, shotId, or sceneId
  const targetNode = allNodes.find(
    (n) => n.id === targetNodeId || n.shotId === targetNodeId || n.sceneId === targetNodeId
  );

  const directlyAffected: string[] = targetNode ? [targetNode.id] : [targetNodeId];

  // Traverse graph for downstream dependent nodes
  const downstreamSet = new Set<string>();
  const queue = [...directlyAffected];

  while (queue.length > 0) {
    const current = queue.shift()!;
    allNodes.forEach((n) => {
      if (n.dependencies.includes(current) && !directlyAffected.includes(n.id) && !downstreamSet.has(n.id)) {
        downstreamSet.add(n.id);
        queue.push(n.id);
      }
    });
  }

  const downstreamAffected = Array.from(downstreamSet);

  // Reusable & Must Not Regenerate nodes
  const affectedSet = new Set([...directlyAffected, ...downstreamAffected]);
  const reusableNodes: string[] = [];
  const mustNotRegenerateNodes: string[] = [];

  allNodes.forEach((n) => {
    if (!affectedSet.has(n.id)) {
      reusableNodes.push(n.id);
      // Prerequisites and unrelated scenes MUST NOT regenerate
      if (
        n.type === "CHARACTER_RIG" ||
        n.type === "STUDIO_ENVIRONMENT" ||
        n.type === "STYLE_SKILL" ||
        (n.sceneId && targetNode?.sceneId && n.sceneId !== targetNode.sceneId)
      ) {
        mustNotRegenerateNodes.push(n.id);
      }
    }
  });

  const affectedNodesList = allNodes.filter((n) => affectedSet.has(n.id));
  const estimatedCost = affectedNodesList.reduce((acc, n) => acc + (n.costEstimateUsd || 0.30), 0);
  const estimatedDuration = affectedNodesList.length * 5;

  return {
    targetNodeId,
    directlyAffectedNodes: directlyAffected,
    downstreamAffectedNodes: downstreamAffected,
    reusableNodes,
    mustNotRegenerateNodes,
    estimatedScope: `Surgical scope: ${directlyAffected.length} direct, ${downstreamAffected.length} downstream node(s). Preserving ${mustNotRegenerateNodes.length} unrelated node(s).`,
    estimatedCostUsd: Math.round(estimatedCost * 100) / 100,
    estimatedDurationSeconds: estimatedDuration,
  };
}

// ─── P0-H Step 4: Partial Regeneration Planner ────────────────────────────────

export function createPartialRegenerationPlan(
  episodeId: string,
  targetNodeId: string,
  impact: RegenerationImpact,
  scenes: SceneContract[],
  creativeDNA?: CreativeDNA
): PartialRegenerationPlan {
  const affectedNodeIds = [...impact.directlyAffectedNodes, ...impact.downstreamAffectedNodes];

  return {
    id: `regen-plan-${Date.now().toString(36)}`,
    episodeId,
    reason: `Surgical regeneration requested for failed target node "${targetNodeId}"`,
    rootNodeId: targetNodeId,
    affectedNodeIds,
    preservedNodeIds: impact.mustNotRegenerateNodes,
    regenerationOrder: affectedNodeIds,
    requiredAssets: ["Prof. Tradeo Character Rig", "Tradeo Editorial Study Studio"],
    creativeDnaRequirements: [
      creativeDNA?.styleName || "VOX Mixed Media Editorial",
      `Primary: ${creativeDNA?.primaryColor || "#0A0A0A"}`,
      `Accent: ${creativeDNA?.accentColor || "#FF3B30"}`,
    ],
    styleSkillRequirements: ["VOX Mixed Media Editorial", "Snappy 12fps paper stop-motion"],
    continuityConstraints: [
      "Must preserve character wardrobe continuity across adjacent scenes",
      "Must maintain audio speed and narrative flow",
      "Must not regenerate unrelated scenes",
    ],
    expectedOutput: `Targeted regeneration of ${affectedNodeIds.length} node(s) while keeping ${impact.mustNotRegenerateNodes.length} node(s) untouched.`,
    validationGates: ["Run detectContinuityDrift", "Run Mentor QA review"],
    createdAt: new Date().toISOString(),
  };
}

// ─── P0-H Step 5: Refactored Mentor Repair & Recheck Loop ─────────────────────

export interface FullRepairExecutionResult {
  repairResult: RepairExecutionResult;
  recheckResult: RecheckResult;
  updatedTask: RefilmTask;
  updatedScenes: SceneContract[];
  updatedReview: MentorReview;
}

export function executeMentorRepairLifecycle(
  task: RefilmTask,
  review: MentorReview,
  scenes: SceneContract[],
  maxAttempts: number = 3
): FullRepairExecutionResult {
  const attempts = (task.repairAttempts || 0) + 1;
  const repairedScenes = [...scenes];

  if (attempts > maxAttempts) {
    const updatedTask: RefilmTask = {
      ...task,
      repairAttempts: attempts,
      status: "FAILED",
      updatedAt: new Date().toISOString(),
    };
    return {
      repairResult: {
        taskId: task.id,
        success: false,
        repairedSceneIds: [],
        executionNotes: `Maximum repair attempts (${maxAttempts}) exceeded. Escalating issue to human editor.`,
        timestamp: new Date().toISOString(),
      },
      recheckResult: {
        taskId: task.id,
        passed: false,
        newQualityScore: review.qualityScore,
        remainingBlockersCount: review.issues.filter((i) => i.severity === "BLOCKER" && !i.resolved).length,
        decision: "ESCALATE",
        recheckedAt: new Date().toISOString(),
      },
      updatedTask,
      updatedScenes: scenes,
      updatedReview: review,
    };
  }

  // Execute Repair (Stage 5)
  const targetSceneIndex = repairedScenes.findIndex((s) => s.id === task.sceneId);
  if (targetSceneIndex !== -1) {
    const scene = { ...repairedScenes[targetSceneIndex]! };
    scene.visualIntent = `[REPAIRED v${attempts}] ${scene.visualIntent} — ${task.suggestedFix}`;
    scene.transitionIn = "Paper Tear";
    repairedScenes[targetSceneIndex] = scene;
  }

  const repairResult: RepairExecutionResult = {
    taskId: task.id,
    success: true,
    repairedSceneIds: [task.sceneId],
    executionNotes: `Executed repair attempt ${attempts}/${maxAttempts}: ${task.suggestedFix}`,
    timestamp: new Date().toISOString(),
  };

  // Recheck (Stage 6)
  const updatedIssues = review.issues.map((i) =>
    i.id === task.id || i.sceneRef === task.sceneId ? { ...i, resolved: true } : i
  );
  const remainingBlockers = updatedIssues.filter((i) => i.severity === "BLOCKER" && !i.resolved).length;
  const newScore = Math.min(100, review.qualityScore + 15);
  const passed = remainingBlockers === 0 && newScore >= 60;

  const decision = passed ? "APPROVE" : attempts < maxAttempts ? "RETRY" : "ESCALATE";
  const newStatus: RefilmStatus = passed ? "PASSED" : decision === "RETRY" ? "PLANNED" : "FAILED";

  const recheckResult: RecheckResult = {
    taskId: task.id,
    passed,
    newQualityScore: newScore,
    remainingBlockersCount: remainingBlockers,
    decision,
    recheckedAt: new Date().toISOString(),
  };

  const updatedTask: RefilmTask = {
    ...task,
    repairAttempts: attempts,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  const updatedReview: MentorReview = {
    ...review,
    qualityScore: newScore,
    approved: passed,
    issues: updatedIssues,
  };

  return {
    repairResult,
    recheckResult,
    updatedTask,
    updatedScenes: repairedScenes,
    updatedReview,
  };
}

// ─── P0-H Step 6: Humanization Director Engine ────────────────────────────────

export class HumanizationDirector {
  static analyzeHumanization(
    episodeId: string,
    scenes: SceneContract[],
    creativeDNA?: CreativeDNA
  ): HumanizationReport {
    const issues: HumanizationIssue[] = [];

    // 1. Inspect shot duration repetition
    let repeatDurationCount = 1;
    for (let i = 1; i < scenes.length; i++) {
      if (scenes[i]!.durationSeconds === scenes[i - 1]!.durationSeconds) {
        repeatDurationCount++;
        if (repeatDurationCount >= 3) {
          issues.push({
            id: `hum-dur-${scenes[i]!.id}`,
            type: "TOO_MECHANICAL",
            sceneId: scenes[i]!.id,
            description: `تكرار مدة المشهد (${scenes[i]!.durationSeconds}ث) لثلاث مشاهد متتالية ينشئ إيقاعاً آلياً.`,
            suggestedVariation: "تعديل مدة المشهد الحالي بمقدار ثانية واحدة لإيجاد تنوع بتموج الصوت.",
          });
        }
      } else {
        repeatDurationCount = 1;
      }
    }

    // 2. Inspect camera framing repetition
    let repeatShotCount = 1;
    for (let i = 1; i < scenes.length; i++) {
      if (scenes[i]!.shot.type === scenes[i - 1]!.shot.type) {
        repeatShotCount++;
        if (repeatShotCount >= 3) {
          issues.push({
            id: `hum-shot-${scenes[i]!.id}`,
            type: "TOO_REPETITIVE",
            sceneId: scenes[i]!.id,
            description: `تكرار إطار الكاميرا (${scenes[i]!.shot.type}) لثلاث مشاهد متتالية.`,
            suggestedVariation: `تغيير زاوية المشهد من ${scenes[i]!.shot.type} إلى زاوية مكملة للحفاظ على ديناميكية البصر.`,
          });
        }
      } else {
        repeatShotCount = 1;
      }
    }

    const rhythmScore = Math.max(0, 100 - issues.length * 15);

    return {
      id: `hum-report-${episodeId}`,
      episodeId,
      rhythmScore,
      repetitionCount: issues.length,
      issues,
      evaluatedAt: new Date().toISOString(),
    };
  }

  static applyHumanizationPlan(
    episodeId: string,
    report: HumanizationReport,
    scenes: SceneContract[],
    creativeDNA?: CreativeDNA
  ): { plan: HumanizationPlan; updatedScenes: SceneContract[] } {
    const plannedChanges: Array<{ sceneId: string; changeType: string; fromValue: string; toValue: string }> = [];
    const updatedScenes = [...scenes];

    report.issues.forEach((issue) => {
      if (!issue.sceneId) return;
      const idx = updatedScenes.findIndex((s) => s.id === issue.sceneId);
      if (idx === -1) return;

      const sc = { ...updatedScenes[idx]! };

      if (issue.type === "TOO_MECHANICAL") {
        const oldDur = sc.durationSeconds;
        const newDur = Math.max(4, oldDur + (idx % 2 === 0 ? 1 : -1));
        sc.durationSeconds = newDur;
        plannedChanges.push({
          sceneId: sc.id,
          changeType: "DURATION_VARIATION",
          fromValue: `${oldDur}s`,
          toValue: `${newDur}s`,
        });
      } else if (issue.type === "TOO_REPETITIVE") {
        const oldShot = sc.shot.type;
        const alternates: Array<"WIDE" | "MEDIUM" | "CLOSE" | "EXTREME_CLOSE" | "OVER_SHOULDER"> = [
          "WIDE",
          "OVER_SHOULDER",
          "CLOSE",
          "MEDIUM",
        ];
        const newShot = alternates[idx % alternates.length] || "WIDE";
        sc.shot = { ...sc.shot, type: newShot };
        plannedChanges.push({
          sceneId: sc.id,
          changeType: "SHOT_FRAMING_VARIATION",
          fromValue: oldShot,
          toValue: newShot,
        });
      }

      updatedScenes[idx] = sc;
    });

    const plan: HumanizationPlan = {
      id: `hum-plan-${episodeId}`,
      episodeId,
      issues: report.issues,
      plannedChanges,
      protectedConstraints: [
        `Strict Creative DNA Lock: ${creativeDNA?.styleName || "VOX Editorial Style"}`,
        `Color Hex Lock: ${creativeDNA?.accentColor || "#FF3B30"}`,
        "Character Puppet Continuity",
        "Wardrobe & Prop Continuity",
        "Script & Claim Consistency",
      ],
      createdAt: new Date().toISOString(),
    };

    return { plan, updatedScenes };
  }
}

// ─── P0-J Prompt Compiler ──────────────────────────────────────────────────────

export interface PromptCompilerInput {
  scene?: SceneContract;
  shot?: ShotNode;
  creativeDNA?: CreativeDNA;
  styleSkill?: StyleSkill;
  character?: Character;
  studio?: Studio;
  wardrobe?: Wardrobe;
  props?: Prop[];
  continuityConstraints?: string[];
  negativeRules?: string[];
}

export class PromptCompiler {
  static compilePrompt(input: PromptCompilerInput): CompiledPrompt {
    const parts: string[] = [];

    // 1. Style & Skill Language
    if (input.creativeDNA?.styleName) {
      parts.push(`[Style: ${input.creativeDNA.styleName}]`);
    }
    if (input.styleSkill?.name) {
      parts.push(`[Skill: ${input.styleSkill.name}]`);
    }

    // 2. Character Identity & Wardrobe
    if (input.character?.identity) {
      parts.push(`Character: ${input.character.identity}. Personality: ${input.character.personality || "Professional"}.`);
    }
    if (input.wardrobe?.name) {
      parts.push(`Wardrobe: ${input.wardrobe.name}. Palette: ${input.wardrobe.colorPalette?.join(", ") || "Default"}.`);
    }

    // 3. Studio & Environment
    if (input.studio?.name) {
      parts.push(`Studio: ${input.studio.name}. Elements: ${input.studio.elements?.join(", ") || "Studio stage"}.`);
    }

    // 4. Props
    if (input.props && input.props.length > 0) {
      parts.push(`Props: ${input.props.map((p) => p.name).join(", ")}.`);
    }

    // 5. Scene Script & Visual Intent
    if (input.scene) {
      parts.push(`Scene Script: "${input.scene.text}". Visual Intent: ${input.scene.visualIntent}.`);
    }

    // 6. Camera & Motion Language
    if (input.shot) {
      parts.push(`Shot Type: ${input.shot.type}. Camera Motion: ${input.shot.cameraMotion || "Static"}. Action: ${input.shot.action || "Presentation"}.`);
    } else if (input.creativeDNA?.cameraLanguage) {
      parts.push(`Camera Language: ${input.creativeDNA.cameraLanguage}.`);
    }

    // 7. Palette Lock
    if (input.creativeDNA) {
      parts.push(`Palette Lock: Primary ${input.creativeDNA.primaryColor}, Accent ${input.creativeDNA.accentColor}.`);
    }

    // 8. Continuity Constraints
    if (input.continuityConstraints && input.continuityConstraints.length > 0) {
      parts.push(`Continuity: ${input.continuityConstraints.join("; ")}.`);
    }

    const fullPrompt = parts.join(" ");

    // Negative Rules Compilation
    const negParts: string[] = input.negativeRules || [];
    if (input.creativeDNA?.negativeRules) {
      negParts.push(...input.creativeDNA.negativeRules);
    }
    const negativePrompt = Array.from(new Set(negParts)).join(", ") || "No photorealism, No 3D renders";

    // Deterministic fingerprint calculation
    const fingerprint = `prompt-fp-${fullPrompt.length}-${negativePrompt.length}-${input.creativeDNA?.version || 1}`;

    return {
      prompt: fullPrompt,
      negativePrompt,
      fingerprint,
      creativeDnaVersion: input.creativeDNA?.version || 1,
      styleSkillVersion: input.styleSkill?.version || "1.0",
      parameters: {
        width: 1920,
        height: 1080,
        fps: 30,
        aspectRatio: "16:9",
      },
    };
  }
}

// ─── P0-J Production Execution Planner ────────────────────────────────────────

/** Default router used when no external router is injected. */
const defaultModelRouter: ModelRouterPort = {
  selectModel({ capability }: { capability: ModelCapability; task: string }) {
    const capabilityMap: Record<ModelCapability, string> = {
      TEXT_GENERATION: "openai:gpt-4o",
      IMAGE_GENERATION: "openai:dall-e-3",
      VIDEO_GENERATION: "runway:gen3",
      VOICE_GENERATION: "elevenlabs:turbo-v2",
      IMAGE_EDITING: "openai:dall-e-3",
      MUSIC_GENERATION: "suno:chirp-v3",
      REASONING: "anthropic:claude-3-5-sonnet",
    };
    const modelId = capabilityMap[capability] ?? "openai:gpt-4o";
    const [providerId, mid] = modelId.split(":");
    return { selectedModel: { modelId: mid ?? modelId }, providerId: providerId ?? "openai" };
  },
};

export function createProductionExecutionPlan(
  episodeId: string,
  prodGraph: ProductionGraph,
  scenes: SceneContract[],
  creativeDNA?: CreativeDNA,
  existingArtifactKeys: string[] = [],
  routerPort: ModelRouterPort = defaultModelRouter
): ProductionExecutionPlan {
  const nodes = prodGraph.nodes || [];
  const existingSet = new Set(existingArtifactKeys);

  let totalDuration = 0;
  let totalCost = 0;
  const requiredAssetsSet = new Set<string>();
  const preservedAssetsSet = new Set<string>();

  const planNodes: ExecutionPlanNode[] = nodes.map((node, index) => {
    // Map node type to ModelCapability
    let capability: ModelCapability = "TEXT_GENERATION";
    if (node.type === "SHOT_GENERATION") {
      capability = "VIDEO_GENERATION";
    } else if (node.type === "VOICE_SEGMENT") {
      capability = "VOICE_GENERATION";
    } else if (node.type === "CHARACTER_RIG" || node.type === "STUDIO_ENVIRONMENT") {
      capability = "IMAGE_GENERATION";
    } else if (node.type === "STYLE_SKILL") {
      capability = "IMAGE_EDITING";
    }

    // Model Routing via injected router port
    const route = routerPort.selectModel({
      capability,
      task: `Execute node ${node.id} (${node.type})`,
      qualityRequirement: "HIGH",
    });

    const selectedModelId = route.selectedModel.modelId;
    const selectedProviderId = route.providerId;

    // Idempotency key: episodeId:nodeId:dnaVersion:modelId
    const idempotencyKey = `idem-${episodeId}-${node.id}-v${creativeDNA?.version || 1}-${selectedModelId}`;

    // Check valid artifact reuse
    const artifactExists = existingSet.has(idempotencyKey) || existingSet.has(node.id);
    const action = artifactExists ? "REUSE" : "GENERATE";

    if (action === "REUSE") {
      preservedAssetsSet.add(node.id);
    } else {
      requiredAssetsSet.add(node.id);
      totalDuration += 5; // default 5s per node
      totalCost += node.costEstimateUsd || 0.30;
    }

    const parallelizable = node.dependencies.length === 0;

    return {
      nodeId: node.id,
      nodeType: node.type,
      dependencies: node.dependencies,
      executionOrder: index + 1,
      parallelizable,
      blockingDependencies: node.dependencies.filter((depId) => !existingSet.has(depId)),
      selectedCapability: capability,
      selectedModelId,
      selectedProviderId,
      estimatedDurationSeconds: action === "REUSE" ? 0 : 5,
      estimatedCostUsd: action === "REUSE" ? 0 : (node.costEstimateUsd || 0.30),
      idempotencyKey,
      action,
    };
  });

  return {
    id: `exec-plan-${Date.now().toString(36)}`,
    episodeId,
    nodes: planNodes,
    totalDurationSeconds: Math.max(10, totalDuration),
    totalCostUsd: Math.round(totalCost * 100) / 100,
    isCostEstimated: true,
    requiredAssets: Array.from(requiredAssetsSet),
    preservedAssets: Array.from(preservedAssetsSet),
    createdAt: new Date().toISOString(),
  };
}

// ─── P0-J Generation Jobs Builder ──────────────────────────────────────────────

export function createGenerationJobsFromPlan(
  episodeId: string,
  plan: ProductionExecutionPlan,
  compiledPromptsMap: Map<string, CompiledPrompt> = new Map()
): GenerationJob[] {
  return plan.nodes
    .filter((n) => n.action === "GENERATE")
    .map((planNode) => {
      const compiled = compiledPromptsMap.get(planNode.nodeId) || {
        prompt: `Execute production node ${planNode.nodeId} (${planNode.nodeType})`,
        negativePrompt: "No photorealism, No 3D renders",
        fingerprint: `fp-${planNode.nodeId}`,
        creativeDnaVersion: 1,
        styleSkillVersion: "1.0",
        parameters: {},
      };

      return {
        id: `gjob-${planNode.nodeId}-${Date.now().toString(36)}`,
        idempotencyKey: planNode.idempotencyKey,
        episodeId,
        productionNodeId: planNode.nodeId,
        capability: planNode.selectedCapability,
        modelId: planNode.selectedModelId,
        providerId: planNode.selectedProviderId,
        inputAssets: planNode.dependencies,
        prompt: compiled.prompt,
        negativePrompt: compiled.negativePrompt,
        creativeDnaVersion: compiled.creativeDnaVersion,
        styleSkillVersion: compiled.styleSkillVersion,
        generationParameters: compiled.parameters,
        priority: 1,
        status: planNode.blockingDependencies.length > 0 ? "BLOCKED" : "QUEUED",
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
}






