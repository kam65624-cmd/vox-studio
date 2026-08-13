import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface FfprobeResult {
  format?: { format_name?: string; duration?: number | string; bit_rate?: string | number; size?: string | number };
  streams?: {
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    duration?: string | number;
    bit_rate?: string | number;
    sample_rate?: string | number;
    channels?: number;
  }[];
}

export async function ffprobeJson(target: string): Promise<FfprobeResult> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    target,
  ], { maxBuffer: 32 * 1024 * 1024, timeout: 60000 });
  return JSON.parse(stdout) as FfprobeResult;
}

export interface ProbeSummary {
  formatName: string;
  durationSec: number;
  bitRate: number;
  sizeBytes: number;
  videoStreams: number;
  audioStreams: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string;
  fps: number;
}

export async function probeSummary(target: string): Promise<ProbeSummary> {
  const probe = await ffprobeJson(target);
  const format = probe.format ?? {};
  const video = (probe.streams ?? []).find((s) => s.codec_type === "video");
  const audio = (probe.streams ?? []).find((s) => s.codec_type === "audio");
  const fpsRaw = String(video?.codec_name === "h264" ? format.format_name : "");
  const fps = video ? parseFps(video as never) : 0;
  return {
    formatName: format.format_name ?? "",
    durationSec: Number(format.duration ?? 0),
    bitRate: Number(format.bit_rate ?? 0),
    sizeBytes: Number(format.size ?? 0),
    videoStreams: (probe.streams ?? []).filter((s) => s.codec_type === "video").length,
    audioStreams: (probe.streams ?? []).filter((s) => s.codec_type === "audio").length,
    width: video?.width ?? 0,
    height: video?.height ?? 0,
    videoCodec: video?.codec_name ?? "",
    audioCodec: audio?.codec_name ?? "",
    fps,
  };
}

function parseFps(video: { avg_frame_rate?: string }): number {
  const [a, b] = (video.avg_frame_rate ?? "0/1").split("/").map(Number);
  return b > 0 ? a / b : 0;
}
