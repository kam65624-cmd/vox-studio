/**
 * Visual Provider Unit Tests (P0-N Track N9)
 * 12 test scenarios — all mock HTTP, no real API calls needed.
 */

import { describe, it, expect, vi } from "vitest";
import { OpenAIVisualClient }  from "./visual/client";
import { OpenAIVisualAdapter } from "./visual/adapter";
import { getOpenAIVisualConfig } from "./visual/config";
import { ModelRegistry }       from "../index";

function makeMockFetch(status: number, data: any): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as unknown as Response);
}

describe("Visual Provider Abstraction (P0-N Track N1 & N9)", () => {
  it("1. loads OpenAIVisualConfig from process.env", () => {
    const cfg = getOpenAIVisualConfig();
    expect(cfg.providerId).toBe("openai-visual");
    expect(cfg.baseUrl).toBe("https://api.openai.com/v1");
    expect(cfg.defaultImageModel).toBe("dall-e-3");
    expect(cfg.defaultEditModel).toBe("dall-e-2");
  });

  it("2. returns isConfigured() false when API key is missing", () => {
    const client = new OpenAIVisualClient({ ...getOpenAIVisualConfig(), apiKey: "" });
    expect(client.isConfigured()).toBe(false);
  });

  it("3. sends correct Authorization header and JSON body for image generation", async () => {
    const mockFetch = makeMockFetch(200, {
      data: [{ url: "https://cdn.openai.com/image.png" }],
    });

    const client = new OpenAIVisualClient({
      ...getOpenAIVisualConfig(),
      apiKey: "test-openai-key",
    });

    const res = await client.generateImage(
      { prompt: "Cyberpunk broadcast studio", width: 1024, height: 1024 },
      mockFetch,
    );

    expect(res.success).toBe(true);
    expect(res.imageUrl).toBe("https://cdn.openai.com/image.png");
    expect(res.model).toBe("dall-e-3");

    const [url, init] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/images/generations");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer test-openai-key");
  });

  it("4. handles HTTP 401 as AUTH_ERROR non-transient", async () => {
    const mockFetch = makeMockFetch(401, { error: { message: "Invalid API key" } });
    const client = new OpenAIVisualClient({ ...getOpenAIVisualConfig(), apiKey: "bad-key" });

    const res = await client.generateImage({ prompt: "test" }, mockFetch);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("AUTH_ERROR");
    expect(res.error?.isTransient).toBe(false);
    expect(res.error?.message).not.toContain("bad-key");
  });

  it("5. handles HTTP 429 as RATE_LIMIT transient", async () => {
    const mockFetch = makeMockFetch(429, { error: { message: "Rate limit reached" } });
    const client = new OpenAIVisualClient({ ...getOpenAIVisualConfig(), apiKey: "key" });

    const res = await client.generateImage({ prompt: "test" }, mockFetch);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("RATE_LIMIT");
    expect(res.error?.isTransient).toBe(true);
  });

  it("6. handles HTTP 400 content policy violation as CONTENT_POLICY", async () => {
    const mockFetch = makeMockFetch(400, { error: { message: "Safety system content_policy warning" } });
    const client = new OpenAIVisualClient({ ...getOpenAIVisualConfig(), apiKey: "key" });

    const res = await client.generateImage({ prompt: "test" }, mockFetch);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("CONTENT_POLICY");
    expect(res.error?.isTransient).toBe(false);
  });

  it("7. redacts API key from error messages and sanitized config", async () => {
    const SECRET = "secret-key-12345";
    const mockFetch = makeMockFetch(500, { error: { message: "Server error" } });
    const client = new OpenAIVisualClient({ ...getOpenAIVisualConfig(), apiKey: SECRET });

    const res = await client.generateImage({ prompt: "test" }, mockFetch);
    expect(res.error?.message).not.toContain(SECRET);
    expect(JSON.stringify(client.getSanitizedConfig())).not.toContain(SECRET);
  });

  it("8. OpenAIVisualAdapter returns mock image URL in mock mode", async () => {
    const orig = process.env["VOX_RUNTIME_MODE"];
    process.env["VOX_RUNTIME_MODE"] = "mock";

    const adapter = new OpenAIVisualAdapter();
    const res = await adapter.generateImage({ prompt: "Test shot", width: 1024, height: 1024 });

    expect(res.imageUrl).toContain("mock://");
    expect(res.mediaKey).toBeTruthy();
    expect(res.costUsd).toBe(0.01);

    process.env["VOX_RUNTIME_MODE"] = orig;
  });

  it("9. OpenAIVisualAdapter throws AUTH_ERROR in real mode if key missing", async () => {
    const orig = process.env["VOX_RUNTIME_MODE"];
    process.env["VOX_RUNTIME_MODE"] = "real";

    const adapter = new OpenAIVisualAdapter({ apiKey: "" });
    await expect(adapter.generateImage({ prompt: "Test shot", width: 1024, height: 1024 })).rejects.toThrow("OPENAI_API_KEY is not configured");

    process.env["VOX_RUNTIME_MODE"] = orig;
  });

  it("10. OpenAIVisualAdapter.editImage returns edited image URL in mock mode", async () => {
    const orig = process.env["VOX_RUNTIME_MODE"];
    process.env["VOX_RUNTIME_MODE"] = "mock";

    const adapter = new OpenAIVisualAdapter();
    const res = await adapter.editImage({ prompt: "Add neon light", referenceImageKey: "ref-001", width: 1024, height: 1024 });

    expect(res.imageUrl).toContain("edited-ref-001");
    expect(res.mediaKey).toBeTruthy();

    process.env["VOX_RUNTIME_MODE"] = orig;
  });

  it("11. ModelRegistry contains dall-e-3 and dall-e-2 models", () => {
    const registry = new ModelRegistry();
    const imageGen = registry.getModelsByCapability("IMAGE_GENERATION");
    const imageEdit = registry.getModelsByCapability("IMAGE_EDITING");

    expect(imageGen.some((m: { modelId: string }) => m.modelId === "dall-e-3")).toBe(true);
    expect(imageEdit.some((m: { modelId: string }) => m.modelId === "dall-e-2")).toBe(true);
  });

  it("12. unsupported capabilities throw descriptive errors", async () => {
    const adapter = new OpenAIVisualAdapter();
    await expect(adapter.generateText({ prompt: "hi" })).rejects.toThrow("Text generation not supported");
    await expect(adapter.generateVideo({ prompt: "hi", durationSeconds: 5, aspectRatio: "16:9" })).rejects.toThrow("Video generation not supported");
  });
});
