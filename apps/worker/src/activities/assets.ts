import { loadState, saveState, advance, writeArtifactJson, syncDb } from "../state.js";
import { ModelRouter, RouterGateError } from "@vox/providers";
import { downloadAndStore, ffprobeJson } from "@vox/media";
import { heartbeat } from "../util/heartbeat.js";
import { storage } from "@vox/storage";

/**
 * activity03 — Generate Assets (REAL providers)
 * Generates voice per dialogue line and image per shot through the real provider
 * router, then persists every binary via the Asset Downloader (validate -> sha256
 * -> storage.put -> ArtifactRegistry).
 *
 * Video generation is attempted through the real video provider gate; if no real
 * provider is accessible it is recorded as BLOCKED (never faked).
 */
export async function act03GenerateAssets(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  if (!state.script || !state.plan) throw new Error("assets require script and plan");
  advance(state, "assets", "Generating voice and visual assets");
  await syncDb(state);
  const router = new ModelRouter({ mode: state.runtimeMode });

  const allRuns = [...(state.providerRuns ?? [])];
  const voiceArtifacts: typeof state.voiceArtifacts = {};
  const imageArtifacts: typeof state.imageArtifacts = {};
  const lineDurations: Record<string, number> = {};

  // 1) Voice per dialogue line
  for (let i = 0; i < state.script.lines.length; i++) {
    const line = state.script.lines[i];
    heartbeat({ step: "voice", index: i, total: state.script.lines.length });
    const { result, runs } = await router.runVoice(line.text, state.config.language, String(i));
    allRuns.push(...runs);
    const stored = await downloadAndStore({
      episodeId,
      kind: `voice-line-${i}`,
      capability: "VOICE",
      provider: result.provider,
      model: result.model,
      requestId: result.requestId,
      buffer: result.binary,
      mimeType: result.mimeType,
      fileName: `line_${i}.mp3`,
      metadata: { lineIndex: i, speaker: line.speaker, text: line.text.slice(0, 120) },
    });
    voiceArtifacts[`line_${i}`] = stored.artifact;
    // measure real duration
    try {
      const probe = await ffprobeJson(storage.pathFor(stored.artifact.storageKey));
      const d = Number(probe.format?.duration ?? 0);
      lineDurations[`line_${i}`] = d > 0 ? d : 2;
    } catch {
      lineDurations[`line_${i}`] = 2;
    }
    saveState(state);
    heartbeat({ step: "voice-done", index: i });
  }

  // 2) Image per shot
  const shots = state.plan.scenes.flatMap((s) => s.shots);
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    heartbeat({ step: "image", index: i, total: shots.length });
    const prompt = `${shot.visualPrompt}`;
    const { result, runs } = await router.runImage(prompt, {
      width: state.config.resolution.width,
      height: state.config.resolution.height,
      seed: 1000 + i,
    });
    allRuns.push(...runs);
    const stored = await downloadAndStore({
      episodeId,
      kind: `shot-image-${i}`,
      capability: "IMAGE",
      provider: result.provider,
      model: result.model,
      requestId: result.requestId,
      buffer: result.binary,
      mimeType: result.mimeType,
      fileName: `shot_${i}.png`,
      metadata: { shotId: shot.id, description: shot.description.slice(0, 160) },
    });
    imageArtifacts[shot.id] = stored.artifact;
    saveState(state);
    heartbeat({ step: "image-done", index: i });
  }

  // 3) Video generation gate (real provider only; blocked if unavailable)
  const videoArtifacts: typeof state.videoArtifacts = [];
  const videoRuns: typeof state.videoProviderRuns = [];
  try {
    const videoPrompt = "Cinematic slow push-in of the podcast host studio, paper collage style";
    const { result, runs } = await router.runVideo(videoPrompt);
    videoRuns.push(...runs);
    if (result.sizeBytes > 0) {
      const stored = await downloadAndStore({
        episodeId,
        kind: "generated-video",
        capability: "VIDEO",
        provider: result.provider,
        model: result.model,
        requestId: result.requestId,
        buffer: result.binary,
        mimeType: result.mimeType,
        fileName: "generated.mp4",
        metadata: { note: "provider-generated video" },
      });
      videoArtifacts.push(stored.artifact);
      writeArtifactJson(episodeId, "generated-assets.json", { voice: voiceArtifacts, images: imageArtifacts, videos: videoArtifacts });
    }
  } catch (e) {
    if (e instanceof RouterGateError) {
      videoRuns.push(...e.runs);
    } else {
      videoRuns.push({
        id: `run_vidfail_${Date.now().toString(36)}`,
        capability: "VIDEO",
        provider: "unknown",
        model: "unknown",
        status: "failed",
        error: (e as Error).message,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
  }

  state.voiceArtifacts = voiceArtifacts;
  state.imageArtifacts = imageArtifacts;
  state.videoArtifacts = videoArtifacts;
  state.videoProviderRuns = videoRuns;
  state.lineDurations = lineDurations;
  state.providerRuns = allRuns;

  writeArtifactJson(episodeId, "generated-assets.json", {
    voice: voiceArtifacts,
    images: imageArtifacts,
    videos: videoArtifacts,
    videoProviderRuns: videoRuns,
  });

  const audioReport = Object.fromEntries(
    Object.entries(voiceArtifacts).map(([k, a]) => [k, { artifactId: a.id, sizeBytes: a.sizeBytes, sha256: a.sha256, durationSec: lineDurations[k] ?? null, provider: a.provider, model: a.model, requestId: a.requestId }]),
  );
  writeArtifactJson(episodeId, "audio-report.json", audioReport);

  saveState(state);
  await syncDb(state);
  return episodeId;
}
