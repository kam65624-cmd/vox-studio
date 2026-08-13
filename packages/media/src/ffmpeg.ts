import { spawn } from "node:child_process";
import { redact } from "@vox/config";

export interface FfmpegRunOptions {
  timeoutMs?: number;
  heartbeat?: () => void;
  heartbeatIntervalMs?: number;
  logPrefix?: string;
}

export interface FfmpegRunResult {
  exitCode: number;
  stderr: string;
  command: string;
  ok: boolean;
}

export function ffmpegCommand(args: string[], opts: FfmpegRunOptions = {}): Promise<FfmpegRunResult> {
  return new Promise((resolve) => {
    const timeoutMs = opts.timeoutMs ?? 20 * 60_000;
    const child = spawn("ffmpeg", ["-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    let timer: NodeJS.Timeout | undefined;
    let hb: NodeJS.Timeout | undefined;

    const kill = () => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* noop */
      }
    };

    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString("utf8");
      if (stderr.length > 4 * 1024 * 1024) stderr = stderr.slice(-2 * 1024 * 1024);
    });

    child.on("spawn", () => {
      timer = setTimeout(kill, timeoutMs);
      if (opts.heartbeat) {
        hb = setInterval(() => opts.heartbeat?.(), opts.heartbeatIntervalMs ?? 10_000);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      clearInterval(hb);
      resolve({ exitCode: -1, stderr: String(err.message), command: "", ok: false });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      clearInterval(hb);
      resolve({ exitCode: code ?? -1, stderr, command: `ffmpeg -y ${args.join(" ")}`, ok: code === 0 });
    });
  });
}

export function logFfmpegSafe(r: FfmpegRunResult): void {
  console.log(`[ffmpeg] exit=${r.exitCode} ok=${r.ok}`);
  if (!r.ok) {
    console.log(`[ffmpeg] stderr tail:\n${redact(r.stderr.slice(-3000))}`);
  }
}
