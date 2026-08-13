import { mkdirSync, writeFileSync } from "node:fs";
import { loadState, saveState, statePath, episodeDir, syncDb } from "../state.js";
import type { ProductionState, WorkflowInput } from "../types.js";
import { STAGE_ORDER } from "@vox/domain";

export async function act00InitProduction(input: WorkflowInput): Promise<string> {
  const state: ProductionState = {
    episodeId: input.episodeId,
    projectId: input.projectId,
    title: input.title,
    topic: input.topic,
    config: input.config,
    runtimeMode: input.runtimeMode,
    status: "DRAFT",
    stage: "script",
    message: "Production initialised",
    progress: 0,
    startedAt: new Date().toISOString(),
    voiceArtifacts: {},
    imageArtifacts: {},
    videoArtifacts: [],
    lineDurations: {},
    providerRuns: [],
    videoProviderRuns: [],
  };
  mkdirSync(episodeDir(input.episodeId), { recursive: true });
  writeFileSync(statePath(input.episodeId), JSON.stringify(state, null, 2), "utf8");
  // episode.json artifact
  writeFileSync(`${episodeDir(input.episodeId)}/episode.json`, JSON.stringify({ id: input.episodeId, projectId: input.projectId, title: input.title, config: input.config, stageOrder: STAGE_ORDER }, null, 2), "utf8");
  await syncDb(state);
  return input.episodeId;
}
