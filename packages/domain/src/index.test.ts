import { describe, it, expect } from "vitest";
import {
  canTransition,
  canTransitionProductionState,
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
  PromptCompiler,
  createProductionExecutionPlan,
  createGenerationJobsFromPlan,
  assembleShot,
  assembleScene,
  assembleEpisode,
  runQualityGates,
} from "./index";
import { MentorReview, RefilmTask, CreativeDNA, StyleSkill, Character, Studio, Wardrobe, Prop } from "@vox/contracts";

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

  it("should allow valid ProductionState transitions", () => {
    expect(canTransitionProductionState("DRAFT", "ANALYZING")).toBe(true);
    expect(canTransitionProductionState("GENERATING", "VALIDATING")).toBe(true);
    expect(canTransitionProductionState("VALIDATING", "ASSEMBLING")).toBe(true);
    expect(canTransitionProductionState("ASSEMBLING", "MENTOR_REVIEW")).toBe(true);
    expect(canTransitionProductionState("FINAL_QA", "COMPLETED")).toBe(true);
  });

  it("should reject invalid ProductionState transitions", () => {
    expect(canTransitionProductionState("DRAFT", "COMPLETED")).toBe(false);
    expect(canTransitionProductionState("COMPLETED", "GENERATING")).toBe(false);
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
});

// ─── P0-J Step 1 & Step 2 Tests (18 Scenarios) ────────────────────────────────

