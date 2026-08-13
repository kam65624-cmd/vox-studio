import { env, redact } from "@vox/config";
import type { TextProvider, TextRequest, TextResponse } from "../types.js";

export interface NvidiaLlmOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  label?: string;
}

export class NvidiaNimTextProvider implements TextProvider {
  readonly capability = "TEXT" as const;
  readonly isMock = false;
  private apiKey: string | undefined;
  private baseUrl: string;
  readonly model: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(opts: NvidiaLlmOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? env.NVIDIA_BASE_URL;
    this.model = opts.model ?? env.NVIDIA_GLM_MODEL;
    this.timeoutMs = opts.timeoutMs ?? env.NVIDIA_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? env.NVIDIA_MAX_RETRIES;
  }

  get name(): string {
    return "nvidia-nim";
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  configurationError(): string | undefined {
    return this.isConfigured() ? undefined : `${this.model} requires NVIDIA NIM API key (NVIDIA_GLM_API_KEY / NVIDIA_MUSE_API_KEY / NVIDIA_API_KEY)`;
  }

  async generate(req: TextRequest): Promise<TextResponse> {
    if (!this.isConfigured()) {
      throw new Error(this.configurationError());
    }
    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: this.model,
      messages: [
        ...(req.system ? [{ role: "system" as const, content: req.system }] : []),
        { role: "user" as const, content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 1,
      top_p: 1,
      seed: req.seed ?? 42,
      stream: false,
    };

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        const raw = await res.text();
        if (!res.ok) {
          throw new Error(`NVIDIA HTTP ${res.status}: ${redact(raw.slice(0, 500))}`);
        }
        const json = JSON.parse(raw) as {
          id?: string;
          choices?: { message?: { content?: string } }[];
          usage?: Record<string, unknown>;
        };
        const text = json.choices?.[0]?.message?.content ?? "";
        if (!text.trim()) throw new Error("NVIDIA returned empty completion");
        return {
          text,
          requestId: json.id ?? `nv-${Date.now()}`,
          model: this.model,
          usage: json.usage,
        };
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
        }
      }
    }
    throw lastError ?? new Error("NVIDIA request failed");
  }
}

export const nvidiaGlamProvider = new NvidiaNimTextProvider({
  apiKey: env.NVIDIA_GLM_API_KEY || env.NVIDIA_API_KEY,
  model: env.NVIDIA_GLM_MODEL,
  label: "glm",
});

export const nvidiaMuseProvider = new NvidiaNimTextProvider({
  apiKey: env.NVIDIA_MUSE_API_KEY || env.NVIDIA_API_KEY,
  model: env.NVIDIA_MUSE_MODEL,
  label: "muse",
});
