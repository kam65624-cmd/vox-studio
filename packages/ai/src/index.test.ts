import { describe, it, expect } from "vitest";
import {
  MockTextModelProvider,
  MockImageModelProvider,
  MockVideoModelProvider,
  MockVoiceModelProvider,
  UnifiedMockAdapter,
  ModelRegistry,
  ModelRouter,
  createGenerationProvenance,
  INITIAL_MODEL_REGISTRY,
} from "./index";
import { ModelDefinition } from "@vox/contracts";

describe("P0-I Legacy Mock Providers", () => {
  it("MockTextModelProvider returns valid response", async () => {
    const provider = new MockTextModelProvider();
    const res = await provider.generateText({ prompt: "Hello world" });
    expect(res.text).toContain("Hello world");
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it("MockImageModelProvider returns valid media key", async () => {
    const provider = new MockImageModelProvider();
    const res = await provider.generateImage({ prompt: "Prof. Tradeo", width: 1024, height: 1024 });
    expect(res.mediaKey).toBeDefined();
    expect(res.imageUrl).toContain("http");
  });

  it("MockVideoModelProvider returns requested duration", async () => {
    const provider = new MockVideoModelProvider();
    const res = await provider.generateVideo({ prompt: "VOX Explainer", durationSeconds: 10, aspectRatio: "16:9" });
    expect(res.durationSeconds).toBe(10);
  });

  it("MockVoiceModelProvider generates estimated duration", async () => {
    const provider = new MockVoiceModelProvider();
    const res = await provider.generateVoice({ text: "هذا هو التقرير الاقتصادي الخاص بأسواق المال اليوم.", voiceId: "tradeo-ar", language: "ar" });
    expect(res.durationSeconds).toBeGreaterThan(0);
  });
});

describe("P0-I 12 Required Test Scenarios", () => {
  // Scenario 1: Model Registration
  it("Scenario 1: should register custom models in ModelRegistry", () => {
    const registry = new ModelRegistry([]);
    const customModel: ModelDefinition = {
      modelId: "custom/test-llm",
      providerId: "custom-provider",
      displayName: "Custom Test LLM",
      version: "1.0.0",
      capabilities: ["TEXT_GENERATION", "REASONING"],
      modalities: { inputs: ["text"], outputs: ["text"] },
      languages: ["en"],
      maxInput: 4096,
      maxOutput: 1024,
      qualityTier: "STANDARD",
      speedTier: "FAST",
      costTier: "LOW",
      supportsStreaming: true,
      supportsBatch: false,
      supportsStructuredOutput: false,
      supportsImageReference: false,
      supportsImageEditing: false,
      supportsVideo: false,
      supportsAudio: false,
      availability: "ONLINE",
    };
    registry.registerModel(customModel);
    expect(registry.getModel("custom/test-llm")).toEqual(customModel);
    expect(registry.listModels()).toHaveLength(1);
  });

  // Scenario 2: Capability Validation
  it("Scenario 2: should filter models strictly by capability", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const visionModels = registry.getModelsByCapability("VISION");
    expect(visionModels.length).toBeGreaterThan(0);
    expect(visionModels.every((m) => m.capabilities.includes("VISION"))).toBe(true);
    expect(visionModels.some((m) => m.modelId === "zai/glm-5.2")).toBe(true);
  });

  // Scenario 3: Router Selection
  it("Scenario 3: router should select an appropriate model for a valid request", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const response = router.selectModel({
      capability: "TEXT_GENERATION",
      task: "Generate Script Doctor Analysis",
    });
    expect(response.selectedModel).toBeDefined();
    expect(response.providerId).toBeDefined();
    expect(response.reason).toContain("TEXT_GENERATION");
  });

  // Scenario 4: Deterministic Routing
  it("Scenario 4: router selection must be 100% deterministic given identical inputs", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const req = { capability: "IMAGE_EDITING" as const, task: "Crop character puppet" };
    const res1 = router.selectModel(req);
    const res2 = router.selectModel(req);
    expect(res1.selectedModel.modelId).toBe(res2.selectedModel.modelId);
    expect(res1.fallbackChain).toEqual(res2.fallbackChain);
  });

  // Scenario 5: Unsupported Capability Rejection
  it("Scenario 5: should reject routing if capability is not registered", () => {
    const emptyRegistry = new ModelRegistry([]);
    const router = new ModelRouter(emptyRegistry);
    expect(() =>
      router.selectModel({ capability: "AUDIO_GENERATION", task: "Generate background track" })
    ).toThrow("No models registered supporting capability");
  });

  // Scenario 6: Fallback Selection
  it("Scenario 6: should build valid fallback chain when multiple models support capability", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const response = router.selectModel({ capability: "TEXT_GENERATION", task: "Scriptwriting" });
    expect(response.fallbackChain.length).toBeGreaterThan(0);
  });

  // Scenario 7: Language Compatibility
  it("Scenario 7: should respect language constraints during model routing", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const response = router.selectModel({
      capability: "VIDEO_GENERATION",
      task: "Render Video",
      language: "en",
    });
    expect(response.selectedModel.languages).toContain("en");
  });

  // Scenario 8: Constraint Compatibility
  it("Scenario 8: should respect latency and cost preferences", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const response = router.selectModel({
      capability: "IMAGE_EDITING",
      task: "Edit Shot Background",
      latencyRequirement: "FAST",
      costPreference: "LOW",
    });
    expect(response.selectedModel.modelId).toBe("qwen/qwen-image-edit");
  });

  // Scenario 9: Provider Adapter Contract
  it("Scenario 9: UnifiedMockAdapter should fulfill the canonical provider interface", async () => {
    const adapter = new UnifiedMockAdapter();
    expect(adapter.providerId).toBe("vox-mock-provider");
    const textRes = await adapter.generateText?.({ prompt: "Test prompt" });
    expect(textRes?.text).toBeDefined();
    const editRes = await adapter.editImage?.({ prompt: "Edit background", width: 1024, height: 1024, referenceImageKey: "ref-123" });
    expect(editRes?.mediaKey).toBe("edited-ref-123");
  });

  // Scenario 10: Provenance Creation
  it("Scenario 10: createGenerationProvenance should produce valid trace metadata", () => {
    const prov = createGenerationProvenance({
      providerId: "meta",
      modelId: "meta/muse-glimmer-30b",
      modelVersion: "3.0.0",
      generationRequestId: "req-001",
      creativeDnaVersion: 1,
      styleSkillVersion: "1.0",
      episodeId: "ep-1",
      sceneId: "scene-1",
      shotId: "shot-s1-a",
      productionNodeId: "node-101",
    });
    expect(prov.id).toContain("prov-");
    expect(prov.modelId).toBe("meta/muse-glimmer-30b");
    expect(prov.createdAt).toBeDefined();
  });

  // Scenario 11: Unknown Capability Handling
  it("Scenario 11: should handle UNKNOWN capability without crashing", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const unknownModels = registry.getModelsByCapability("UNKNOWN");
    expect(Array.isArray(unknownModels)).toBe(true);
  });

  // Scenario 12: No Silent Quality Downgrade
  it("Scenario 12: should reject models if required quality cannot be met without silent downgrade", () => {
    const registry = new ModelRegistry([
      {
        modelId: "low-quality/model",
        providerId: "low-p",
        displayName: "Low Quality Model",
        version: "1.0",
        capabilities: ["TEXT_GENERATION"],
        modalities: { inputs: ["text"], outputs: ["text"] },
        languages: ["en"],
        maxInput: 1000,
        maxOutput: 1000,
        qualityTier: "LOW",
        speedTier: "FAST",
        costTier: "FREE",
        supportsStreaming: false,
        supportsBatch: false,
        supportsStructuredOutput: false,
        supportsImageReference: false,
        supportsImageEditing: false,
        supportsVideo: false,
        supportsAudio: false,
        availability: "ONLINE",
      },
    ]);
    const router = new ModelRouter(registry);

    expect(() =>
      router.selectModel({
        capability: "TEXT_GENERATION",
        task: "High-end Script Generation",
        qualityRequirement: "PREMIUM",
      })
    ).toThrow("Cannot fulfill quality requirement PREMIUM");
  });
});