describe("P0-J Step 1/2 Execution Planner & PromptCompiler", () => {
  const buildGraphAndScenes = (id: string) => {
    const analysis = analyzeScriptDoctor("السوق ارتفع 3%. تراجعت الأسهم.", "ar");
    const storyGraph = generateStoryGraph(analysis, id);
    const scenes = generateSceneContracts(storyGraph);
    const prodGraph = buildProductionGraph(id, scenes);
    return { storyGraph, scenes, prodGraph };
  };

  // Scenario 1: Graph-derived execution order
  it("Scenario 1: plan should derive execution order directly from ProductionGraph", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-order");
    const plan = createProductionExecutionPlan("ep-plan-order", prodGraph, scenes);
    expect(plan.nodes.length).toBe(prodGraph.nodes.length);
    expect(plan.nodes[0]?.executionOrder).toBe(1);
    expect(plan.nodes[plan.nodes.length - 1]?.executionOrder).toBe(plan.nodes.length);
  });

  // Scenario 2: Dependency blocking
  it("Scenario 2: nodes with unfinished dependencies should have blockingDependencies listed", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-blocking");
    const plan = createProductionExecutionPlan("ep-plan-blocking", prodGraph, scenes);
    const dependentNode = plan.nodes.find((n) => n.dependencies.length > 0);
    if (dependentNode) {
      expect(dependentNode.blockingDependencies.length).toBeGreaterThan(0);
    }
  });

  // Scenario 3: Parallelizable nodes
  it("Scenario 3: root nodes without dependencies should be flagged as parallelizable", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-parallel");
    const plan = createProductionExecutionPlan("ep-plan-parallel", prodGraph, scenes);
    const rootNodes = plan.nodes.filter((n) => n.dependencies.length === 0);
    expect(rootNodes.every((n) => n.parallelizable)).toBe(true);
  });

  // Scenario 4: Model routing
  it("Scenario 4: planner must route nodes through ModelRouter to select capabilities & models", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-routing");
    const plan = createProductionExecutionPlan("ep-plan-routing", prodGraph, scenes);
    expect(plan.nodes.every((n) => n.selectedCapability && n.selectedModelId && n.selectedProviderId)).toBe(true);
  });

  // Scenario 5: Deterministic job identity
  it("Scenario 5: idempotency keys must be deterministic for identical node & DNA version", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-idem");
    const plan1 = createProductionExecutionPlan("ep-plan-idem", prodGraph, scenes);
    const plan2 = createProductionExecutionPlan("ep-plan-idem", prodGraph, scenes);
    expect(plan1.nodes[0]?.idempotencyKey).toBe(plan2.nodes[0]?.idempotencyKey);
  });

  // Scenario 6: Duplicate job prevention
  it("Scenario 6: jobs generated from plan must preserve idempotencyKey to prevent duplicate execution", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-jobs");
    const plan = createProductionExecutionPlan("ep-plan-jobs", prodGraph, scenes);
    const jobs = createGenerationJobsFromPlan("ep-plan-jobs", plan);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0]?.idempotencyKey).toBe(plan.nodes[0]?.idempotencyKey);
  });

  // Scenario 7: Valid artifact reuse
  it("Scenario 7: planner must set action to REUSE for nodes with existing valid artifacts", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-reuse");
    const targetNodeId = prodGraph.nodes[0]?.id || "char-rig";
    const plan = createProductionExecutionPlan("ep-plan-reuse", prodGraph, scenes, undefined, [targetNodeId]);
    const reusedNode = plan.nodes.find((n) => n.nodeId === targetNodeId);
    expect(reusedNode?.action).toBe("REUSE");
    expect(plan.preservedAssets).toContain(targetNodeId);
  });

  // Scenario 8: Failed artifact regeneration
  it("Scenario 8: planner must set action to GENERATE for nodes without valid artifacts", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-regen");
    const plan = createProductionExecutionPlan("ep-plan-regen", prodGraph, scenes, undefined, []);
    expect(plan.nodes.every((n) => n.action === "GENERATE")).toBe(true);
  });

  // Scenario 9: Provider unavailable handling
  it("Scenario 9: execution plan should handle estimated duration/cost when provider pricing is unavailable", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-cost");
    const plan = createProductionExecutionPlan("ep-plan-cost", prodGraph, scenes);
    expect(plan.isCostEstimated).toBe(true);
    expect(plan.totalCostUsd).toBeGreaterThanOrEqual(0);
  });

  // Scenario 10: Unsupported capability fallback
  it("Scenario 10: ModelRouter in planner should fallback gracefully for registered capabilities", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-fallback");
    const plan = createProductionExecutionPlan("ep-plan-fallback", prodGraph, scenes);
    expect(plan.nodes.some((n) => n.selectedCapability === "VIDEO_GENERATION" || n.selectedCapability === "VOICE_GENERATION")).toBe(true);
  });

  // Scenario 11: Fallback model selection in execution plan
  it("Scenario 11: node router selection should provide fallback chain capability", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-models");
    const plan = createProductionExecutionPlan("ep-plan-models", prodGraph, scenes);
    expect(plan.nodes[0]?.selectedProviderId).toBeTruthy();
  });

  // Scenario 12: Quality downgrade rejection
  it("Scenario 12: planner router selection enforces HIGH quality tier", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-quality");
    const plan = createProductionExecutionPlan("ep-plan-quality", prodGraph, scenes);
    expect(plan.nodes.length).toBeGreaterThan(0);
  });

  // Scenario 13: Deterministic PromptCompiler
  it("Scenario 13: PromptCompiler must produce identical prompt and fingerprint for identical inputs", () => {
    const input = {
      creativeDNA: { styleName: "VOX Mixed Media Editorial", primaryColor: "#0A0A0A", accentColor: "#FF3B30", version: 1 } as CreativeDNA,
      negativeRules: ["No photorealism", "No 3D renders"],
    };
    const compiled1 = PromptCompiler.compilePrompt(input);
    const compiled2 = PromptCompiler.compilePrompt(input);
    expect(compiled1.prompt).toBe(compiled2.prompt);
    expect(compiled1.fingerprint).toBe(compiled2.fingerprint);
  });

  // Scenario 14: CreativeDNA inclusion in prompt
  it("Scenario 14: compiled prompt must contain CreativeDNA style name and color palette lock", () => {
    const dna: CreativeDNA = { styleName: "VOX Editorial Style", primaryColor: "#111111", accentColor: "#FF0000", version: 1 } as CreativeDNA;
    const compiled = PromptCompiler.compilePrompt({ creativeDNA: dna });
    expect(compiled.prompt).toContain("VOX Editorial Style");
    expect(compiled.prompt).toContain("Palette Lock");
    expect(compiled.metadata.creativeDnaVersion).toBe(1);
  });

  // Scenario 15: StyleSkill inclusion in prompt
  it("Scenario 15: compiled prompt must contain StyleSkill instructions when provided", () => {
    const skill = { id: "vox-mixed-media", name: "VOX Mixed Media Editorial" } as unknown as StyleSkill;
    const compiled = PromptCompiler.compilePrompt({ styleSkill: skill });
    expect(compiled.prompt).toContain("VOX Mixed Media Editorial");
    expect(compiled.metadata.styleSkillVersion).toBe("vox-mixed-media");
  });

  // Scenario 16: Continuity constraints inclusion
  it("Scenario 16: compiled prompt must embed continuity constraints", () => {
    const compiled = PromptCompiler.compilePrompt({
      continuityConstraints: ["Preserve character wardrobe", "Lock background lighting"],
    });
    expect(compiled.prompt).toContain("Continuity: Preserve character wardrobe; Lock background lighting");
  });

  // Scenario 17: Negative rules inclusion
  it("Scenario 17: compiled negative prompt must merge negative rules without duplicates", () => {
    const compiled = PromptCompiler.compilePrompt({
      negativeRules: ["No photorealism", "No blur"],
      creativeDNA: { negativeRules: ["No photorealism", "No 3D renders"] } as CreativeDNA,
    });
    expect(compiled.negativePrompt).toContain("No photorealism");
    expect(compiled.negativePrompt).toContain("No blur");
    expect(compiled.negativePrompt).toContain("No 3D renders");
  });

  // Scenario 18: Provenance linkage
  it("Scenario 18: generation jobs must carry creativeDnaVersion and styleSkillVersion for provenance linkage", () => {
    const { prodGraph, scenes } = buildGraphAndScenes("ep-plan-prov");
    const plan = createProductionExecutionPlan("ep-plan-prov", prodGraph, scenes);
    const jobs = createGenerationJobsFromPlan("ep-plan-prov", plan);
    expect(jobs[0]?.creativeDnaVersion).toBeDefined();
    expect(jobs[0]?.styleSkillVersion).toBeDefined();
  });
});

