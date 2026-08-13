import { loadState, saveState, advance, writeArtifactJson, syncDb } from "../state.js";
import { ModelRouter } from "@vox/providers";
import { extractJson } from "../util/json.js";
import { planPrompt } from "./prompts.js";
import { dialogueLinesText } from "@vox/domain";

export async function act02GeneratePlan(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  if (!state.script) throw new Error("plan requires script");
  advance(state, "plan", "Planning scenes and shots");
  await syncDb(state);
  const router = new ModelRouter({ mode: state.runtimeMode });

  const prompt = planPrompt({
    script: dialogueLinesText(state.script.lines),
    language: state.config.language,
    sceneCount: state.config.sceneCount,
    shotCount: state.config.shotCount,
  });

  const { result, runs } = await router.runText(prompt.prompt, {
    system: prompt.system,
    maxTokens: 4096,
    temperature: 0.7,
    seed: 7,
  });
  state.providerRuns = [...(state.providerRuns ?? []), ...runs];

  const parsed = extractJson(result.text) as {
    scenes?: {
      type?: string;
      narrativePurpose?: string;
      dialogueLineIndices?: number[];
      shots?: { description?: string; visualPrompt?: string; durationSec?: number; camera?: string; transitionIn?: string }[];
      visualIntent?: string;
    }[];
    continuityRules?: string[];
  } | null;

  const lineCount = state.script.lines.length;
  const scenes = (parsed?.scenes ?? []).slice(0, Math.max(1, state.config.sceneCount)).map((s, si) => {
    const shots = (s.shots ?? []).slice(0, Math.max(1, Math.round(state.config.shotCount / Math.max(1, parsed?.scenes?.length ?? 1)))).map((sh, k) => ({
      id: `shot_${si}_${k}`,
      index: k,
      type: "STATIC_CAMERA",
      description: sh.description?.trim() || `Shot ${k + 1} for scene ${si + 1}`,
      visualPrompt: sh.visualPrompt?.trim() || visualFallback(si, k),
      durationSec: Math.min(10, Math.max(4, Math.round(sh.durationSec ?? 5))),
      camera: sh.camera?.trim() || "Parallax push-in",
      transitionIn: sh.transitionIn?.trim() || "Page flip",
    }));
    const indices = (s.dialogueLineIndices ?? []).filter((i) => i >= 0 && i < lineCount).slice(0, lineCount);
    return {
      id: `scene_${si}`,
      index: si,
      type: s.type?.trim() || (si === 0 ? "HOST" : si === scenes.length - 1 ? "OUTRO" : "EXPLAINER"),
      narrativePurpose: s.narrativePurpose?.trim() || "Advance the argument",
      dialogueLineIndices: indices,
      shots,
      durationSec: shots.reduce((a, sh) => a + sh.durationSec, 0),
      visualIntent: s.visualIntent?.trim() || "Premium cinematic paper/collage podcast world",
    };
  });

  if (scenes.length === 0) {
    const allIdx = state.script.lines.map((_, i) => i);
    scenes.push({
      id: "scene_0",
      index: 0,
      type: "HOST",
      narrativePurpose: "Hook and framing",
      dialogueLineIndices: allIdx,
      shots: [
        { id: "shot_0_0", index: 0, type: "STATIC_CAMERA", description: "Host on warm study set", visualPrompt: visualFallback(0, 0), durationSec: 6, camera: "Parallax", transitionIn: "Page flip" },
        { id: "shot_0_1", index: 1, type: "STATIC_CAMERA", description: "Over-shoulder on desk with charts", visualPrompt: visualFallback(0, 1), durationSec: 6, camera: "Dynamic angle", transitionIn: "Whip pan" },
      ],
      durationSec: 12,
      visualIntent: "Warm editorial study",
    });
  }

  state.plan = {
    episodeId,
    scenes,
    durationTargetSec: state.config.durationTargetSec,
    continuityRules: parsed?.continuityRules ?? [],
    storyGraph: {
      nodes: scenes.map((s) => ({ id: s.id, type: s.type, index: s.index, narrativePurpose: s.narrativePurpose })),
      edges: scenes.slice(1).map((s) => ({ from: `scene_${s.index - 1}`, to: s.id })),
    },
  };

  writeArtifactJson(episodeId, "execution-plan.json", state.plan);
  writeArtifactJson(episodeId, "scenes.json", { scenes });
  writeArtifactJson(
    episodeId,
    "shots.json",
    { shots: scenes.flatMap((s) => s.shots) },
  );
  saveState(state);
  await syncDb(state);
  return episodeId;
}

function visualFallback(scene: number, shot: number): string {
  const base =
    "cinematic podcast studio set, warm dark editorial study, felt puppet host character with white wild hair and teal blazer, paper collage texture, halftone accents, controlled mustard and deep teal palette, soft cinematic lighting";
  return `${base}, scene ${scene + 1} shot ${shot + 1}`;
}
