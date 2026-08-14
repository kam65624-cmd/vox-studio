import { describe, it, expect, beforeEach } from "vitest";
import { EpisodesController } from "./episodes.controller";
import { BadRequestException } from "@nestjs/common";

describe("EpisodesController", () => {
  let controller: EpisodesController;

  beforeEach(() => {
    controller = new EpisodesController();
  });

  it("should retrieve default seeded episode", () => {
    const ep = controller.getEpisode("1");
    expect(ep.id).toBe("1");
    expect(ep.script).toBeDefined();
    expect(ep.analysis).toBeDefined();
    expect(ep.storyGraph).toBeDefined();
    expect(ep.scenes.length).toBeGreaterThan(0);
  });

  it("should upload script and detect Arabic language", () => {
    const ep = controller.createEpisode({
      projectId: "proj-1",
      title: "اختبار السكربت العربي",
      language: "ar",
    });

    const script = controller.uploadScript(ep.id, {
      content: "ماذا يحدث اليوم في أسواق الأسهم السعودية عند ارتفاع النفط؟",
    });

    expect(script.language).toBe("ar");
    expect(script.content).toContain("أسواق الأسهم");
  });

  it("should upload script and detect English language", () => {
    const ep = controller.createEpisode({
      projectId: "proj-1",
      title: "English Market Update",
      language: "en",
    });

    const script = controller.uploadScript(ep.id, {
      content: "Why are interest rates impacting global tech stocks today? Let us analyze the numbers.",
    });

    expect(script.language).toBe("en");
  });

  it("should run Script Doctor analysis and generate SceneContracts", () => {
    const ep = controller.createEpisode({
      projectId: "proj-1",
      title: "حلقة التحليل التلقائي",
      language: "ar",
    });

    controller.uploadScript(ep.id, {
      content: `ماذا يحدث لأسواق المال عند رفع أسعار الفائدة؟

تراجعت الأسهم بنسبة 4% وارتفعت التداولات الجانبية.

كيف يؤثر ذلك على استثماراتك القادمة؟`,
    });

    const result = controller.analyzeScript(ep.id);
    expect(result.status).toBe("STORYBOARDING");
    expect(result.analysis.hookQualityScore).toBeGreaterThan(80);
    expect(result.storyGraph.nodes.length).toBe(3);
    expect(result.scenes.length).toBe(3);
    expect(result.scenes[0]?.shot.type).toBe("MEDIUM");
    expect(result.entityGraph).toBeDefined();
    expect(result.entityGraph.canonicalEntities.length).toBeGreaterThan(0);
    expect(result.productionGraph).toBeDefined();
    expect(result.productionGraph.shots.length).toBe(6);
    expect(result.productionGraph.nodes.length).toBeGreaterThan(5);
    expect(result.continuityReport).toBeDefined();
    expect(result.continuityReport.overallContinuityScore).toBe(100);
  });

  it("should retrieve production graph for an episode", () => {
    const pGraph = controller.getProductionGraph("1");
    expect(pGraph).toBeDefined();
    expect(pGraph.shots.length).toBeGreaterThan(0);
    expect(pGraph.nodes.some((n: any) => n.type === "CHARACTER_RIG")).toBe(true);
  });

  it("should retrieve continuity report for an episode", () => {
    const cReport = controller.getContinuityReport("1");
    expect(cReport).toBeDefined();
    expect(cReport.overallContinuityScore).toBe(100);
  });

  it("should run mentor auto-fix and repair scenes", () => {
    const fixResult = controller.autoFixMentor("1");
    expect(fixResult).toBeDefined();
    expect(fixResult.fixedCount).toBeGreaterThan(0);
    expect(fixResult.review.approved).toBe(true);
  });

  it("should throw BadRequestException if analyze called without script", () => {
    expect(() => controller.analyzeScript("non-existent-ep")).toThrow(BadRequestException);
  });
});