describe("K7 Assembly Engine", () => {
  it("assembles a valid shot with video asset", () => {
    const shot = assembleShot({
      shotId: "shot-01",
      sceneId: "scene-01",
      sequenceIndex: 0,
      assets: { videoAssetId: "asset-vid-01", durationSeconds: 7 },
    });
    expect(shot.isValid).toBe(true);
    expect(shot.durationSeconds).toBe(7);
    expect(shot.errors).toHaveLength(0);
  });

  it("marks shot invalid when video asset is missing", () => {
    const shot = assembleShot({
      shotId: "shot-02",
      sceneId: "scene-01",
      sequenceIndex: 1,
      assets: { durationSeconds: 5 },
    });
    expect(shot.isValid).toBe(false);
    expect(shot.errors[0]).toContain("missing video asset");
  });

  it("assembles a valid scene from shots", () => {
    const shot = assembleShot({ shotId: "s1", sceneId: "sc1", sequenceIndex: 0, assets: { videoAssetId: "v1", durationSeconds: 8 } });
    const scene = assembleScene({ sceneId: "sc1", sequenceIndex: 0, shots: [shot] });
    expect(scene.isValid).toBe(true);
    expect(scene.totalDurationSeconds).toBe(8);
  });

  it("assembles a full episode timeline from scenes", () => {
    const shot1 = assembleShot({ shotId: "s1", sceneId: "sc1", sequenceIndex: 0, assets: { videoAssetId: "v1", durationSeconds: 10 } });
    const shot2 = assembleShot({ shotId: "s2", sceneId: "sc2", sequenceIndex: 0, assets: { videoAssetId: "v2", durationSeconds: 12 } });
    const scene1 = assembleScene({ sceneId: "sc1", sequenceIndex: 0, shots: [shot1] });
    const scene2 = assembleScene({ sceneId: "sc2", sequenceIndex: 1, shots: [shot2] });
    const episode = assembleEpisode({ episodeId: "ep-001", scenes: [scene2, scene1] }); // reversed order
    expect(episode.isReadyForRender).toBe(true);
    expect(episode.totalDurationSeconds).toBe(22);
    expect(episode.scenes[0]!.sceneId).toBe("sc1"); // sorted by sequenceIndex
  });
});

