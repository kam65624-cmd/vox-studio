import { env, redact } from "@vox/config";
import type { MediaRequest, MediaResponse, VideoProvider } from "../types.js";

/**
 * NVIDIA NIM hosted video generation via build.nvidia.com genai gateway.
 * The configured account does not currently have video functions granted;
 * the request fails honestly with a blocked error.
 */
export class NvidiaVideoProvider implements VideoProvider {
  readonly capability = "VIDEO" as const;
  readonly isMock = false;
  readonly model = "nvidia/ltx-video";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = env.NVIDIA_API_KEY;
  }

  get name(): string {
    return "nvidia-nim-video";
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  configurationError(): string | undefined {
    return this.isConfigured() ? undefined : "NVIDIA video requires NVIDIA_API_KEY";
  }

  async generate(req: MediaRequest): Promise<MediaResponse> {
    if (!this.isConfigured()) throw new Error(this.configurationError());
    const url = "https://ai.api.nvidia.com/v1/genai/nvidia/ltx-video";
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: req.prompt, duration: 4 }),
      signal: AbortSignal.timeout(300000),
    });
    const raw = await res.text();
    if (!res.ok) {
      throw new Error(`NVIDIA video gate blocked: HTTP ${res.status} ${redact(raw.slice(0, 500))}`);
    }
    const json = JSON.parse(raw) as { request_id?: string };
    const b64 = (raw.match(/"b64_json"\s*:\s*"([^"]+)"/)?.[1] ?? "") as string;
    if (!b64) throw new Error("NVIDIA video response missing media payload");
    const buf = Buffer.from(b64, "base64");
    return { binary: buf, mimeType: "video/mp4", requestId: json.request_id ?? `nvvideo-${Date.now()}`, model: this.model, sizeBytes: buf.length };
  }
}

export const nvidiaVideoProvider = new NvidiaVideoProvider();
