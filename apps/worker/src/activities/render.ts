import { loadState, saveState, advance, writeArtifactJson, syncDb, episodeDir } from "../state.js";
import { renderPodcastVideo } from "../render/renderer.js";
import { heartbeat } from "../util/heartbeat.js";
import { readFileSync } from "node:fs";
import { artifactRegistry, sha256Hex } from "@vox/storage";
import type { ArtifactRecord } from "@vox/contracts";

export async function act15FinalRender(episodeId: string): Promise<string> {
  const state = loadState(episodeId);
  if (!state.timeline || !state.captions) throw new Error("render requires timeline and captions");
  advance(state, "render", "Rendering final video with FFmpeg");
  await syncDb(state);

  const outDir = episodeDir(episodeId);
  const result = await renderPodcastVideo({
    timeline: state.timeline,
    episodeId,
    outputDir: outDir,
    captionsSrtPath: state.captions.path,
    captionsVttPath: episodeDir(episodeId) + "/captions.vtt",
    finalName: "final.mp4",
    heartbeat: () => heartbeat({ step: "render-alive" }),
  });

  const finalBytes = readFileSync(result.finalPath);
  const sha = sha256Hex(finalBytes);

  const finalArtifact: ArtifactRecord = {
    id: `art_final_${sha.slice(0, 16)}`,
    kind: "final-video",
    mediaType: "video",
    provider: "ffmpeg",
    model: "ffmpeg-pipeline",
    capability: "VIDEO",
    storageKey: `${episodeId}/assets/final.mp4`,
    fileName: "final.mp4",
    sizeBytes: finalBytes.length,
    sha256: sha,
    mimeType: "video/mp4",
    createdAt: new Date().toISOString(),
    metadata: { filePath: result.finalPath, renderLog: result.renderLog },
  };
  await artifactRegistry.register(finalArtifact);

  state.final = {
    videoPath: result.finalPath,
    thumbnailPath: result.thumbnailPath,
    sizeBytes: finalBytes.length,
    sha256: sha,
    durationSec: 0,
  };

  writeArtifactJson(episodeId, "render.json", {
    inputs: result.renderLog.inputs,
    ffmpegExitCode: result.renderLog.ffmpegExitCode,
    stderrTail: result.renderLog.stderrTail.slice(-2000),
    output: { path: result.finalPath, bytes: result.renderLog.outputBytes, sha256: sha },
    thumbnail: result.thumbnailPath,
  });

  saveState(state);
  await syncDb(state);
  heartbeat({ step: "render-done", bytes: finalBytes.length });
  return episodeId;
}