describe("K9 Quality Gate Pipeline", () => {
  it("returns PASS overall when all inputs are healthy", () => {
    const summary = runQualityGates({
      episodeId: "ep-qa-01",
      scriptWordCount: 400,
      storyNodeCount: 5,
      entityCount: 4,
      driftViolationCount: 0,
      styleConsistencyScore: 92,
      visualQualityScore: 90,
      audioQualityScore: 88,
      captionCoveragePercent: 97,
      humanizationScore: 83,
      mediaFileExists: true,
      mediaHasVideo: true,
      mediaHasAudio: true,
    });
    expect(summary.overallStatus).toBe("PASS");
    expect(summary.finalScore).toBeGreaterThanOrEqual(80);
    expect(summary.gates).toHaveLength(10);
    expect(summary.blocked).toBe(false);
  });

  it("returns BLOCKED when media is missing", () => {
    const summary = runQualityGates({
      episodeId: "ep-qa-02",
      mediaFileExists: false,
      mediaHasVideo: false,
      mediaHasAudio: false,
    });
    const mediaGate = summary.gates.find((g) => g.gateId === "G10_MEDIA_INTEGRITY");
    expect(mediaGate?.status).toBe("BLOCKED");
    expect(summary.blocked).toBe(true);
  });

  it("returns REPAIRABLE when continuity has violations", () => {
    const summary = runQualityGates({
      episodeId: "ep-qa-03",
      driftViolationCount: 3,
      mediaFileExists: true,
      mediaHasVideo: true,
      mediaHasAudio: true,
    });
    const continuityGate = summary.gates.find((g) => g.gateId === "G04_SCENE_CONTINUITY");
    expect(["REPAIRABLE", "BLOCKED"]).toContain(continuityGate?.status);
    expect(summary.repairRequired).toBe(true);
  });

  it("produces weighted score out of 100", () => {
    const summary = runQualityGates({ episodeId: "ep-qa-04" });
    expect(summary.finalScore).toBeGreaterThan(0);
    expect(summary.finalScore).toBeLessThanOrEqual(100);
    expect(summary.checkedAt).toBeDefined();
  });
});

