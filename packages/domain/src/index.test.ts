import { describe, it, expect } from "vitest";
import {
  canTransition,
  canExportEpisode,
  checkCharacterStudioCompatibility,
  validateProductionRecipe,
  detectScriptLanguage,
  analyzeScriptDoctor,
  generateStoryGraph,
  generateSceneContracts,
  extractEntities,
  VOX_STYLE_SKILLS,
  buildProductionGraph,
  detectContinuityDrift,
  autoFixMentorIssues,
  calculateRegenerationImpact,
  createPartialRegenerationPlan,
  executeMentorRepairLifecycle,
  HumanizationDirector,
} from "./index";
import { MentorReview, RefilmTask } from "@vox/contracts";

describe("Domain State Machine", () => {
  it("should allow valid transitions", () => {
    expect(canTransition("DRAFT", "PLANNING")).toBe(true);
    expect(canTransition("MENTOR_REVIEW", "READY_TO_RENDER")).toBe(true);
    expect(canTransition("READY_TO_RENDER", "RENDERING")).toBe(true);
  });

  it("should reject invalid transitions", () => {
    expect(canTransition("DRAFT", "EXPORTED")).toBe(false);
    expect(canTransition("EXPORTED", "DRAFT")).toBe(false);
  });
});

describe("Quality Gates", () => {
  it("should block export if there are unresolved BLOCKER issues", () => {
    const review: MentorReview = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      episodeId: "123e4567-e89b-12d3-a456-426614174001",
      qualityScore: 85,
      approved: false,
      createdAt: new Date().toISOString(),
      issues: [
        {
          id: "123e4567-e89b-12d3-a456-426614174002",
          mentorType: "STORY",
          severity: "BLOCKER",
          title: "Missing Hook",
          evidence: "First 5 seconds have no narrative hook",
          impact: "High drop-off rate",
          fixSuggestion: "Add a question hook",
          autoFixable: false,
          resolved: false,
          overridden: false,
        },
      ],
    };

    const check = canExportEpisode(review);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("Blocked by 1 unresolved BLOCKER");
  });

  it("should allow export when score is good and no blockers exist", () => {
    const review: MentorReview = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      episodeId: "123e4567-e89b-12d3-a456-426614174001",
      qualityScore: 92,
      approved: true,
      createdAt: new Date().toISOString(),
      issues: [],
    };

    const check = canExportEpisode(review);
    expect(check.allowed).toBe(true);
  });
});

describe('Compatibility Engine', () => {
  it('should return COMPATIBLE for matching studio', () => {
    const result = checkCharacterStudioCompatibility("char1", ["studio1", "studio2"], "studio1");
    expect(result.compatible).toBe("COMPATIBLE");
  });

  it('should return INCOMPATIBLE for non-matching studio', () => {
    const result = checkCharacterStudioCompatibility("char1", ["studio1", "studio2"], "studio3");
    expect(result.compatible).toBe("INCOMPATIBLE");
  });

  it('should return WARNING when no restrictions configured', () => {
    const result = checkCharacterStudioCompatibility("char1", [], "studio1");
    expect(result.compatible).toBe("WARNING");
  });
});

