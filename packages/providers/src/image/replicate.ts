import { env, redact } from "@vox/config";
import type { ImageProvider, MediaRequest, MediaResponse } from "../types.js";

export class ReplicateImageProvider implements ImageProvider {
  readonly capability = "IMAGE" as const;
  readonly isMock = false;
  readonly model = "black-forest-labs/flux-schnell";
  private token: string | undefined;

  constructor() {
    this.token = env.REPLICATE_API_TOKEN;
  }

  get name(): string {
    return "replicate";
  }

  isConfigured(): boolean {
    return !!this.token && this.token.trim().length > 0;
  }

  configurationError(): string | undefined {
    return this.isConfigured() ? undefined : "Replicate image requires REPLICATE_API_TOKEN";
  }

  async generate(req: MediaRequest): Promise<MediaResponse> {
    if (!this.isConfigured()) throw new Error(this.configurationError());
    const base = env.REPLICATE_BASE_URL;
    const create = await fetch(`${base}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-schnell",
        input: { prompt: req.prompt, num_outputs: 1, aspect_ratio: "16:9" },
      }),
      signal: AbortSignal.timeout(300000),
    });
    const createJson = (await create.json()) as { id?: string; status?: string; output?: unknown; error?: string };
    if (!create.ok) {
      throw new Error(`Replicate create failed: HTTP ${create.status} ${redact(JSON.stringify(createJson).slice(0, 500))}`);
    }
    const predictionId = createJson.id ?? "unknown";
    const output = createJson.output;
    if (typeof output !== "string") {
      throw new Error(`Replicate prediction ${predictionId} produced no output URL (status=${createJson.status})`);
    }
    const dl = await fetch(output, { signal: AbortSignal.timeout(120000) });
    if (!dl.ok) throw new Error(`Replicate output download failed: HTTP ${dl.status}`);
    const buf = Buffer.from(await dl.arrayBuffer());
    return {
      binary: buf,
      mimeType: "image/png",
      requestId: predictionId,
      model: this.model,
      sizeBytes: buf.length,
      sourceUrl: output,
    };
  }
}

export const replicateImageProvider = new ReplicateImageProvider();
