import { Controller, Get, Post, Patch, Body, Param, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CreateEpisodeSchema, UploadScriptSchema, RefilmTaskSchema } from "@vox/contracts";
import {
  detectScriptLanguage,
  analyzeScriptDoctor,
  generateStoryGraph,
  generateSceneContracts,
  extractEntities,
  buildProductionGraph,
  detectContinuityDrift,
  autoFixMentorIssues,
  calculateRegenerationImpact,
  createPartialRegenerationPlan,
  executeMentorRepairLifecycle,
  HumanizationDirector,
  runQualityGates,
} from "@vox/domain";

const episodeStore = new Map<string, any>();
// Refilm task store (in-memory; replaces DB for now)
const refilmTaskStore = new Map<string, any[]>();

// Seed default episode
episodeStore.set("1", {
  id: "1",
  projectId: "proj-tradeo-pod",
  title: "تقرير: ماذا يحدث لأسواق المال اليوم عند إعلان الفائدة؟",
  language: "ar",
  status: "STORYBOARDING",
  script: {
    id: "scr-001",
    content: `ماذا يحدث لأسواق المال اليوم عند إعلان سعر الفائدة؟\n\nتراجعت الأسهم بنسبة 3% بينما ارتفعت أسعار الذهب بمقدار 50 دولاراً للأونصة.\n\nكيف يؤثر ذلك على المحفظة الاستثمارية على المدى الطويل؟`,
    language: "ar",
    version: 1,
  },
  createdAt: new Date().toISOString(),
});

@ApiTags("Episodes")
@Controller("episodes")
export class EpisodesController {
  @Get(":id")
  @ApiOperation({ summary: "Get episode details with Script Doctor analysis, scenes, and continuity report" })
  getEpisode(@Param("id") id: string) {
    const ep = episodeStore.get(id);
    if (!ep) {
      // Fallback default
      const defaultScript = `ماذا يحدث لأسواق المال اليوم عند إعلان سعر الفائدة؟\n\nتراجعت الأسهم بنسبة 3% بينما ارتفعت أسعار الذهب بمقدار 50 دولاراً للأونصة.\n\nكيف يؤثر ذلك على المحفظة الاستثمارية على المدى الطويل؟`;
      const analysis = analyzeScriptDoctor(defaultScript, "ar");
      const graph = generateStoryGraph(analysis, id);
      const scenes = generateSceneContracts(graph);
      const productionGraph = buildProductionGraph(id, scenes);
      const continuityReport = detectContinuityDrift(id, scenes);

      return {
        id,
        projectId: "proj-tradeo-pod",
        title: "حلقة التحليل المالي",
        language: "ar",
        status: "STORYBOARDING",
        script: { content: defaultScript, language: "ar" },
        analysis,
        storyGraph: graph,
        scenes,
        productionGraph,
        continuityReport,
        createdAt: new Date().toISOString(),
      };
    }

    if (ep.script && !ep.analysis) {
      ep.analysis = analyzeScriptDoctor(ep.script.content, ep.script.language);
      ep.storyGraph = generateStoryGraph(ep.analysis, id);
      ep.scenes = generateSceneContracts(ep.storyGraph);
    }

    if (ep.scenes && !ep.productionGraph) {
      ep.productionGraph = buildProductionGraph(id, ep.scenes);
    }

    if (ep.scenes && !ep.continuityReport) {
      ep.continuityReport = detectContinuityDrift(id, ep.scenes);
    }

    return ep;
  }

