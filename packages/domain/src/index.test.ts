import { describe, expect, it } from "vitest";
import {
  STAGE_ORDER,
  withStage,
  estimateSpeechDurationSec,
  dialogueLinesText,
  runContinuityChecks,
  runHumanizationChecks,
  computeQualityScore,
  buildMentorReport,
  buildQaReport,
} from "./index.js";
import type { ScriptDocument, Scene } from "@vox/contracts";

const script: ScriptDocument = {
  episodeId: "ep_1",
  language: "ar",
  title: "Habits",
  topic: "habits",
  hook: "h",
  summary: "s",
  lines: [
    { lineIndex: 0, speaker: "Host", role: "HOST", text: "لماذا ينجح البعض؟" },
    { lineIndex: 1, speaker: "Guest", role: "GUEST", text: "لأنهم يبنون أنظمة صغيرة." },
    { lineIndex: 2, speaker: "Guest", role: "GUEST", text: "لأنهم يبنون أنظمة صغيرة." },
  ],
};

const scenes: Scene[] = [
  {
    id: "scene_0",
    index: 0,
    type: "HOST",
    narrativePurpose: "hook",
    dialogueLineIndices: [0],
    shots: [
      { id: "s0", index: 0, type: "STATIC_CAMERA", description: "d", visualPrompt: "v", durationSec: 5, camera: "c", transitionIn: "page-flip" },
    ],
    durationSec: 5,
    visualIntent: "cinematic",
  },
];

describe("STAGE_ORDER", () => {
  it("is a fixed production pipeline", () => {
    expect(STAGE_ORDER[0]).toBe("script");
    expect(STAGE_ORDER).toContain("assets");
    expect(STAGE_ORDER).toContain("render");
    expect(STAGE_ORDER).toContain("qa");
    expect(STAGE_ORDER[STAGE_ORDER.length - 1]).toBe("done");
  });
});

describe("withStage", () => {
  it("reports monotonic progress that never reaches 100 until done", () => {
    const base = {
      episodeId: "ep_1",
      workflowId: "w",
      status: "PLANNING" as const,
      stage: "script" as const,
      runtimeMode: "real" as const,
      currentStageMessage: "",
      stageOrder: [...STAGE_ORDER],
      stageIndex: 0,
      progress: 0,
      providerRuns: [],
      artifacts: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const run = withStage(base, "assets", "fetching media");
    expect(run.progress).toBeGreaterThan(0);
    expect(run.progress).toBeLessThan(100);
    expect(run.status).toBe("GENERATING");
  });
});

describe("estimateSpeechDurationSec", () => {
  it("estimates ~2.6 wps for Arabic", () => {
    const d = estimateSpeechDurationSec("كلمة كلمة كلمة كلمة كلمة", "ar");
    expect(d).toBeGreaterThanOrEqual(1);
  });

  it("returns 0 for empty text", () => {
    expect(estimateSpeechDurationSec("  ", "ar")).toBe(0);
  });
});

describe("dialogueLinesText", () => {
  it("flattens lines with speaker prefixes", () => {
    const t = dialogueLinesText(script.lines);
    expect(t).toContain("Host: لماذا ينجح البعض؟");
  });
});

describe("runContinuityChecks", () => {
  it("flags empty scenes", () => {
    const issues = runContinuityChecks(script, []);
    expect(issues.some((i) => i.severity === "blocker" && i.domain === "continuity")).toBe(true);
  });

  it("passes for a well-formed script and scene", () => {
    const issues = runContinuityChecks(script, scenes);
    expect(issues).toHaveLength(0);
  });
});

describe("runHumanizationChecks", () => {
  it("flags duplicated dialogue lines", () => {
    const issues = runHumanizationChecks(script);
    expect(issues.some((i) => i.title.includes("Duplicate"))).toBe(true);
  });
});

describe("computeQualityScore", () => {
  it("penalizes blockers heavily", () => {
    const issues = [
      { id: "1", severity: "blocker" as const, domain: "c", title: "t", evidence: "e", fix: "f" },
      { id: "2", severity: "warning" as const, domain: "h", title: "t", evidence: "e", fix: "f" },
    ];
    expect(computeQualityScore(issues)).toBeLessThan(100);
  });
});

describe("buildMentorReport", () => {
  it("flags duplicates and approves clean scripts", () => {
    const dirty = buildMentorReport("ep_1", script, scenes);
    expect(dirty.issues.length).toBeGreaterThan(0);

    const cleanScript = { ...script, lines: script.lines.slice(0, 2) };
    const clean = buildMentorReport("ep_1", cleanScript, scenes);
    expect(clean.approved).toBe(true);
    expect(clean.qualityScore).toBe(100);
  });
});

describe("buildQaReport", () => {
  const mp4Probe = {
    format: { format_name: "mov,mp4,m4a,3gp,3g2,mj2", duration: 45.2 },
    streams: [
      { codec_type: "video", codec_name: "h264", width: 1280, height: 720 },
      { codec_type: "audio", codec_name: "aac" },
    ],
  };

  it("passes a real MP4 with audio and video", () => {
    const report = buildQaReport("ep_1", mp4Probe, 1_200_000);
    expect(report.passed).toBe(true);
    expect(report.checks.every((c) => c.status === "pass")).toBe(true);
  });

  it("fails on a suspiciously small file", () => {
    const report = buildQaReport("ep_1", mp4Probe, 1_024);
    expect(report.passed).toBe(false);
    expect(report.checks.find((c) => c.name === "file-size-meaningful")?.status).toBe("fail");
  });

  it("fails when the container is not MP4", () => {
    const report = buildQaReport("ep_1", { format: { format_name: "matroska" }, streams: [] }, 1_200_000);
    expect(report.passed).toBe(false);
    expect(report.checks.find((c) => c.name === "container-mp4")?.status).toBe("fail");
  });
});
