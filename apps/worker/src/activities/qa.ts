import { loadState, saveState, advance, writeArtifactJson, syncDb, episodeDir, artifactsDir } from "../state.js";
import { probeSummary, ffprobeJson } from "@vox/media";
import { buildQaReport } from "@vox/domain";
import { heartbeat } from "../util/heartbeat.js";
import { artifactRegistry } from "@vox/storage";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export async function act16FinalQa(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  if (!state.final) throw new Error("qa requires final render");
  advance(state, "qa", "Running final QA (FFprobe)");
  await syncDb(state);

  const probe = await ffprobeJson(state.final.videoPath);
  const summary = await probeSummary(state.final.videoPath);
  state.final.durationSec = summary.durationSec;

  const qa = buildQaReport(episodeId, probe as unknown as Record<string, any>, state.final.sizeBytes);
  state.qa = qa;
  state.status = qa.passed ? "EXPORTED" : "FAILED";
  state.stage = "done";
  state.message = qa.passed ? "Production exported" : "Production failed QA";
  writeArtifactJson(episodeId, "final-qa.json", { passed: qa.passed, checks: qa.checks, ffprobe: probe, summary });

  if (!qa.passed) {
    state.error = "Final QA failed: " + qa.checks.filter((c) => c.status === "fail").map((c) => c.name).join(", ");
    saveState(state);
    await syncDb(state);
    return episodeId;
  }

  await writeEvidenceBundle(state, probe, summary);
  saveState(state);
  await syncDb(state);
  heartbeat({ step: "qa-done", passed: true, durationSec: summary.durationSec });
  return episodeId;
}

async function writeEvidenceBundle(
  state: Awaited<ReturnType<typeof loadState>>,
  probe: unknown,
  summary: { durationSec: number; videoCodec: string; audioCodec: string; width: number; height: number; bitRate: number },
): Promise<void> {
  const dir = episodeDir(state.episodeId);
  const artifacts = artifactRegistry.list();

  const finalArtifact = artifacts.find((a) => a.kind === "final-video");
  const voiceArtifacts = Object.values(state.voiceArtifacts ?? {});
  const imageArtifacts = Object.values(state.imageArtifacts ?? {});
  const videoArtifacts = state.videoArtifacts ?? [];

  const evidence = {
    runtimeMode: state.runtimeMode,
    producedAt: new Date().toISOString(),
    providers: {
      text: state.providerRuns?.filter((r) => r.capability === "TEXT").map((r) => ({ provider: r.provider, model: r.model, status: r.status, requestId: r.requestId, error: r.error })),
      voice: voiceArtifacts.map((a) => ({ provider: a.provider, model: a.model, requestId: a.requestId, artifactId: a.id, sizeBytes: a.sizeBytes, sha256: a.sha256 })),
      image: imageArtifacts.map((a) => ({ provider: a.provider, model: a.model, requestId: a.requestId, artifactId: a.id, sizeBytes: a.sizeBytes, sha256: a.sha256 })),
      video: videoArtifacts.map((a) => ({ provider: a.provider, model: a.model, requestId: a.requestId, artifactId: a.id, sizeBytes: a.sizeBytes, sha256: a.sha256 })),
      videoGate: state.videoProviderRuns ?? [],
      allProviderRuns: state.providerRuns ?? [],
    },
    artifactIds: {
      voice: voiceArtifacts.map((a) => a.id),
      images: imageArtifacts.map((a) => a.id),
      videos: videoArtifacts.map((a) => a.id),
      final: finalArtifact?.id,
    },
    artifactSizes: {
      voice: voiceArtifacts.map((a) => a.sizeBytes),
      images: imageArtifacts.map((a) => a.sizeBytes),
      final: finalArtifact?.sizeBytes,
    },
    sha256Hashes: {
      voice: voiceArtifacts.map((a) => a.sha256),
      images: imageArtifacts.map((a) => a.sha256),
      final: finalArtifact?.sha256,
    },
    storageLocations: {
      voice: voiceArtifacts.map((a) => a.storageKey),
      images: imageArtifacts.map((a) => a.storageKey),
      final: finalArtifact?.storageKey,
    },
    renderInputs: state.timeline?.clips.map((c) => ({ kind: c.kind, artifactId: c.artifactId, source: c.source, durationSec: c.durationSec })) ?? [],
    renderOutput: {
      path: state.final?.videoPath,
      sizeBytes: state.final?.sizeBytes,
      sha256: state.final?.sha256,
    },
    ffprobe: probe,
    ffprobeSummary: summary,
    finalQa: { passed: state.qa?.passed, checks: state.qa?.checks },
  };

  writeArtifactJson(state.episodeId, "real-provider-evidence.json", evidence);
  writeArtifactJson(state.episodeId, "production-run.json", {
    episodeId: state.episodeId,
    projectId: state.projectId,
    title: state.title,
    topic: state.topic,
    config: state.config,
    status: state.status,
    stage: state.stage,
    runtimeMode: state.runtimeMode,
    startedAt: state.startedAt,
    completedAt: new Date().toISOString(),
    lineCount: state.script?.lines.length ?? 0,
    sceneCount: state.plan?.scenes.length ?? 0,
    shotCount: state.plan?.scenes.flatMap((s) => s.shots).length ?? 0,
    final: state.final,
  });
  writeArtifactJson(state.episodeId, "manifest.json", {
    generated: new Date().toISOString(),
    episodeId: state.episodeId,
    files: ["episode.json", "episode-script.json", "execution-plan.json", "scenes.json", "shots.json", "generated-assets.json", "audio-report.json", "captions.srt", "captions.vtt", "continuity.json", "mentor-review.json", "humanization.json", "repair.json", "render.json", "final-qa.json", "manifest.json", "production-run.json", "real-provider-evidence.json", "final.mp4", "thumbnail.jpg"],
  });

  // Also copy a stable evidence bundle into artifacts/real-podcast
  const stableDir = join(artifactsDir(), "real-podcast");
  const { mkdirSync, copyFileSync } = await import("node:fs");
  mkdirSync(stableDir, { recursive: true });
  for (const f of ["final.mp4", "thumbnail.jpg", "real-provider-evidence.json", "production-run.json", "final-qa.json", "episode-script.json", "execution-plan.json", "scenes.json", "shots.json", "generated-assets.json", "audio-report.json", "captions.srt", "captions.vtt", "continuity.json", "mentor-review.json", "humanization.json", "repair.json", "render.json", "manifest.json"]) {
    try {
      copyFileSync(join(dir, f), join(stableDir, f));
    } catch {
      /* optional file */
    }
  }
  const { writeFileSync } = await import("node:fs");
  const episodeJson = join(dir, "episode.json");
  try {
    copyFileSync(episodeJson, join(stableDir, "episode.json"));
  } catch {
    writeFileSync(join(stableDir, "episode.json"), JSON.stringify({ id: state.episodeId, title: state.title, config: state.config }, null, 2));
  }
  void readFileSync;
}
