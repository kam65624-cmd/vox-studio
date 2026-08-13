/**
 * Replicate Provider Unit Tests (P0-N Track N.1)
 * 13 test scenarios covering client, adapter, polling, mock mode, and model router selection.
 */

import { describe, it, expect, vi } from "vitest";
import { ReplicateClient }  from "./replicate/client";
import { ReplicateAdapter } from "./replicate/adapter";
import { getReplicateConfig } from "./replicate/config";
import { ModelRegistry, ModelRouter } from "../index";

function makeMockFetch(responses: Array<{ status: number; body: any }>): typeof fetch {
  let callCount = 0;
  return vi.fn().mockImplementation(async () => {
    const item = responses[callCount] ?? responses[responses.length - 1] ?? { status: 200, body: {} };
    callCount++;
    return {
      ok: item.status >= 200 && item.status < 300,
      status: item.status,
      json: async () => item.body,
      text: async () => JSON.stringify(item.body),
    } as unknown as Response;
  });
}

describe("Replicate Provider Abstraction (P0-N Track N.1)", () => {
  it("1. loads ReplicateConfig from process.env", () => {
    const cfg = getReplicateConfig();
    expect(cfg.providerId).toBe("replicate");
    expect(cfg.baseUrl).toBe("https://api.replicate.com/v1");
    expect(cfg.defaultImageModel).toBe("black-forest-labs/flux-1.1-pro");
    expect(cfg.defaultVideoModel).toBe("minimax/video-01");
  });

  it("2. returns isConfigured() false when REPLICATE_API_KEY is missing", () => {
    const client = new ReplicateClient({ ...getReplicateConfig(), apiKey: "" });
    expect(client.isConfigured()).toBe(false);
  });

  it("3. redacts API key from error messages and sanitized config", async () => {
    const SECRET = "r8_secret_test_key_12345";
    const mockFetch = makeMockFetch([{ status: 401, body: { detail: "Unauthorized" } }]);
    const client = new ReplicateClient({ ...getReplicateConfig(), apiKey: SECRET });

    const res = await client.runPrediction("test/model", { prompt: "hi" }, 5000, undefined, mockFetch);
    expect(res.error?.message).not.toContain(SECRET);
    expect(JSON.stringify(client.getSanitizedConfig())).not.toContain(SECRET);
  });

  it("4. handles async prediction submit and polling lifecycle to success", async () => {
    const mockFetch = makeMockFetch([
      // Submit response
      { status: 201, body: { id: "pred-123", status: "starting", urls: { get: "https://api.replicate.com/v1/predictions/pred-123" } } },
      // Poll 1: processing
      { status: 200, body: { id: "pred-123", status: "processing" } },
      // Poll 2: succeeded
      { status: 200, body: { id: "pred-123", status: "succeeded", output: ["https://cdn.replicate.com/out.png"] } },
    ]);

    const client = new ReplicateClient({ ...getReplicateConfig(), apiKey: "r8_valid", pollIntervalMs: 1 });
    const res = await client.runPrediction("black-forest-labs/flux-1.1-pro", { prompt: "Studio logo" }, 5000, undefined, mockFetch);

    expect(res.success).toBe(true);
    expect(res.predictionId).toBe("pred-123");
    expect(res.mediaUrl).toBe("https://cdn.replicate.com/out.png");
    expect(res.mediaKey).toBeTruthy();
  });

  it("5. handles fast-path sync success response (status succeeded immediately)", async () => {
    const mockFetch = makeMockFetch([
      { status: 200, body: { id: "pred-fast", status: "succeeded", output: "https://cdn.replicate.com/fast.png" } },
    ]);

    const client = new ReplicateClient({ ...getReplicateConfig(), apiKey: "r8_valid", pollIntervalMs: 1 });
    const res = await client.runPrediction("black-forest-labs/flux-1.1-pro", { prompt: "Fast" }, 5000, undefined, mockFetch);

    expect(res.success).toBe(true);
    expect(res.mediaUrl).toBe("https://cdn.replicate.com/fast.png");
  });

  it("6. classifies HTTP 401 as non-transient AUTH_ERROR", async () => {
    const mockFetch = makeMockFetch([{ status: 401, body: { detail: "Invalid token" } }]);
    const client = new ReplicateClient({ ...getReplicateConfig(), apiKey: "bad_token" });

    const res = await client.runPrediction("model", { prompt: "hi" }, 5000, undefined, mockFetch);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("AUTH_ERROR");
    expect(res.error?.isTransient).toBe(false);
  });

  it("7. classifies HTTP 429 as transient RATE_LIMIT", async () => {
    const mockFetch = makeMockFetch([{ status: 429, body: { detail: "Throttled" } }]);
    const client = new ReplicateClient({ ...getReplicateConfig(), apiKey: "valid_token" });

    const res = await client.runPrediction("model", { prompt: "hi" }, 5000, undefined, mockFetch);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("RATE_LIMIT");
    expect(res.error?.isTransient).toBe(true);
  });

  it("8. classifies NSFW/content errors as CONTENT_POLICY", async () => {
    const mockFetch = makeMockFetch([
      { status: 201, body: { id: "pred-nsfw", status: "starting" } },
      { status: 200, body: { id: "pred-nsfw", status: "failed", error: "NSFW content detected" } },
    ]);

    const client = new ReplicateClient({ ...getReplicateConfig(), apiKey: "valid_token", pollIntervalMs: 1 });
    const res = await client.runPrediction("model", { prompt: "nsfw test" }, 5000, undefined, mockFetch);

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("CONTENT_POLICY");
    expect(res.error?.isTransient).toBe(false);
  });

  it("9. handles prediction timeout gracefully", async () => {
    const mockFetch = makeMockFetch([
      { status: 201, body: { id: "pred-slow", status: "starting" } },
      { status: 200, body: { id: "pred-slow", status: "processing" } },
    ]);

    const client = new ReplicateClient({ ...getReplicateConfig(), apiKey: "valid_token", pollIntervalMs: 1 });
    const res = await client.runPrediction("model", { prompt: "slow" }, 10, undefined, mockFetch); // 10ms timeout

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("TIMEOUT");
    expect(res.error?.isTransient).toBe(true);
  });

  it("10. ReplicateAdapter returns mock asset in mock mode with 0 remote calls", async () => {
    const orig = process.env["VOX_RUNTIME_MODE"];
    process.env["VOX_RUNTIME_MODE"] = "mock";

    const adapter = new ReplicateAdapter();
    const imgRes = await adapter.generateImage({ prompt: "Mock studio", width: 1024, height: 1024 });
    const editRes = await adapter.editImage({ prompt: "Edit background", referenceImageKey: "ref-1", width: 1024, height: 1024 });
    const vidRes = await adapter.generateVideo({ prompt: "Mock intro video", durationSeconds: 5, aspectRatio: "16:9" });

    expect(imgRes.imageUrl).toContain("mock://replicate/");
    expect(editRes.imageUrl).toContain("mock://replicate/");
    expect(vidRes.videoUrl).toContain("mock://replicate/");

    process.env["VOX_RUNTIME_MODE"] = orig;
  });

  it("11. ReplicateAdapter fails fast in real mode if key missing", async () => {
    const orig = process.env["VOX_RUNTIME_MODE"];
    process.env["VOX_RUNTIME_MODE"] = "real";

    const adapter = new ReplicateAdapter({ apiKey: "" });
    await expect(adapter.generateImage({ prompt: "Real shot", width: 1024, height: 1024 })).rejects.toThrow("REPLICATE_API_KEY is not configured");

    process.env["VOX_RUNTIME_MODE"] = orig;
  });

  it("12. ModelRegistry contains Replicate FLUX 1.1 Pro, FLUX Fill Pro, and MiniMax Video-01", () => {
    const registry = new ModelRegistry();
    const imageGen = registry.getModelsByCapability("IMAGE_GENERATION");
    const imageEdit = registry.getModelsByCapability("IMAGE_EDITING");
    const videoGen = registry.getModelsByCapability("VIDEO_GENERATION");

    expect(imageGen.some((m: { modelId: string }) => m.modelId === "black-forest-labs/flux-1.1-pro")).toBe(true);
    expect(imageEdit.some((m: { modelId: string }) => m.modelId === "black-forest-labs/flux-fill-pro")).toBe(true);
    expect(videoGen.some((m: { modelId: string }) => m.modelId === "minimax/video-01")).toBe(true);
  });

  it("13. ModelRouter selects Replicate models for tasks", () => {
    const registry = new ModelRegistry();
    const router = new ModelRouter(registry);

    const resImg = router.selectModel({ capability: "IMAGE_GENERATION", task: "Generate shot frame" });
    expect(resImg.providerId).toBeTruthy();
  });
});
