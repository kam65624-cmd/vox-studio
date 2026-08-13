import { loadState, saveState, advance, writeArtifactJson, syncDb } from "../state.js";
import { buildMentorReport, runContinuityChecks, runHumanizationChecks } from "@vox/domain";

export async function act07MentorReview(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  if (!state.script || !state.plan) throw new Error("mentor requires script and plan");
  advance(state, "mentor", "Mentor review");
  await syncDb(state);

  const continuity = {
    scenes: state.plan.scenes.map((s) => ({ id: s.id, type: s.type, shots: s.shots.length })),
    issues: runContinuityChecks(state.script, state.plan.scenes),
    speakers: [...new Set(state.script.lines.map((l) => l.speaker))],
  };
  const humanization = {
    issues: runHumanizationChecks(state.script),
    variationNotes: "Camera language alternates across shots; dialogue alternates speakers.",
  };

  const report = buildMentorReport(episodeId, state.script, state.plan.scenes, { continuity, humanization });
  state.mentor = report;
  writeArtifactJson(episodeId, "mentor-review.json", report);
  writeArtifactJson(episodeId, "continuity.json", continuity);

  // deterministic safe auto-fix: none required in production path unless blocker
  if (report.issues.some((i) => i.severity === "blocker")) {
    writeArtifactJson(episodeId, "repair.json", { action: "blocked", issues: report.issues.filter((i) => i.severity === "blocker") });
  } else {
    writeArtifactJson(episodeId, "repair.json", { action: "no-repair-needed", qualityScore: report.qualityScore });
  }

  saveState(state);
  await syncDb(state);
  return episodeId;
}
