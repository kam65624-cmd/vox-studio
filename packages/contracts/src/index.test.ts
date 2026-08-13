import { describe, expect, it } from "vitest";
import {
  ProductionConfigSchema,
  EpisodeSchema,
  ScriptDocumentSchema,
  PlanDocumentSchema,
  QaReportSchema,
  ProductionStatus,
} from "./index.js";

describe("ProductionConfigSchema", () => {
  it("accepts a valid real-mode config", () => {
    const ok = ProductionConfigSchema.safeParse({
      topic: "لماذا ينجح البعض في بناء العادات",
      language: "ar",
      format: "podcast",
      durationTargetSec: 45,
      speakerCount: 2,
      sceneCount: 2,
      shotCount: 4,
      style: "premium-cinematic",
      resolution: { width: 1280, height: 720 },
      fps: 24,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects an unknown language", () => {
    const bad = ProductionConfigSchema.safeParse({
      language: "fr",
      resolution: { width: 1280, height: 720 },
    });
    expect(bad.success).toBe(false);
  });

  it("rejects zero/negative fps", () => {
    const bad = ProductionConfigSchema.safeParse({ fps: 0, resolution: { width: 1, height: 1 } });
    expect(bad.success).toBe(false);
  });
});

describe("EpisodeSchema", () => {
  it("accepts a well-formed episode", () => {
    const ok = EpisodeSchema.safeParse({
      id: "ep_1",
      projectId: "prj_1",
      title: "Habits",
      topic: "habits",
      status: "DRAFT",
      language: "ar",
      config: { topic: "habits", language: "ar", resolution: { width: 1280, height: 720 } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(ok.success).toBe(true);
  });
});

describe("ScriptDocumentSchema", () => {
  it("validates dialogue lines with speakers and text", () => {
    const ok = ScriptDocumentSchema.safeParse({
      episodeId: "ep_1",
      language: "ar",
      title: "t",
      topic: "habits",
      hook: "h",
      summary: "s",
      lines: [
        { lineIndex: 0, speaker: "Host", role: "HOST", text: "hello" },
        { lineIndex: 1, speaker: "Guest", role: "GUEST", text: "hi" },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a script with no lines", () => {
    const bad = ScriptDocumentSchema.safeParse({
      episodeId: "ep_1",
      language: "ar",
      title: "t",
      topic: "habits",
      hook: "h",
      summary: "s",
      lines: [],
    });
    expect(bad.success).toBe(false);
  });
});

describe("PlanDocumentSchema", () => {
  it("validates scenes and shots", () => {
    const ok = PlanDocumentSchema.safeParse({
      episodeId: "ep_1",
      durationTargetSec: 45,
      scenes: [
        {
          id: "scene_0",
          index: 0,
          type: "HOST",
          narrativePurpose: "hook",
          durationSec: 10,
          dialogueLineIndices: [0],
          shots: [
            { id: "shot_0_0", index: 0, type: "STATIC_CAMERA", description: "d", visualPrompt: "v", durationSec: 5, camera: "c", transitionIn: "page-flip" },
          ],
          visualIntent: "cinematic",
        },
      ],
      continuityRules: [],
      storyGraph: { nodes: [{ id: "scene_0", type: "HOST" }], edges: [] },
    });
    expect(ok.success).toBe(true);
  });
});

describe("QaReportSchema", () => {
  it("validates a QA report", () => {
    const ok = QaReportSchema.safeParse({
      episodeId: "ep_1",
      passed: true,
      checks: [
        { name: "container-mp4", status: "pass", detail: "mp4" },
      ],
      generatedAt: new Date().toISOString(),
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a check with an unknown status", () => {
    const bad = QaReportSchema.safeParse({
      episodeId: "ep_1",
      passed: false,
      checks: [{ name: "x", status: "maybe", detail: "" }],
      generatedAt: new Date().toISOString(),
    });
    expect(bad.success).toBe(false);
  });
});

describe("ProductionStatus", () => {
  it("contains the exported terminal states", () => {
    expect(ProductionStatus.options).toContain("EXPORTED");
    expect(ProductionStatus.options).toContain("FAILED");
  });
});
