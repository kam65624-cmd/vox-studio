import { loadState, saveState, advance, writeArtifactJson, syncDb } from "../state.js";
import { runHumanizationChecks } from "@vox/domain";

export async function act08Humanization(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  if (!state.script) throw new Error("humanization requires script");
  advance(state, "humanization", "Humanization pass");
  await syncDb(state);

  const issues = runHumanizationChecks(state.script);
  const shots = state.plan?.scenes.flatMap((s) => s.shots) ?? [];
  const cameras = new Set(shots.map((s) => s.camera));
  const transitions = new Set(shots.map((s) => s.transitionIn));

  const report = {
    episodeId,
    roboticPatternsDetected: issues,
    cameraVariety: cameras.size,
    transitionVariety: transitions.size,
    speakerVariety: new Set(state.script.lines.map((l) => l.speaker)).size,
    passes: issues.length === 0 && cameras.size >= 2,
  };
  writeArtifactJson(episodeId, "humanization.json", report);
  saveState(state);
  await syncDb(state);
  return episodeId;
}
