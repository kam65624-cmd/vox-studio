import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { env, resolveRepo } from "@vox/config";
import { prisma } from "@vox/database";
import { withStage, STAGE_ORDER } from "@vox/domain";
import type { ProviderRun } from "@vox/contracts";
import type { ProductionState } from "./types.js";

export function artifactsDir(): string {
  return resolveRepo(env.ARTIFACTS_DIR);
}

export function episodeDir(episodeId: string): string {
  return join(artifactsDir(), episodeId);
}

export function statePath(episodeId: string): string {
  return join(episodeDir(episodeId), "state.json");
}

export function loadState(episodeId: string): ProductionState {
  try {
    return JSON.parse(readFileSync(statePath(episodeId), "utf8")) as ProductionState;
  } catch {
    throw new Error(`No production state found for episode ${episodeId}`);
  }
}

export function saveState(state: ProductionState): ProductionState {
  const p = statePath(state.episodeId);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(state, null, 2), "utf8");
  return state;
}

export function advance(state: ProductionState, stage: ProductionState["stage"], message: string): ProductionState {
  state = withStage(state as never, stage as never, message) as unknown as ProductionState;
  state.message = message;
  state.progress = Math.min(99, Math.round(((STAGE_ORDER.indexOf(stage) + 1) / STAGE_ORDER.length) * 100));
  return saveState(state);
}

export async function syncDb(state: ProductionState): Promise<void> {
  try {
    await prisma.production.updateMany({
      where: { episodeId: state.episodeId },
      data: {
        status: state.status,
        stage: state.stage,
        message: state.message,
        progress: state.progress,
        data: JSON.parse(JSON.stringify(state)),
        error: state.error ?? null,
        ...(state.status === "EXPORTED" || state.status === "FAILED" ? { completedAt: new Date() } : {}),
      },
    });
  } catch (e) {
    console.warn("syncDb failed", (e as Error).message);
  }
}

export function appendRuns(state: ProductionState, runs: ProviderRun[]): ProductionState {
  state.providerRuns = [...(state.providerRuns ?? []), ...runs];
  return saveState(state);
}

export function writeArtifactJson(episodeId: string, name: string, payload: unknown): string {
  const p = join(episodeDir(episodeId), name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(payload, null, 2), "utf8");
  return p;
}