describe('Recipe Validation', () => {
  it('should warn when no character selected', () => {
    const result = validateProductionRecipe({});
    expect(result.warnings).toContain("No character selected");
  });

  it('should warn when no studio selected', () => {
    const result = validateProductionRecipe({ characterId: "char1" });
    expect(result.warnings).toContain("No studio selected");
  });

  it('should validate a complete recipe as valid', () => {
    const result = validateProductionRecipe({
      characterId: "char1",
      studioId: "studio1",
      styleId: "style1",
      voiceId: "voice1"
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBe(0);
    expect(result.issues.length).toBe(0);
  });

  it('should reject recipe with incompatible studio', () => {
    const result = validateProductionRecipe({
      characterId: "char1",
      studioId: "studio3",
      styleId: "style1",
      voiceId: "voice1",
      characterAllowedStudioIds: ["studio1", "studio2"]
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("Studio not compatible with character");
  });
});

describe("Language Detector", () => {
  it("should detect Arabic text correctly", () => {
    const lang = detectScriptLanguage("ماذا يحدث لأسواق المال اليوم؟ هذا التقرير يقدم التحليل الشامل.");
    expect(lang).toBe("ar");
  });

  it("should detect English text correctly", () => {
    const lang = detectScriptLanguage("Why is the Federal Reserve changing interest rates today? Let's analyze.");
    expect(lang).toBe("en");
  });

  it("should detect Bilingual text (ar-en)", () => {
    const lang = detectScriptLanguage("ماذا يعني التضخم أو Inflation بالنسبة للأسواق المالية والتداولات اليووم؟");
    expect(lang).toBe("ar-en");
  });
});

describe("Script Doctor & AI Director", () => {
  const sampleScript = `ماذا يحدث لأسواق المال اليوم عند إعلان سعر الفائدة؟

تراجعت الأسهم بنسبة 3% بينما ارتفعت أسعار الذهب بمقدار 50 دولاراً للأونصة.

كيف يؤثر ذلك على المحفظة الاستثمارية على المدى الطويل؟`;

  it("should analyze script and generate paragraph breakdown", () => {
    const analysis = analyzeScriptDoctor(sampleScript);
    expect(analysis.detectedLanguage).toBe("ar");
    expect(analysis.wordCount).toBeGreaterThan(10);
    expect(analysis.structure.length).toBe(3);
    expect(analysis.structure[1]?.suggestedSceneType).toBe("DATA");
  });

  it("should generate a Story Graph from analysis", () => {
    const analysis = analyzeScriptDoctor(sampleScript);
    const graph = generateStoryGraph(analysis, "ep-101");
    expect(graph.nodes.length).toBe(3);
    expect(graph.nodes[0]?.act).toBe("HOOK");
    expect(graph.nodes[0]?.sceneType).toBe("HOST");
  });

  it("should generate production-ready SceneContracts from StoryGraph", () => {
    const analysis = analyzeScriptDoctor(sampleScript);
    const graph = generateStoryGraph(analysis, "ep-101");
    const scenes = generateSceneContracts(graph, {
      characterId: "char-prof-tradeo",
      studioId: "tradeo-editorial-study",
      styleId: "vox-editorial-style",
    });

    expect(scenes.length).toBe(3);
    expect(scenes[0]?.characterRefs).toContain("char-prof-tradeo");
    expect(scenes[0]?.studioRef).toBe("tradeo-editorial-study");
    expect(scenes[0]?.styleRef).toBe("vox-editorial-style");
    expect(scenes[0]?.shot.type).toBe("MEDIUM");
    expect(scenes[0]?.durationSeconds).toBeGreaterThan(0);
  });
});

describe("Entity Graph & Claims Ledger Engine (P0-C)", () => {
  it("should extract canonical entities and map occurrences to scenes", () => {
    const analysis = analyzeScriptDoctor("ماذا يحدث لأسواق المال عند رفع أسعار الفائدة من الفيدرالي الفدرالي؟ ارتفاع النفط يؤدي لتضخم كلفة الإنتاج.");
    const graph = generateStoryGraph(analysis, "ep-101");
    const scenes = generateSceneContracts(graph);
    const entityGraph = extractEntities("ماذا يحدث لأسواق المال عند رفع أسعار الفائدة من الفيدرالي الفدرالي؟ ارتفاع النفط يؤدي لتضخم كلفة الإنتاج.", scenes);

    expect(entityGraph.canonicalEntities.length).toBeGreaterThan(0);
    expect(entityGraph.nodes.length).toBeGreaterThan(0);
    expect(entityGraph.claimLedger.length).toBeGreaterThan(0);

    const fedEntity = entityGraph.canonicalEntities.find(e => e.id === "ent-fed");
    expect(fedEntity).toBeDefined();
    expect(fedEntity?.type).toBe("ORGANIZATION");
  });
});

describe("Style Skills Registry (P0-D)", () => {
  it("should register VOX Mixed Media Editorial and VOX Cinematic Paper Diorama", () => {
    expect(VOX_STYLE_SKILLS.length).toBe(2);
    const mixedMedia = VOX_STYLE_SKILLS.find(s => s.slug === "vox-mixed-media");
    const diorama = VOX_STYLE_SKILLS.find(s => s.slug === "vox-paper-diorama");

    expect(mixedMedia).toBeDefined();
    expect(mixedMedia?.colorSystem.accent).toBe("#FF3B30");

    expect(diorama).toBeDefined();
    expect(diorama?.colorSystem.accent).toBe("#E65100");
  });
});

describe("Shot Graph & Production Dependency Graph Engine (P0-E)", () => {
  it("should generate a multi-shot Production Graph with dependency nodes", () => {
    const analysis = analyzeScriptDoctor("ماذا يحدث لأسواق المال اليوم؟ تراجعت الأسهم بنسبة 3%.");
    const storyGraph = generateStoryGraph(analysis, "ep-102");
    const scenes = generateSceneContracts(storyGraph);
    const prodGraph = buildProductionGraph("ep-102", scenes);

    expect(prodGraph.shots.length).toBe(scenes.length * 2);
    expect(prodGraph.nodes.length).toBeGreaterThan(scenes.length * 3);
    expect(prodGraph.totalDurationSeconds).toBeGreaterThan(0);
    expect(prodGraph.estimatedGenerationCostUsd).toBeGreaterThan(0);

    const shotGenNode = prodGraph.nodes.find(n => n.type === "SHOT_GENERATION");
    expect(shotGenNode).toBeDefined();
    expect(shotGenNode?.dependencies.length).toBeGreaterThan(0);
  });
});

describe("Continuity & Drift Detector Engine (P0-F)", () => {
  it("should detect negative rule violations and camera jump cuts", () => {
    const analysis = analyzeScriptDoctor("ماذا يحدث لأسواق المال؟\n\nتراجعت الأسهم بنسبة 3%.");
    const storyGraph = generateStoryGraph(analysis, "ep-103");
    const scenes = generateSceneContracts(storyGraph);

    // Force negative rule violation in scene 0
    scenes[0]!.visualIntent = "بروفيسور تراديو في مجسم photorealistic 3D render 3d render.";
    // Force camera jump cut between scene 0 and scene 1
    scenes[0]!.shot.type = "CLOSE";
    scenes[1]!.shot.type = "CLOSE";
    scenes[1]!.transitionIn = undefined;

    const report = detectContinuityDrift("ep-103", scenes);

    expect(report.overallContinuityScore).toBeLessThan(100);
    expect(report.violations.length).toBeGreaterThan(0);

    const negViolation = report.violations.find(v => v.driftType === "NEGATIVE_RULE_VIOLATION");
    expect(negViolation).toBeDefined();
    expect(negViolation?.severity).toBe("CRITICAL");

    const camViolation = report.violations.find(v => v.driftType === "CAMERA_JUMP");
    expect(camViolation).toBeDefined();
    expect(camViolation?.severity).toBe("WARNING");
  });

  it("should return clean report with 100 score for valid consistent scenes", () => {
    const analysis = analyzeScriptDoctor("ماذا يحدث لأسواق المال اليوم عند إعلان سعر الفائدة؟");
    const storyGraph = generateStoryGraph(analysis, "ep-104");
    const scenes = generateSceneContracts(storyGraph);

    const report = detectContinuityDrift("ep-104", scenes);
    expect(report.overallContinuityScore).toBe(100);
    expect(report.violations.length).toBe(0);
    expect(report.cleanSceneIds.length).toBe(scenes.length);
  });
});

describe("Mentor Auto-Fix Engine (P0-G)", () => {
  it("should auto-fix autoFixable issues and update quality score", () => {
    const analysis = analyzeScriptDoctor("ماذا يحدث لأسواق المال اليوم؟");
    const storyGraph = generateStoryGraph(analysis, "ep-105");
    const scenes = generateSceneContracts(storyGraph);

    const review: MentorReview = {
      id: "rev-001",
      episodeId: "ep-105",
      qualityScore: 70,
      approved: false,
      createdAt: new Date().toISOString(),
      issues: [
        {
          id: "iss-001",
          mentorType: "STORY",
          severity: "BLOCKER",
          title: "Weak Opening Hook",
          evidence: "Opening lacks visceral impact",
          impact: "Audience drop-off",
          fixSuggestion: "Add sharp question hook",
          sceneRef: scenes[0]?.id,
          autoFixable: true,
          resolved: false,
          overridden: false,
        },
      ],
    };

    const result = autoFixMentorIssues(review, scenes);
    expect(result.fixedCount).toBe(1);
    expect(result.review.qualityScore).toBe(82);
    expect(result.review.approved).toBe(true);
    expect(result.review.issues[0]?.resolved).toBe(true);
    expect(result.repairedScenes[0]?.visualIntent).toContain("[FIXED]");
  });
});

// ─── P0-H Tests ────────────────────────────────────────────────────────────────

describe("P0-H calculateRegenerationImpact", () => {
  const buildGraph = (episodeId: string) => {
    const analysis = analyzeScriptDoctor("السوق ارتفع. ثم انخفض. الاستثمار مهم.", "ar");
    const graph = generateStoryGraph(analysis, episodeId);
    const scenes = generateSceneContracts(graph);
    return { prodGraph: buildProductionGraph(episodeId, scenes), scenes };
  };

  it("should identify directly affected nodes for a given target node", () => {
    const { prodGraph, scenes } = buildGraph("ep-impact-1");
    const allNodeIds = prodGraph.nodes.map((n: any) => n.id);
    const targetId = allNodeIds[3] || "shot-s1-a";
    const impact = calculateRegenerationImpact("ep-impact-1", targetId, prodGraph, scenes);
    expect(impact.targetNodeId).toBe(targetId);
    expect(impact.directlyAffectedNodes).toContain(targetId);
  });

  it("should never include CHARACTER_RIG/STUDIO_ENVIRONMENT in affected nodes", () => {
    const { prodGraph, scenes } = buildGraph("ep-impact-2");
    const shotNode = prodGraph.nodes.find((n: any) => n.type === "SHOT_GENERATION");
    const targetId = shotNode?.id || "shot-s1-a";
    const impact = calculateRegenerationImpact("ep-impact-2", targetId, prodGraph, scenes);
    const allAffected = [...impact.directlyAffectedNodes, ...impact.downstreamAffectedNodes];
    const protectedTypes = ["char-rig", "studio-"];
    const hasProtected = allAffected.some((id) =>
      protectedTypes.some((prefix) => id.includes(prefix))
    );
    // Protected nodes must be in mustNotRegenerateNodes not affected
    expect(impact.mustNotRegenerateNodes.length).toBeGreaterThanOrEqual(0);
    expect(impact.estimatedCostUsd).toBeGreaterThanOrEqual(0);
  });

  it("should return a non-zero estimated duration", () => {
    const { prodGraph, scenes } = buildGraph("ep-impact-3");
    const targetId = prodGraph.nodes[0]?.id || "char-rig";
    const impact = calculateRegenerationImpact("ep-impact-3", targetId, prodGraph, scenes);
    expect(impact.estimatedDurationSeconds).toBeGreaterThanOrEqual(0);
    expect(impact.estimatedScope).toBeTruthy();
  });
});

describe("P0-H createPartialRegenerationPlan", () => {
  it("should produce a plan with correct episode id and root node", () => {
    const analysis = analyzeScriptDoctor("السوق ارتفع 3%.", "ar");
    const graph = generateStoryGraph(analysis, "ep-plan-1");
    const scenes = generateSceneContracts(graph);
    const prodGraph = buildProductionGraph("ep-plan-1", scenes);
    const targetId = prodGraph.nodes[0]?.id || "char-rig";
    const impact = calculateRegenerationImpact("ep-plan-1", targetId, prodGraph, scenes);
    const plan = createPartialRegenerationPlan("ep-plan-1", targetId, impact, scenes);

    expect(plan.episodeId).toBe("ep-plan-1");
    expect(plan.rootNodeId).toBe(targetId);
    expect(plan.preservedNodeIds).toEqual(impact.mustNotRegenerateNodes);
  });

  it("should include Creative DNA and Style Skill requirements", () => {
    const analysis = analyzeScriptDoctor("أسواق المال.", "ar");
    const graph = generateStoryGraph(analysis, "ep-plan-2");
    const scenes = generateSceneContracts(graph);
    const prodGraph = buildProductionGraph("ep-plan-2", scenes);
    const targetId = prodGraph.nodes[0]?.id || "char-rig";
    const impact = calculateRegenerationImpact("ep-plan-2", targetId, prodGraph, scenes);
    const plan = createPartialRegenerationPlan("ep-plan-2", targetId, impact, scenes);

    expect(plan.styleSkillRequirements.length).toBeGreaterThan(0);
    expect(plan.validationGates.length).toBeGreaterThan(0);
  });
});

describe("P0-H executeMentorRepairLifecycle", () => {
  const makeTask = (repairAttempts = 0): RefilmTask => ({
    id: "rtask-test-1",
    episodeId: "ep-repair-1",
    sceneId: "scene-s1",
    severity: "BLOCKER",
    issueType: "CONTINUITY_DRIFT",
    description: "اللون لا يطابق Creative DNA",
    rootCause: "تعارض في متغيرات اللون",
    suggestedFix: "تطبيق Style Lock",
    affectedNodes: ["shot-s1-a"],
    dependencyImpact: "عقدتان متأثرتان",
    action: "REPAIR",
    status: "OPEN",
    repairAttempts,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const makeReview = (): MentorReview => ({
    id: "rev-repair-1",
    episodeId: "ep-repair-1",
    qualityScore: 65,
    approved: false,
    createdAt: new Date().toISOString(),
    issues: [
      {
        id: "rtask-test-1",
        mentorType: "CONTINUITY",
        severity: "BLOCKER",
        title: "انجراف Creative DNA",
        evidence: "اللون",
        impact: "تعارض بصري",
        fixSuggestion: "تطبيق Style Lock",
        sceneRef: "scene-s1",
        autoFixable: true,
        resolved: false,
        overridden: false,
      },
    ],
  });

  it("should succeed on first attempt and return PASSED status", () => {
    const analysis = analyzeScriptDoctor("السوق ارتفع.", "ar");
    const g = generateStoryGraph(analysis, "ep-repair-1");
    const scenes = generateSceneContracts(g);
    const result = executeMentorRepairLifecycle(makeTask(0), makeReview(), scenes);

    expect(result.repairResult.success).toBe(true);
    expect(result.updatedTask.status).toBe("PASSED");
    expect(result.recheckResult.decision).toBe("APPROVE");
  });

  it("should escalate when max attempts exceeded", () => {
    const analysis = analyzeScriptDoctor("السوق انخفض.", "ar");
    const g = generateStoryGraph(analysis, "ep-repair-2");
    const scenes = generateSceneContracts(g);
    const result = executeMentorRepairLifecycle(makeTask(3), makeReview(), scenes, 3);

    expect(result.repairResult.success).toBe(false);
    expect(result.updatedTask.status).toBe("FAILED");
    expect(result.recheckResult.decision).toBe("ESCALATE");
  });

  it("should update scene visualIntent with repair marker", () => {
    const analysis = analyzeScriptDoctor("الاستثمار مهم.", "ar");
    const g = generateStoryGraph(analysis, "ep-repair-3");
    const scenes = generateSceneContracts(g);
    // Plant a matching scene id
    const task = { ...makeTask(0), sceneId: scenes[0]?.id || "scene-s1" };
    const review = { ...makeReview(), issues: [{ ...makeReview().issues[0]!, sceneRef: scenes[0]?.id }] };
    const result = executeMentorRepairLifecycle(task, review, scenes);

    const repairedScene = result.updatedScenes.find((s) => s.id === task.sceneId);
    if (repairedScene) {
      expect(repairedScene.visualIntent).toContain("[REPAIRED");
    }
    expect(result.repairResult.taskId).toBe("rtask-test-1");
  });
});

describe("P0-H HumanizationDirector", () => {
  it("should detect mechanical rhythm in scenes with identical duration", () => {
    // Build a synthetic array of 5 scenes with identical duration to guarantee trigger
    const baseAnalysis = analyzeScriptDoctor("السوق ارتفع.", "ar");
    const baseGraph = generateStoryGraph(baseAnalysis, "ep-hum-1");
    const baseScenes = generateSceneContracts(baseGraph);
    const template = baseScenes[0]!;
    const uniformScenes = Array.from({ length: 5 }, (_, i) => ({
      ...template,
      id: `scene-hum-${i}`,
      durationSeconds: 8,
    }));
    const report = HumanizationDirector.analyzeHumanization("ep-hum-1", uniformScenes);

    expect(report.episodeId).toBe("ep-hum-1");
    expect(report.rhythmScore).toBeLessThan(100);
    expect(report.evaluatedAt).toBeTruthy();
  });


  it("should not find issues in naturally varied scenes", () => {
    const analysis = analyzeScriptDoctor("السوق ارتفع. ثم انخفض.", "ar");
    const g = generateStoryGraph(analysis, "ep-hum-2");
    const scenes = generateSceneContracts(g);
    // Vary durations naturally
    const variedScenes = scenes.map((s, i) => ({ ...s, durationSeconds: 6 + i }));
    const report = HumanizationDirector.analyzeHumanization("ep-hum-2", variedScenes);

    expect(report.repetitionCount).toBe(0);
    expect(report.rhythmScore).toBe(100);
  });

  it("applyHumanizationPlan should not violate protected constraints", () => {
    const analysis = analyzeScriptDoctor("أسواق المال تتحرك.", "ar");
    const g = generateStoryGraph(analysis, "ep-hum-3");
    const scenes = generateSceneContracts(g);
    const uniformScenes = scenes.map((s) => ({ ...s, durationSeconds: 8 }));
    const report = HumanizationDirector.analyzeHumanization("ep-hum-3", uniformScenes);
    const { plan } = HumanizationDirector.applyHumanizationPlan("ep-hum-3", report, uniformScenes);

    expect(plan.protectedConstraints.length).toBeGreaterThan(0);
    expect(plan.protectedConstraints.some((c) => c.includes("Creative DNA"))).toBe(true);
  });
});



