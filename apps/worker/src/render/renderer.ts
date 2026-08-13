import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { storage, sha256Hex } from "@vox/storage";
import { ffmpegCommand } from "@vox/media";
import type { TimelineData } from "@vox/contracts";

export interface RenderInput {
  timeline: TimelineData;
  episodeId: string;
  outputDir: string;
  captionsSrtPath: string;
  captionsVttPath: string;
  finalName?: string;
  heartbeat?: () => void;
}

export interface RenderResult {
  videoPath: string;
  finalPath: string;
  thumbnailPath: string;
  renderLog: {
    inputs: { key: string; path: string; sizeBytes: number }[];
    ffmpegExitCode: number;
    stderrTail: string;
    outputBytes: number;
  };
}

export function hasFilter(name: string): boolean {
  try {
    const out = execFileSync("ffmpeg", ["-filters"], { stdio: "pipe", encoding: "utf8" });
    return out.includes(` ${name} `) || out.split("\n").some((l) => l.trim().split(/\s+/).includes(name));
  } catch {
    return false;
  }
}

function fpsValue(timeline: TimelineData): number {
  return Math.min(30, Math.max(10, Math.round(timeline.fps || 24)));
}

/**
 * Renders a real MP4 from real image + audio assets:
 *  1. per-shot zoompan (Ken Burns) clips from real images
 *  2. dialogue audio track assembled from real TTS audio
 *  3. concat video clips, burn captions, mux audio -> H264/AAC final.mp4
 *  4. extract thumbnail frame
 */