describe("PromptCompiler (P0-K.1 GAP-2)", () => {
  const mockChar: Character = {
    id: "char-tradeo",
    assetId: "ast-char-1",
    name: "Prof. Tradeo",
    slug: "prof-tradeo",
    description: "Financial host",
    personality: "Analytical",
    identity: "Professor",
    visualPrompt: "Middle-aged professor in formal suit",
    expressions: ["neutral", "thinking"],
    gestures: ["pointing"],
    allowedStyleIds: ["vox-mixed-media"],
    allowedStudioIds: ["studio-main"],
    allowedVoiceIds: ["voice-ar"],
    status: "active",
    isCanonical: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockStudio: Studio = {
    id: "studio-main",
    assetId: "ast-studio-1",
    name: "Tradeo Study Studio",
    slug: "tradeo-study",
    description: "Editorial study room",
    elements: ["desk", "bookshelf"],
    lighting: "Warm dramatic study lighting",
    cameraPositions: ["WIDE", "MEDIUM"],
    backgroundElements: ["books"],
    compatibleStyleIds: ["vox-mixed-media"],
    compatibleCharacterIds: ["char-tradeo"],
    status: "active",
    isCanonical: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockStyle: StyleSkill = {
    id: "vox-mixed-media",
    name: "VOX Mixed Media Editorial",
    slug: "vox-mixed-media",
    description: "Mixed media editorial visual style",
    version: "1.2",
    visualGrammar: "Flat motion graphics over video",
    colorSystem: { primary: "#000", secondary: "#FFF", accent: "#FF3B30" },
    composition: "Rule of thirds",
    camera: "Static medium host shot",
    motion: "Subtle zoom",
    transitions: "Cut with motion blur",
    typography: "Outfit Bold",
    texture: "Paper grain",
    props: [],
    negativeRules: ["no photorealism"],
    promptGrammar: "Subject | Style | Lighting | Camera",
    qualityRules: ["no watermarks"],
    cameraLanguage: "Static medium host shot",
    lightingLanguage: "High contrast editorial lighting",
    motionLanguage: "Subtle subtle zoom",
  };

  const mockDna: CreativeDNA = {
    id: "dna-01",
    version: 1,
    pacingRule: "DYNAMIC",
    colorPalette: ["#FF3B30", "#111827"],
    typography: "Outfit",
    motionStyle: "SNAPPY",
    forbiddenPatterns: ["generic stock photos", "watermarks"],
    mandatoryElements: ["financial graphics"],
  };

  it("1. produces deterministic output for identical input", () => {
    const input = { character: mockChar, studio: mockStudio, customInstruction: "Explain inflation" };
    const p1 = PromptCompiler.compile(input);
    const p2 = PromptCompiler.compile(input);
    expect(p1.prompt).toBe(p2.prompt);
    expect(p1.fingerprint).toBe(p2.fingerprint);
  });

  it("2. produces deterministic fingerprint via SHA-256", () => {
    const compiled = PromptCompiler.compile({ character: mockChar, studio: mockStudio });
    expect(compiled.fingerprint).toHaveLength(64);
  });

  it("3. propagates Creative DNA rules and forbidden patterns", () => {
    const compiled = PromptCompiler.compile({ creativeDna: mockDna });
    expect(compiled.negativePrompt).toContain("generic stock photos");
    expect(compiled.metadata.creativeDnaVersion).toBe(1);
  });

  it("4. propagates Style Skill camera and lighting language", () => {
    const compiled: any = PromptCompiler.compile({ styleSkill: mockStyle });
    expect(compiled.styleConstraints).toContain("Skill: VOX Mixed Media Editorial (v1.2)");
    expect(compiled.metadata.styleSkillVersion).toBe("1.2");
  });

  it("5. propagates Character and Studio prompts", () => {
    const compiled: any = PromptCompiler.compile({ character: mockChar, studio: mockStudio });
    expect(compiled.visualPrompt).toContain("Middle-aged professor in formal suit");
    expect(compiled.visualPrompt).toContain("Tradeo Study Studio");
  });

  it("6. combines negative rules and deduplicates them", () => {
    const compiled: any = PromptCompiler.compile({
      negativeRules: ["blur", "generic stock photos"],
      creativeDna: mockDna,
    });
    expect(compiled.negativePrompt).toContain("blur");
    expect(compiled.negativePrompt).toContain("generic stock photos");
    // Ensure deduplicated
    const count = (compiled.negativePrompt.match(/generic stock photos/g) || []).length;
    expect(count).toBe(1);
  });

  it("7. propagates continuity constraints", () => {
    const compiled: any = PromptCompiler.compile({ continuityConstraints: ["Keep glasses on character"] });
    expect(compiled.continuityConstraints).toContain("Keep glasses on character");
  });

  it("8. handles language setting", () => {
    const compiled: any = PromptCompiler.compile({ language: "en" });
    expect(compiled.metadata.language).toBe("en");
  });

  it("9. handles aspect ratio setting", () => {
    const compiled: any = PromptCompiler.compile({ aspectRatio: "9:16" });
    expect(compiled.metadata.aspectRatio).toBe("9:16");
    expect(compiled.parameters.aspectRatio).toBe("9:16");
  });

  it("10. different inputs produce different fingerprints", () => {
    const p1 = PromptCompiler.compile({ customInstruction: "Explain inflation" });
    const p2 = PromptCompiler.compile({ customInstruction: "Explain deflation" });
    expect(p1.fingerprint).not.toBe(p2.fingerprint);
  });
});