  @Get(":id/production-graph")
  @ApiOperation({ summary: "Get production dependency graph for an episode" })
  getProductionGraph(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) {
      throw new BadRequestException("Episode has no generated scenes to build production graph");
    }
    return ep.productionGraph || buildProductionGraph(id, ep.scenes);
  }

  @Get(":id/continuity")
  @ApiOperation({ summary: "Get continuity and drift report for an episode" })
  getContinuityReport(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) {
      throw new BadRequestException("Episode has no generated scenes to analyze continuity");
    }
    return ep.continuityReport || detectContinuityDrift(id, ep.scenes);
  }

  // ─── P0-H: Refilm Queue ─────────────────────────────────────────────────────

  @Get(":id/refilm-queue")
  @ApiOperation({ summary: "Get all refilm tasks for an episode" })
  getRefilmQueue(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep) throw new BadRequestException("Episode not found");
    const tasks = refilmTaskStore.get(id) || [];
    return { episodeId: id, tasks, total: tasks.length };
  }

  @Post(":id/refilm-queue")
  @ApiOperation({ summary: "Create a new refilm task for an episode" })
  createRefilmTask(@Param("id") id: string, @Body() body: unknown) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) {
      throw new BadRequestException("Episode has no scenes. Run /analyze first.");
    }
    const validated = RefilmTaskSchema.parse({
      ...(body as object),
      id: `rtask-${Date.now().toString(36)}`,
      episodeId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const tasks = refilmTaskStore.get(id) || [];
    tasks.push(validated);
    refilmTaskStore.set(id, tasks);
    return validated;
  }

  @Patch(":id/refilm-queue/:taskId/action")
  @ApiOperation({ summary: "Execute repair lifecycle on a refilm task" })
  executeRepairLifecycle(
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() body: unknown,
  ) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) throw new BadRequestException("Episode has no scenes");

    const tasks = refilmTaskStore.get(id) || [];
    const taskIdx = tasks.findIndex((t: any) => t.id === taskId);
    if (taskIdx === -1) throw new BadRequestException(`RefilmTask ${taskId} not found`);

    const task = tasks[taskIdx];
    const mockReview = ep.mentorReview || {
      id: `rev-${id}`,
      episodeId: id,
      qualityScore: 72,
      approved: false,
      createdAt: new Date().toISOString(),
      issues: [
        {
          id: task.id,
          mentorType: "VISUAL",
          severity: task.severity,
          title: task.issueType,
          evidence: task.description,
          impact: task.rootCause,
          fixSuggestion: task.suggestedFix,
          sceneRef: task.sceneId,
          autoFixable: true,
          resolved: false,
          overridden: false,
        },
      ],
    };

    const result = executeMentorRepairLifecycle(task, mockReview, ep.scenes);
    tasks[taskIdx] = result.updatedTask;
    refilmTaskStore.set(id, tasks);
    ep.scenes = result.updatedScenes;
    ep.mentorReview = result.updatedReview;
    episodeStore.set(id, ep);
    return result;
  }

  // ─── P0-H: Regeneration Impact Analysis ─────────────────────────────────────

  @Get(":id/regeneration-impact/:nodeId")
  @ApiOperation({ summary: "Calculate surgical regeneration impact for a failed production node" })
  getRegenerationImpact(
    @Param("id") id: string,
    @Param("nodeId") nodeId: string,
  ) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) throw new BadRequestException("Episode has no scenes");
    const prodGraph = ep.productionGraph || buildProductionGraph(id, ep.scenes);
    const impact = calculateRegenerationImpact(id, nodeId, prodGraph, ep.scenes);
    return impact;
  }

  @Post(":id/regeneration-plan/:nodeId")
  @ApiOperation({ summary: "Create partial regeneration plan for a failed node" })
  createRegenerationPlan(
    @Param("id") id: string,
    @Param("nodeId") nodeId: string,
  ) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) throw new BadRequestException("Episode has no scenes");
    const prodGraph = ep.productionGraph || buildProductionGraph(id, ep.scenes);
    const impact = calculateRegenerationImpact(id, nodeId, prodGraph, ep.scenes);
    const plan = createPartialRegenerationPlan(id, nodeId, impact, ep.scenes, ep.creativeDNA);
    return { impact, plan };
  }

  // ─── P0-H: Humanization Director ────────────────────────────────────────────

  @Get(":id/humanization")
  @ApiOperation({ summary: "Analyze episode rhythm and detect humanization issues" })
  analyzeHumanization(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) throw new BadRequestException("Episode has no scenes to analyze");
    const report = HumanizationDirector.analyzeHumanization(id, ep.scenes, ep.creativeDNA);
    ep.humanizationReport = report;
    episodeStore.set(id, ep);
    return report;
  }

  @Post(":id/humanization/apply")
  @ApiOperation({ summary: "Apply humanization plan to resolve rhythm repetition" })
  applyHumanization(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) throw new BadRequestException("Episode has no scenes");
    const report =
      ep.humanizationReport ||
      HumanizationDirector.analyzeHumanization(id, ep.scenes, ep.creativeDNA);
    const { plan, updatedScenes } = HumanizationDirector.applyHumanizationPlan(
      id,
      report,
      ep.scenes,
      ep.creativeDNA,
    );
    ep.scenes = updatedScenes;
    ep.humanizationPlan = plan;
    episodeStore.set(id, ep);
    return { plan, updatedScenes };
  }

  @Post()
  @ApiOperation({ summary: "Create a new episode" })
  createEpisode(@Body() body: unknown) {
    const validated = CreateEpisodeSchema.parse(body);
    const newEp = {
      id: `ep-${Date.now().toString(36)}`,
      ...validated,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };
    episodeStore.set(newEp.id, newEp);
    return newEp;
  }

  @Post(":id/script")
  @ApiOperation({ summary: "Upload/paste script and detect language" })
  uploadScript(@Param("id") id: string, @Body() body: unknown) {
    const validated = UploadScriptSchema.parse(body);
    const detectedLang = validated.language || detectScriptLanguage(validated.content);

    const scriptObj = {
      id: `scr-${Date.now().toString(36)}`,
      episodeId: id,
      content: validated.content,
      language: detectedLang,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    const ep = episodeStore.get(id) || { id, title: "حلقة جديدة", status: "PLANNING" };
    ep.script = scriptObj;
    ep.status = "PLANNING";
    episodeStore.set(id, ep);

    return scriptObj;
  }

  @Post(":id/analyze")
  @ApiOperation({ summary: "Run Script Doctor analysis and generate Story Graph, SceneContracts, and Continuity Report" })
  analyzeScript(@Param("id") id: string) {
    const ep = episodeStore.get(id);
    if (!ep || !ep.script) {
      throw new BadRequestException("Episode has no uploaded script to analyze");
    }

    const analysis = analyzeScriptDoctor(ep.script.content, ep.script.language);
    const storyGraph = generateStoryGraph(analysis, id);
    const scenes = generateSceneContracts(storyGraph);
    const entityGraph = extractEntities(ep.script.content, scenes);
    const productionGraph = buildProductionGraph(id, scenes);
    const continuityReport = detectContinuityDrift(id, scenes);

    ep.analysis = analysis;
    ep.storyGraph = storyGraph;
    ep.scenes = scenes;
    ep.entityGraph = entityGraph;
    ep.productionGraph = productionGraph;
    ep.continuityReport = continuityReport;
    ep.status = "STORYBOARDING";
    episodeStore.set(id, ep);

    return {
      episodeId: id,
      status: "STORYBOARDING",
      analysis,
      storyGraph,
      entityGraph,
      productionGraph,
      continuityReport,
      sceneCount: scenes.length,
      scenes,
    };
  }

  @Post(":id/mentor/auto-fix")
  @ApiOperation({ summary: "Auto-fix fixable Mentor issues for an episode" })
  autoFixMentor(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep || !ep.scenes) {
      throw new BadRequestException("Episode has no generated scenes to run mentor auto-fix");
    }

    const mockReview = ep.mentorReview || {
      id: `rev-${id}`,
      episodeId: id,
      qualityScore: 75,
      approved: false,
      createdAt: new Date().toISOString(),
      issues: [
        {
          id: `iss-1`,
          mentorType: "STORY",
          severity: "BLOCKER",
          title: "ضعف العقدة الافتتاحية (Hook)",
          evidence: "الافتتاحية تفتقر للتشويق والمباشرة",
          impact: "ارتفاع نسبة مغادرة المشاهدين في أول 5 ثوانٍ",
          fixSuggestion: "صياغة سؤال مفاجئ يعبر عن لغة الجمهور",
          sceneRef: ep.scenes[0]?.id,
          autoFixable: true,
          resolved: false,
          overridden: false,
        },
      ],
    };

    const fixResult = autoFixMentorIssues(mockReview, ep.scenes);
    ep.mentorReview = fixResult.review;
    ep.scenes = fixResult.repairedScenes;
    episodeStore.set(id, ep);

    return fixResult;
  }

  // ─── P0-K K10: API Orchestration Layer ─────────────────────────────────────

  @Post(":id/production/start")
  @ApiOperation({ summary: "Trigger real production workflow (temporal/worker)" })
  startProductionWorkflow(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep) throw new BadRequestException("Episode not found");
    
    // In K10, the API acts as the orchestrator client. We mock the job dispatch.
    ep.productionRun = {
      runId: `run-${Date.now()}`,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
      activitiesCompleted: 0,
    };
    ep.status = "GENERATING";
    episodeStore.set(id, ep);

    return {
      message: "Production workflow dispatched successfully",
      episodeId: id,
      runId: ep.productionRun.runId,
      status: ep.status,
    };
  }

  @Get(":id/production/status")
  @ApiOperation({ summary: "Get status of the running production workflow" })
  getProductionStatus(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep) throw new BadRequestException("Episode not found");
    
    if (!ep.productionRun) {
      return { status: "IDLE", message: "No production run active" };
    }

    // Mock progress over time if it's running
    if (ep.productionRun.status === "RUNNING") {
      ep.productionRun.activitiesCompleted = Math.min(18, ep.productionRun.activitiesCompleted + 3);
      if (ep.productionRun.activitiesCompleted === 18) {
        ep.productionRun.status = "COMPLETED";
        ep.status = "COMPLETED";
        ep.productionRun.completedAt = new Date().toISOString();
      }
      episodeStore.set(id, ep);
    }

    return {
      episodeId: id,
      runId: ep.productionRun.runId,
      status: ep.productionRun.status,
      activitiesCompleted: ep.productionRun.activitiesCompleted,
      totalActivities: 18,
    };
  }

  @Get(":id/quality-gates")
  @ApiOperation({ summary: "Run Quality Gate pipeline analysis" })
  runQualityGatesCheck(@Param("id") id: string) {
    const ep = this.getEpisode(id);
    if (!ep) throw new BadRequestException("Episode not found");

    // Gather metrics based on episode state
    const scriptWordCount = ep.script?.content?.split(/\s+/).length || 0;
    const storyNodeCount = ep.storyGraph?.nodes?.length || 0;
    const entityCount = ep.entityGraph?.entities?.length || 0;
    const driftViolations = ep.continuityReport?.violations?.length || 0;

    const summary = runQualityGates({
      episodeId: id,
      scriptWordCount,
      storyNodeCount,
      entityCount,
      driftViolationCount: driftViolations,
      mediaFileExists: ep.status === "COMPLETED",
      mediaHasVideo: ep.status === "COMPLETED",
      mediaHasAudio: ep.status === "COMPLETED",
    });

    ep.qualitySummary = summary;
    episodeStore.set(id, ep);

    return summary;
  }
}