export async function renderPodcastVideo(input: RenderInput): Promise<RenderResult> {
  const { timeline, episodeId, outputDir } = input;
  const fps = fpsValue(timeline);
  const width = timeline.width || 1280;
  const height = timeline.height || 720;
  mkdirSync(outputDir, { recursive: true });

  const imageClips = timeline.clips.filter((c) => c.kind === "image");
  const audioClips = timeline.clips.filter((c) => c.kind === "audio").sort((a, b) => a.startSec - b.startSec);

  if (imageClips.length === 0) throw new Error("render: no image clips in timeline");
  if (audioClips.length === 0) throw new Error("render: no audio clips in timeline");

  const inputFiles: { key: string; path: string; sizeBytes: number }[] = [];
  const workDir = `${outputDir}/segments`;
  mkdirSync(workDir, { recursive: true });

  // 1) per-shot video segments from real images (zoompan)
  const segPaths: string[] = [];
  for (let i = 0; i < imageClips.length; i++) {
    const clip = imageClips[i];
    const srcPath = storage.pathFor(clip.source);
    const segPath = `${workDir}/seg_${i}.mp4`;
    const frames = Math.max(2, Math.round(clip.durationSec * fps));
    const filter =
      `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},` +
      `zoompan=z='min(zoom+0.0012,1.35)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${width}x${height}:fps=${fps},` +
      `format=yuv420p`;
    const args = [
      "-loop", "1", "-i", srcPath,
      "-vf", filter,
      "-t", String(clip.durationSec),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-an",
      segPath,
    ];
    const r = await ffmpegCommand(args, { timeoutMs: 120000, heartbeat: input.heartbeat, logPrefix: `shot-${i}` });
    if (!r.ok) throw new Error(`render shot ${i} failed: exit=${r.exitCode} ${r.stderr.slice(-600)}`);
    segPaths.push(segPath);
    inputFiles.push({ key: clip.source, path: srcPath, sizeBytes: statSize(srcPath) });
    input.heartbeat?.();
  }

  // 2) concat segments -> video.mp4
  const listPath = `${workDir}/concat.txt`;
  writeFileSync(listPath, segPaths.map((p) => `file '${p}'`).join("\n"), "utf8");
  const videoPath = `${outputDir}/video.mp4`;
  {
    const r = await ffmpegCommand(
      ["-f", "concat", "-safe", "0", "-i", listPath, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-an", videoPath],
      { timeoutMs: 180000, heartbeat: input.heartbeat },
    );
    if (!r.ok) throw new Error(`render concat failed: exit=${r.exitCode} ${r.stderr.slice(-600)}`);
  }

  // 3) assemble audio track: dialogue in order, pad to video duration
  const audioListPath = `${workDir}/audio.txt`;
  const audioPaths: string[] = [];
  for (const clip of audioClips) {
    const p = storage.pathFor(clip.source);
    audioPaths.push(p);
    inputFiles.push({ key: clip.source, path: p, sizeBytes: statSize(p) });
  }
  const audioConcatPath = `${outputDir}/dialogue.m4a`;
  const silenceFile = `${workDir}/silence.m4a`;
  {
    const r = await ffmpegCommand(
      ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", "0.45", "-c:a", "aac", "-b:a", "128k", silenceFile],
      { timeoutMs: 30000 },
    );
    if (!r.ok) throw new Error(`render silence failed`);
  }
  {
    // alternate: line, silence, line, silence ...
    const entries: string[] = [];
    for (let i = 0; i < audioPaths.length; i++) {
      entries.push(`file '${audioPaths[i]}'`);
      if (i < audioPaths.length - 1) entries.push(`file '${silenceFile}'`);
    }
    writeFileSync(audioListPath, entries.join("\n"), "utf8");
    const r = await ffmpegCommand(
      ["-f", "concat", "-safe", "0", "-i", audioListPath, "-c:a", "aac", "-b:a", "128k", audioConcatPath],
      { timeoutMs: 120000, heartbeat: input.heartbeat },
    );
    if (!r.ok) throw new Error(`render audio concat failed: exit=${r.exitCode} ${r.stderr.slice(-600)}`);
  }

  // video duration for padding
  const probe = await probeDuration(videoPath);

  // 4) burn captions + mux audio -> final.mp4
  const finalPath = `${outputDir}/${input.finalName ?? "final.mp4"}`;
  const useSubtitles = hasFilter("subtitles");
  const srtPath = input.captionsSrtPath;
  const vf = useSubtitles
    ? `subtitles='${srtPath.replaceAll("'", "'\\''")}':force_style='FontName=IBM Plex Sans Arabic,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00301811,Outline=2,Shadow=1,MarginV=34,Alignment=2'`
    : null;
  const args: string[] = ["-i", videoPath, "-i", audioConcatPath];
  if (vf) args.push("-vf", vf);
  args.push("-map", "0:v:0", "-map", "1:a:0");
  args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p");
  args.push("-c:a", "aac", "-b:a", "128k", "-ar", "44100");
  args.push("-movflags", "+faststart");
  if (probe.duration > 0) args.push("-t", String(probe.duration + 0.5));
  args.push("-shortest", finalPath);
  const renderRun = await ffmpegCommand(args, { timeoutMs: 300000, heartbeat: input.heartbeat });

  if (!renderRun.ok) {
    throw new Error(`render final failed: exit=${renderRun.exitCode} ${renderRun.stderr.slice(-800)}`);
  }

  // 5) thumbnail from first frame
  const thumbnailPath = `${outputDir}/thumbnail.jpg`;
  {
    const r = await ffmpegCommand(["-i", videoPath, "-ss", "0.1", "-vframes", "1", "-q:v", "4", thumbnailPath], { timeoutMs: 30000 });
    if (!r.ok) console.warn("thumbnail extraction failed (non-fatal)");
  }

  return {
    videoPath,
    finalPath,
    thumbnailPath,
    renderLog: {
      inputs: inputFiles,
      ffmpegExitCode: renderRun.exitCode,
      stderrTail: renderRun.stderr.slice(-4000),
      outputBytes: statSize(finalPath),
    },
  };
}

function statSize(p: string): number {
  try {
    return readFileSync(p).length;
  } catch {
    return 0;
  }
}

async function probeDuration(path: string): Promise<{ duration: number }> {
  try {
    const out = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path], { encoding: "utf8", timeout: 30000 });
    return { duration: Number.parseFloat((out.stdout ?? "").trim()) || 0 };
  } catch {
    return { duration: 0 };
  }
}

export function writeRenderEvidence(outputDir: string, payload: unknown): void {
  const p = `${outputDir}/render.json`;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(payload, null, 2), "utf8");
}

export { sha256Hex };
