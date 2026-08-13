import { loadState, saveState, advance, writeArtifactJson, syncDb } from "../state.js";
import { buildTimeline } from "@vox/media";
import { heartbeat } from "../util/heartbeat.js";

export async function act05BuildTimeline(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  if (!state.plan || !state.imageArtifacts || !state.voiceArtifacts) throw new Error("timeline requires plan and assets");
  advance(state, "timeline", "Assembling the timeline");
  await syncDb(state);

  const timeline = buildTimeline({
    plan: state.plan,
    config: state.config,
    images: state.imageArtifacts,
    audio: state.voiceArtifacts,
    lineDurations: state.lineDurations,
  });

  state.timeline = timeline;
  writeArtifactJson(episodeId, "timeline.json", timeline);
  saveState(state);
  await syncDb(state);
  heartbeat({ step: "timeline-built", totalDurationSec: timeline.totalDurationSec });
  return episodeId;
}
