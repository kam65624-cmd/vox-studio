import type { ImageProvider, MediaRequest, MediaResponse } from "../types.js";

export class PollinationsImageProvider implements ImageProvider {
  readonly capability = "IMAGE" as const;
  readonly isMock = false;
  readonly model = "flux";

  get name(): string {
    return "pollinations";
  }

  isConfigured(): boolean {
    return true; // keyless public hosted service
  }

  configurationError(): string | undefined {
    return undefined;
  }

  async generate(req: MediaRequest): Promise<MediaResponse> {
    const width = req.width ?? 1280;
    const height = req.height ?? 720;
    const prompt = encodeURIComponent(req.prompt);
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&seed=${req.seed ?? 42}&nologo=true&model=flux`;
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(180000),
      headers: { Accept: "image/*" },
    });
    if (!res.ok) {
      throw new Error(`Pollinations HTTP ${res.status} for ${url.slice(0, 120)}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 4096) {
      throw new Error(`Pollinations returned suspiciously small image (${buf.length} bytes)`);
    }
    const contentType = res.headers.get("content-type") ?? "image/png";
    return {
      binary: buf,
      mimeType: contentType,
      requestId: `poll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      model: this.model,
      sizeBytes: buf.length,
      sourceUrl: url,
    };
  }
}

export const pollinationsImageProvider = new PollinationsImageProvider();
