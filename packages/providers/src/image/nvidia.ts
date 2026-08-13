import { env, redact } from "@vox/config";
import type { ImageProvider, MediaRequest, MediaResponse } from "../types.js";

/**
 * NVIDIA NIM image generation/editing via the build.nvidia.com genai gateway
 * (model qwen/qwen-image-edit as configured in the project env).
 * The configured account may or may not be granted access to this function.
 * If the account has no access, the request fails honestly with a blocked error.
 */
export class NvidiaImageProvider implements ImageProvider {
  readonly capability = "IMAGE" as const;
  readonly isMock = false;
  readonly model: string;
  private apiKey: string | undefined;

  constructor() {
    this.model = env.NVIDIA_QWEN_MODEL;
    this.apiKey = env.NVIDIA_QWEN_API_KEY || env.NVIDIA_API_KEY;
  }

  get name(): string {
    return "nvidia-nim-image";
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  configurationError(): string | undefined {
    return this.isConfigured() ? undefined : `${this.model} requires NVIDIA_QWEN_API_KEY`;
  }

  async generate(req: MediaRequest): Promise<MediaResponse> {
    if (!this.isConfigured()) throw new Error(this.configurationError());
    const url = `https://ai.api.nvidia.com/v1/genai/qwen/qwen-image-edit`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: req.prompt,
        response_format: "b64_json",
      }),
      signal: AbortSignal.timeout(180000),
    });
    const raw = await res.text();
    if (!res.ok) {
      const msg = redact(raw.slice(0, 500));
      throw new Error(`NVIDIA image gate blocked: HTTP ${res.status} ${msg}`);
    }
    const json = JSON.parse(raw) as { data?: { b64_json?: string }; b64_json?: string; request_id?: string };
    const b64 = json.data?.b64_json ?? json.b64_json;
    if (!b64) throw new Error("NVIDIA image response missing b64_json");
    const buf = Buffer.from(b64, "base64");
    return {
      binary: buf,
      mimeType: "image/png",
      requestId: json.request_id ?? `nvimg-${Date.now()}`,
      model: this.model,
      sizeBytes: buf.length,
    };
  }
}

export const nvidiaImageProvider = new NvidiaImageProvider();
