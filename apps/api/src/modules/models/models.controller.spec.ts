import { describe, it, expect, beforeEach } from "vitest";
import { ModelsController } from "./models.controller";

describe("ModelsController", () => {
  let controller: ModelsController;

  beforeEach(() => {
    controller = new ModelsController();
  });

  it("should list registered models", () => {
    const res = controller.getModels();
    expect(res.models.length).toBeGreaterThan(0);
    expect(res.models.some((m: any) => m.modelId === "meta/muse-glimmer-30b")).toBe(true);
    expect(res.models.some((m: any) => m.modelId === "z-ai/glm-5.2")).toBe(true);
    expect(res.models.some((m: any) => m.modelId === "qwen/qwen-image-edit")).toBe(true);
  });

  it("should get specific model details", () => {
    const model = controller.getModel("meta/muse-glimmer-30b");
    expect(model.modelId).toBe("meta/muse-glimmer-30b");
    expect(model.providerId).toBe("nvidia");
  });

  it("should return providers list", () => {
    const res = controller.getProviders();
    expect(res.providers.length).toBeGreaterThan(0);
    expect(res.providers.some((p: any) => p.providerId === "nvidia")).toBe(true);
  });

  it("should return capabilities list", () => {
    const res = controller.getCapabilities();
    expect(res.capabilities).toContain("TEXT_GENERATION");
    expect(res.capabilities).toContain("UNKNOWN");
  });

  it("should route request deterministically", () => {
    const res = controller.routeRequest({
      capability: "TEXT_GENERATION",
      task: "Generate script for Tradeo Pod",
    });
    expect(res.selectedModel).toBeDefined();
    expect(res.fallbackChain.length).toBeGreaterThan(0);
  });
});
