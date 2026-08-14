/**
 * Video Provider Unit Tests (P0-N Track N9)
 * 10 test scenarios — mock HTTP polling lifecycle.
 */

import { describe, it, expect, vi } from "vitest";
import { RealVideoClient }   from "./video/client";
import { RealVideoAdapter }  from "./video/adapter";
import { getRealVideoConfig } from "./video/config";
import { ModelRegistry }      from "../index";

describe("Real Video Provider Abstraction (P0-N Track N2 & N9)", () => {
  it("1. loads RealVideoConfig from process.env", () => {
    const cfg = getRealVideoConfig();
    expect(cfg.providerId).toBe("runway-video");
    expect(cfg.defaultVideoModel).toBe("gen3a_turbo");
    expect(cfg.pollIntervalMs).toBe(5000);
  });

  it("2. returns isConfigured() false when API key is missing", () => {
    const client = new RealVideoClient({ ...getRealVideoConfig(), apiKey: "" });
    expect(client.isConfigured()).toBe(false);
  });

  it("3. handles async submit and poll status lifecycle", async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      if (url.endsWith("/tasks")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "task-test-001" }),
        } as Response;
      }
      // Poll response
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: callCount > 2 ? "SUCCEEDED" : "PENDING",
          output: ["https://cdn.runwayml.com/generated.mp4"],
        }),
      } as Response;
    });

    const client = new RealVideoClient({
      ...getRealVideoConfig(),
      apiKey: "test-video-key",
      pollIntervalMs: 1, // fast poll for test
    });

    const res = await client.generateVideo(
      { prompt: "Flying over mountains", durationSeconds: 5 },
      undefined,
      mockFetch as any,
    );

    expect(res.success).toBe(true);
    expect(res.videoUrl).toBe("https://cdn.runwayml.com/generated.mp4");
    expect(res.durationSeconds).toBe(5);
  });

  it("4. handles task failure response", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/tasks")) {
        return { ok: true, status: 200, json: async () => ({ id: "task-fail-001" }) } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: "FAILED", failure: "Content policy violation" }),
      } as Response;
    });

    const client = new RealVideoClient({ ...getRealVideoConfig(), apiKey: "key", pollIntervalMs: 1 });
    const res = await client.generateVideo({ prompt: "test" }, undefined, mockFetch as any);

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("PROVIDER_ERROR");
  });

  it("5. redacts API key from error messages", async () => {
    const SECRET = "runway-secret-key-999";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as Response);

    const client = new RealVideoClient({ ...getRealVideoConfig(), apiKey: SECRET });
    const res = await client.generateVideo({ prompt: "test" }, undefined, mockFetch as any);

    expect(res.error?.message).not.toContain(SECRET);
  });

  it("6. RealVideoAdapter returns mock video in mock mode", async () => {
    const orig = process.env["VOX_RUNTIME_MODE"];
    process.env["VOX_RUNTIME_MODE"] = "mock";

    const adapter = new RealVideoAdapter();
    const res = await adapter.generateVideo({ prompt: "Mock video shot", durationSeconds: 5, aspectRatio: "16:9" });

    expect(res.videoUrl).toContain("mock://");
    expect(res.mediaKey).toBeTruthy();
    expect(res.durationSeconds).toBe(5);

    process.env["VOX_RUNTIME_MODE"] = orig;
  });

  it("7. RealVideoAdapter fails fast in real mode if key missing", async () => {
    const orig = process.env["VOX_RUNTIME_MODE"];
    process.env["VOX_RUNTIME_MODE"] = "real";

    const adapter = new RealVideoAdapter({ apiKey: "" });
    await expect(adapter.generateVideo({ prompt: "Shot", durationSeconds: 5, aspectRatio: "16:9" })).rejects.toThrow("RUNWAY_API_KEY");

    process.env["VOX_RUNTIME_MODE"] = orig;
  });

  it("8. ModelRegistry contains runway/gen-3-alpha model", () => {
    const registry = new ModelRegistry();
    const videoModels = registry.getModelsByCapability("VIDEO_GENERATION");
    expect(videoModels.some((m: { modelId: string }) => m.modelId === "runway/gen-3-alpha")).toBe(true);
  });
});
