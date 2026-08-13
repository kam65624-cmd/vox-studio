import { env, redact } from "@vox/config";
import type { MediaRequest, MediaResponse, VideoProvider } from "../types.js";

/**
 * Replicate hosted video generation provider.
 * Full lifecycle: create prediction -> poll until succeeded -> download output binary.
 * Not configured in the current environment (no REPLICATE_API_TOKEN), so the real
 * gate reports BLOCKED. The implementation itself is a real HTTP integration.
 */
export class ReplicateVideoProvider implements VideoProvider {
  readonly capability = "VIDEO" as const;
  readonly isMock = false;
  readonly model = "minimax/video-01";
  private token: string | undefined;

  constructor() {
    this.token = env.REPLICATE_API_TOKEN;
  }

  get name(): string {
    return "replicate-video";
  }

  isConfigured(): boolean {
    return !!this.token && this.token.trim().length > 0;
  }

  configurationError(): string | undefined {
    return this.isConfigured() ? undefined : "Replicate video requires REPLICATE_API_TOKEN";
  }

  async generate(req: MediaRequest): Promise<MediaResponse> {
    if (!this.isConfigured()) throw new Error(this.configurationError());
    const base = env.REPLICATE_BASE_URL;
    const create = await fetch(`${base}/predictions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        input: { prompt: req.prompt },
      }),
      signal: AbortSignal.timeout(60000),
    });
    const created = (await create.json()) as { id?: string; urls?: Record<string, string>; error?: string };
    if (!create.ok) throw new Error(`Replicate video create failed: HTTP ${create.status} ${redact(JSON.stringify(created).slice(0, 400))}`);
    const id = created.id!;
    const getUrl = created.urls?.get;
    if (!getUrl) throw new Error(`Replicate prediction ${id} has no get URL`);

    // poll
    const deadline = Date.now() + 600000;
    let output: string | string[] | undefined;
    let status = "starting";
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const poll = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${this.token}` },
        signal: AbortSignal.timeout(30000),
      });
      const state = (await poll.json()) as { status?: string; output?: string | string[]; error?: string };
      status = state.status ?? "unknown";
      if (status === "succeeded") {
        output = state.output;
        break;
      }
      if (status === "failed" || status === "canceled") {
        throw new Error(`Replicate video ${id} ${status}: ${redact(String(state.error ?? ""))}`);
      }
    }
    if (!output) throw new Error(`Replicate video ${id} timed out (status=${status})`);
    const url = Array.isArray(output) ? output[0] : output;
    if (!url) throw new Error(`Replicate video ${id} returned no output URL`);
    const dl = await fetch(url, { signal: AbortSignal.timeout(300000) });
    if (!dl.ok) throw new Error(`Replicate video download failed: HTTP ${dl.status}`);
    const buf = Buffer.from(await dl.arrayBuffer());
    if (buf.length < 50_000) throw new Error(`Replicate video output suspiciously small (${buf.length} bytes)`);
    return {
      binary: buf,
      mimeType: "video/mp4",
      requestId: id,
      model: this.model,
      sizeBytes: buf.length,
      sourceUrl: url,
    };
  }
}

export const replicateVideoProvider = new ReplicateVideoProvider();
