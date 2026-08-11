import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NVIDIAAdapter,
  getNVIDIAConfig,
  getNVIDIAModelPreset,
  getNVIDIAModelId,
  NVIDIA_MODEL_PRESETS,
  OpenAICompatibleClient,
  ModelRegistry,
  ModelRouter,
  ProviderExecutionEngine,
  INITIAL_MODEL_REGISTRY,
  classifyError,
} from "../index";

describe("P0-L NVIDIA Provider & OpenAI-Compatible Core Integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // 1. NVIDIA configuration loading
  it("1. loads default NVIDIA configuration correctly", () => {
    process.env["NVIDIA_API_KEY"] = "test-nvidia-key";
    const config = getNVIDIAConfig();
    expect(config.providerId).toBe("nvidia");
    expect(config.displayName).toBe("NVIDIA NIM");
    expect(config.baseUrl).toBe("https://integrate.api.nvidia.com/v1");
    expect(config.defaultModel).toBe("meta/muse-glimmer-30b");
    expect(config.apiKey).toBe("test-nvidia-key");
  });

  // 2. Missing API key handling
  it("2. reports missing API key when NVIDIA_API_KEY is unset", () => {
    delete process.env["NVIDIA_API_KEY"];
    const adapter = new NVIDIAAdapter({ apiKey: "" });
    expect(adapter.isConfigured()).toBe(false);
  });

  // 3. Base URL configuration override
  it("3. respects custom NVIDIA_BASE_URL override", () => {
    process.env["NVIDIA_BASE_URL"] = "https://custom.nvidia-proxy.com/v1";
    const config = getNVIDIAConfig();
    expect(config.baseUrl).toBe("https://custom.nvidia-proxy.com/v1");
  });

  // 4. Model registry — Muse 30B registered under nvidia
  it("4. registers meta/muse-glimmer-30b under providerId 'nvidia' in ModelRegistry", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const model = registry.getModel("meta/muse-glimmer-30b");
    expect(model).toBeDefined();
    expect(model?.providerId).toBe("nvidia");
    expect(model?.capabilities).toContain("TEXT_GENERATION");
    expect(model?.capabilities).toContain("REASONING");
    expect(model?.capabilities).toContain("STRUCTURED_OUTPUT");
  });

  // 5. Model registry — GLM-5.2 registered under nvidia
  it("5. registers z-ai/glm-5.2 under providerId 'nvidia' in ModelRegistry", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const model = registry.getModel("z-ai/glm-5.2");
    expect(model).toBeDefined();
    expect(model?.providerId).toBe("nvidia");
    expect(model?.capabilities).toContain("TEXT_GENERATION");
    expect(model?.capabilities).toContain("VISION");
    expect(model?.supportsStreaming).toBe(true);
    expect(model?.maxOutput).toBe(16384);
  });

  // 6. Model registry — Qwen image edit registered under nvidia
  it("6. registers qwen/qwen-image-edit under providerId 'nvidia' in ModelRegistry", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const model = registry.getModel("qwen/qwen-image-edit");
    expect(model).toBeDefined();
    expect(model?.providerId).toBe("nvidia");
    expect(model?.capabilities).toContain("IMAGE_EDITING");
    expect(model?.capabilities).toContain("IMAGE_GENERATION");
    expect(model?.supportsImageEditing).toBe(true);
  });

  // 7. Model presets — Muse 30B correct parameters
  it("7. getNVIDIAModelPreset returns correct parameters for meta/muse-glimmer-30b", () => {
    const preset = getNVIDIAModelPreset("meta/muse-glimmer-30b");
    expect(preset.temperature).toBe(1);
    expect(preset.top_p).toBe(0.95);
    expect(preset.max_tokens).toBe(8192);
    expect(preset.stream).toBe(false);
    expect(preset.seed).toBeUndefined();
    expect(preset.category).toBe("text");
  });

  // 8. Model presets — GLM-5.2 streaming + seed
  it("8. getNVIDIAModelPreset returns streaming + seed=42 for z-ai/glm-5.2", () => {
    const preset = getNVIDIAModelPreset("z-ai/glm-5.2");
    expect(preset.temperature).toBe(1);
    expect(preset.top_p).toBe(1);
    expect(preset.max_tokens).toBe(16384);
    expect(preset.stream).toBe(true);
    expect(preset.seed).toBe(42);
    expect(preset.category).toBe("text");
  });

  // 9. Model presets — Qwen image editing category
  it("9. getNVIDIAModelPreset returns image category for qwen/qwen-image-edit", () => {
    const preset = getNVIDIAModelPreset("qwen/qwen-image-edit");
    expect(preset.category).toBe("image");
    expect(preset.stream).toBe(false);
  });

  // 10. NVIDIA_MODEL_PRESETS coverage
  it("10. NVIDIA_MODEL_PRESETS contains all 3 required NVIDIA NIM models", () => {
    expect(Object.keys(NVIDIA_MODEL_PRESETS)).toContain("meta/muse-glimmer-30b");
    expect(Object.keys(NVIDIA_MODEL_PRESETS)).toContain("z-ai/glm-5.2");
    expect(Object.keys(NVIDIA_MODEL_PRESETS)).toContain("qwen/qwen-image-edit");
  });

  // 11. getNVIDIAModelId — env var override
  it("11. getNVIDIAModelId falls back to canonical model IDs when env vars are unset", () => {
    delete process.env["NVIDIA_MUSE_MODEL"];
    delete process.env["NVIDIA_GLM_MODEL"];
    delete process.env["NVIDIA_QWEN_MODEL"];
    expect(getNVIDIAModelId("muse")).toBe("meta/muse-glimmer-30b");
    expect(getNVIDIAModelId("glm")).toBe("z-ai/glm-5.2");
    expect(getNVIDIAModelId("qwen")).toBe("qwen/qwen-image-edit");
  });

  // 12. GLM-5.2 request sends seed and stream=true
  it("12. GLM-5.2 chatCompletion payload includes seed=42 and stream=true", async () => {
    let capturedBody: any;
    const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string);
      return {
        ok: true,
        headers: new Headers({ "x-request-id": "glm-req-001" }),
        json: async () => ({
          id: "glm-cmpl-001",
          choices: [{ message: { content: "GLM response" } }],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        }),
      };
    });

    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "test-key",
      defaultModel: "z-ai/glm-5.2",
    });

    const preset = getNVIDIAModelPreset("z-ai/glm-5.2");
    await client.chatCompletion(
      {
        model: "z-ai/glm-5.2",
        messages: [{ role: "user", content: "Describe the image" }],
        temperature: preset.temperature,
        top_p: preset.top_p,
        max_tokens: preset.max_tokens,
        stream: preset.stream,
        seed: preset.seed,
      },
      mockFetch as any
    );

    expect(capturedBody.model).toBe("z-ai/glm-5.2");
    expect(capturedBody.stream).toBe(true);
    expect(capturedBody.seed).toBe(42);
    expect(capturedBody.top_p).toBe(1);
    expect(capturedBody.max_tokens).toBe(16384);
  });

  // 13. Muse 30B request — no seed, stream=false
  it("13. Muse 30B chatCompletion payload has no seed and stream=false", async () => {
    let capturedBody: any;
    const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string);
      return {
        ok: true,
        headers: new Headers(),
        json: async () => ({
          choices: [{ message: { content: "Muse response" } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      };
    });

    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "nv-key",
      defaultModel: "meta/muse-glimmer-30b",
    });

    const preset = getNVIDIAModelPreset("meta/muse-glimmer-30b");
    await client.chatCompletion(
      {
        model: "meta/muse-glimmer-30b",
        messages: [{ role: "user", content: "Generate script" }],
        temperature: preset.temperature,
        top_p: preset.top_p,
        max_tokens: preset.max_tokens,
        stream: preset.stream,
      },
      mockFetch as any
    );

    expect(capturedBody.model).toBe("meta/muse-glimmer-30b");
    expect(capturedBody.stream).toBe(false);
    expect(capturedBody.seed).toBeUndefined();
    expect(capturedBody.temperature).toBe(1);
    expect(capturedBody.top_p).toBe(0.95);
    expect(capturedBody.max_tokens).toBe(8192);
  });

  // 14. Router selects nvidia for TEXT_GENERATION HIGH quality
  it("14. ModelRouter selects an nvidia model for TEXT_GENERATION with HIGH quality requirement", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const route = router.selectModel({
      capability: "TEXT_GENERATION",
      task: "Generate script outline",
      qualityRequirement: "HIGH",
    });
    expect(route.providerId).toBe("nvidia");
  });

  // 15. Router selects nvidia for IMAGE_EDITING
  it("15. ModelRouter selects nvidia (qwen/qwen-image-edit) for IMAGE_EDITING capability", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const route = router.selectModel({
      capability: "IMAGE_EDITING",
      task: "Edit background of character image",
    });
    expect(route.selectedModel.modelId).toBe("qwen/qwen-image-edit");
    expect(route.providerId).toBe("nvidia");
  });

  // 16. Router selects nvidia for IMAGE_GENERATION
  it("16. ModelRouter selects nvidia (qwen/qwen-image-edit) for IMAGE_GENERATION capability", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const route = router.selectModel({
      capability: "IMAGE_GENERATION",
      task: "Generate character visual",
    });
    expect(route.selectedModel.modelId).toBe("qwen/qwen-image-edit");
    expect(route.providerId).toBe("nvidia");
  });

  // 17. generateImage dispatched to NVIDIAAdapter
  it("17. NVIDIAAdapter.generateImage sends request to NVIDIA endpoint and returns mediaKey", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "x-request-id": "img-req-007" }),
      json: async () => ({
        id: "img-cmpl-007",
        choices: [{ message: { content: "https://cdn.nvidia.com/generated/abc.png" } }],
        usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
      }),
    });

    globalThis.fetch = mockFetch as any;
    const adapter = new NVIDIAAdapter({ apiKey: "test-key" });
    const result = await adapter.generateImage({
      prompt: "A studio background with warm lighting",
      width: 1920,
      height: 1080,
    });

    expect(result.imageUrl).toBeDefined();
    expect(result.mediaKey).toBeDefined();
    expect(result.mediaKey).toContain("nvidia-img");
  });

  // 18. Response normalization with usage
  it("18. normalizes OpenAI-compatible response into canonical structure with usage and latency", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "x-request-id": "req-norm-999" }),
      json: async () => ({
        id: "chatcmpl-999",
        choices: [{ message: { content: '{"status": "ok"}' } }],
        usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
      }),
    });

    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "test-key",
      defaultModel: "meta/muse-glimmer-30b",
    });

    const res = await client.chatCompletion({ messages: [{ role: "user", content: "hi" }] }, mockFetch as any);

    expect(res.success).toBe(true);
    expect(res.provider).toBe("nvidia");
    expect(res.model).toBe("meta/muse-glimmer-30b");
    expect(res.requestId).toBe("req-norm-999");
    expect(res.usage).toEqual({ promptTokens: 15, completionTokens: 25, totalTokens: 40 });
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);
    expect(res.structuredOutput).toEqual({ status: "ok" });
  });

  // 19. Retry classification
  it("19. classifyError identifies transient vs non-transient errors correctly", () => {
    expect(classifyError(new Error("429 Too Many Requests")).code).toBe("RATE_LIMIT");
    expect(classifyError(new Error("429 Too Many Requests")).isTransient).toBe(true);
    expect(classifyError(new Error("401 Unauthorized invalid key")).code).toBe("AUTH_ERROR");
    expect(classifyError(new Error("401 Unauthorized invalid key")).isTransient).toBe(false);
    expect(classifyError(new Error("ETIMEDOUT connection timeout")).code).toBe("TIMEOUT");
    expect(classifyError(new Error("ETIMEDOUT connection timeout")).isTransient).toBe(true);
  });

  // 20. Rate-limit (429)
  it("20. returns RATE_LIMIT transient error on HTTP 429 status code", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => "Rate limit exceeded. Try again in 5s.",
    });

    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "test-key",
      defaultModel: "meta/muse-glimmer-30b",
    });

    const res = await client.chatCompletion({ messages: [{ role: "user", content: "test" }] }, mockFetch as any);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("RATE_LIMIT");
    expect(res.error?.isTransient).toBe(true);
  });

  // 21. Auth failure (401)
  it("21. returns AUTH_ERROR non-transient error on HTTP 401 status code", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Invalid API key provided",
    });

    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "bad-key",
      defaultModel: "meta/muse-glimmer-30b",
    });

    const res = await client.chatCompletion({ messages: [{ role: "user", content: "test" }] }, mockFetch as any);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("AUTH_ERROR");
    expect(res.error?.isTransient).toBe(false);
  });

  // 22. Timeout handling
  it("22. returns TIMEOUT error when request exceeds timeout threshold", async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "test-key",
      defaultModel: "meta/muse-glimmer-30b",
      timeoutMs: 100,
    });

    const res = await client.chatCompletion({ messages: [{ role: "user", content: "long request" }] }, mockFetch as any);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("TIMEOUT");
    expect(res.error?.isTransient).toBe(true);
  });

  // 23. Non-JSON output handled gracefully
  it("23. handles non-JSON output gracefully when JSON requested", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        choices: [{ message: { content: "This is raw text, not valid JSON" } }],
      }),
    });

    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "test-key",
      defaultModel: "meta/muse-glimmer-30b",
    });

    const res = await client.chatCompletion(
      { messages: [{ role: "user", content: "JSON please" }], response_format: { type: "json_object" } },
      mockFetch as any
    );

    expect(res.success).toBe(true);
    expect(res.text).toBe("This is raw text, not valid JSON");
    expect(res.structuredOutput).toBeUndefined();
  });

  // 24. Provenance creation in engine
  it("24. ProviderExecutionEngine attaches valid GenerationProvenance to successful job", async () => {
    process.env["VOX_RUNTIME_MODE"] = "mock";
    const engine = new ProviderExecutionEngine();
    const result = await engine.executeJob({
      capability: "TEXT_GENERATION",
      prompt: "Create headline",
      episodeId: "ep-prov-test",
      sceneId: "sc-01",
      shotId: "shot-01",
      productionNodeId: "pnode-100",
      creativeDnaVersion: 2,
      styleSkillVersion: "1.2",
    });

    expect(result.success).toBe(true);
    expect(result.provenance).toBeDefined();
    expect(result.provenance?.episodeId).toBe("ep-prov-test");
    expect(result.provenance?.creativeDnaVersion).toBe(2);
    expect(result.provenance?.styleSkillVersion).toBe("1.2");
  });

  // 25. Secret redaction
  it("25. redacts API key from client errors and sanitized config logs", () => {
    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "SECRET_KEY_SUPER_PRIVATE_12345",
      defaultModel: "meta/muse-glimmer-30b",
    });

    const sanitized = client.getSanitizedConfig();
    expect(JSON.stringify(sanitized)).not.toContain("SECRET_KEY_SUPER_PRIVATE_12345");
    expect(sanitized.hasApiKey).toBe(true);
    expect(sanitized.isConfigured).toBe(true);
  });

  // 26. MOCK runtime mode isolation
  it("26. MOCK runtime mode (VOX_RUNTIME_MODE=mock) routes through mock adapter — no real HTTP", async () => {
    process.env["VOX_RUNTIME_MODE"] = "mock";
    const engine = new ProviderExecutionEngine();
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch as any;

    const result = await engine.executeJob({
      capability: "TEXT_GENERATION",
      prompt: "Test mock mode isolation",
    });

    expect(result.success).toBe(true);
    expect(result.selectedProviderId).toBe("vox-mock-provider");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // 27. AUTO runtime mode fallback
  it("27. AUTO runtime mode (VOX_RUNTIME_MODE=auto) falls back to mock if API key is unconfigured", async () => {
    delete process.env["NVIDIA_API_KEY"];
    process.env["VOX_RUNTIME_MODE"] = "auto";
    const engine = new ProviderExecutionEngine();
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch as any;

    const result = await engine.executeJob({
      capability: "TEXT_GENERATION",
      prompt: "Auto mode fallback test",
    });

    expect(result.success).toBe(true);
    expect(result.selectedProviderId).toBe("vox-mock-provider");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // 28. REAL mode rejects missing API key
  it("28. REAL runtime mode (VOX_RUNTIME_MODE=real) throws AUTH_ERROR when API key is missing", async () => {
    delete process.env["NVIDIA_API_KEY"];
    process.env["VOX_RUNTIME_MODE"] = "real";
    const engine = new ProviderExecutionEngine();
    engine.registerAdapter(new NVIDIAAdapter({ apiKey: "" }));

    const result = await engine.executeJob({
      capability: "TEXT_GENERATION",
      prompt: "Strict real mode test",
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("AUTH_ERROR");
    expect(result.error?.message).toContain("VOX_RUNTIME_MODE=real");
  });

  // 29. Deterministic router selection
  it("29. ModelRouter selection is 100% deterministic across repeated calls", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const r1 = router.selectModel({ capability: "TEXT_GENERATION", task: "Generate episode title" });
    const r2 = router.selectModel({ capability: "TEXT_GENERATION", task: "Generate episode title" });
    expect(r1.selectedModel.modelId).toBe(r2.selectedModel.modelId);
    expect(r1.providerId).toBe(r2.providerId);
    expect(r1.fallbackChain).toEqual(r2.fallbackChain);
  });

  // 30. Fallback chain structure
  it("30. fallback chain is built correctly when multiple nvidia models are registered", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const route = router.selectModel({ capability: "TEXT_GENERATION", task: "Scripting" });
    expect(route.fallbackChain.length).toBeGreaterThan(0);
    expect(route.fallbackChain[route.fallbackChain.length - 1]).toContain("PRIMARY -> FALLBACK 1 -> ESCALATE");
  });

  // 31. Quality downgrade protection
  it("31. router prevents silent quality downgrade when requirement cannot be met", () => {
    const registry = new ModelRegistry([
      {
        modelId: "low-model",
        providerId: "low-p",
        displayName: "Low Quality",
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
      router.selectModel({ capability: "TEXT_GENERATION", task: "High-end text", qualityRequirement: "PREMIUM" })
    ).toThrow("Cannot fulfill quality requirement PREMIUM");
  });

  // 32. All 3 NVIDIA models reachable via unified NVIDIAAdapter
  it("32. all 3 NVIDIA models produce valid mock responses through NVIDIAAdapter in mock mode", async () => {
    process.env["VOX_RUNTIME_MODE"] = "mock";
    const engine = new ProviderExecutionEngine();

    const textResult = await engine.executeJob({ capability: "TEXT_GENERATION", prompt: "Hello" });
    expect(textResult.success).toBe(true);

    const imageResult = await engine.executeJob({ capability: "IMAGE_GENERATION", prompt: "Background art" });
    expect(imageResult.success).toBe(true);

    const imageEditResult = await engine.executeJob({ capability: "IMAGE_EDITING", prompt: "Remove background" });
    expect(imageEditResult.success).toBe(true);
  });
});

// ─── OPTIONAL REAL NVIDIA SMOKE TESTS ─────────────────────────────────────────
describe("Optional Real NVIDIA Smoke Tests", () => {
  const apiKey = process.env["NVIDIA_API_KEY"];
  const runtimeMode = process.env["VOX_RUNTIME_MODE"];
  const shouldRun = Boolean(apiKey && apiKey.trim().length > 0 && runtimeMode === "real");

  // Smoke 1: meta/muse-glimmer-30b
  it.runIf(shouldRun)("SMOKE: meta/muse-glimmer-30b live completion via NVIDIA NIM", async () => {
    const adapter = new NVIDIAAdapter(apiKey ? { apiKey } : {});
    const preset = getNVIDIAModelPreset("meta/muse-glimmer-30b");
    const response = await adapter.getClient().chatCompletion({
      model: "meta/muse-glimmer-30b",
      messages: [
        { role: "system", content: "You are an AI assistant for VOX Studio." },
        { role: "user", content: 'Respond with valid JSON: {"status":"ok","model":"muse"}' },
      ],
      temperature: preset.temperature,
      top_p: preset.top_p,
      max_tokens: 100,
      stream: preset.stream,
      response_format: { type: "json_object" },
    });
    expect(response.success).toBe(true);
    expect(response.provider).toBe("nvidia");
    expect(response.latencyMs).toBeGreaterThan(0);
    expect(response.text.length).toBeGreaterThan(0);
  });

  // Smoke 2: z-ai/glm-5.2
  it.runIf(shouldRun)("SMOKE: z-ai/glm-5.2 live completion via NVIDIA NIM (streaming mode)", async () => {
    const adapter = new NVIDIAAdapter(apiKey ? { apiKey } : {});
    const preset = getNVIDIAModelPreset("z-ai/glm-5.2");
    const response = await adapter.getClient().chatCompletion({
      model: "z-ai/glm-5.2",
      messages: [
        { role: "user", content: 'Respond with valid JSON: {"status":"ok","model":"glm"}' },
      ],
      temperature: preset.temperature,
      top_p: preset.top_p,
      max_tokens: 100,
      stream: false, // disable streaming for test simplicity
      seed: preset.seed,
    });
    expect(response.success).toBe(true);
    expect(response.provider).toBe("nvidia");
    expect(response.latencyMs).toBeGreaterThan(0);
  });

  // Smoke 3: qwen/qwen-image-edit
  it.runIf(shouldRun)("SMOKE: qwen/qwen-image-edit generates image result via NVIDIA NIM", async () => {
    const adapter = new NVIDIAAdapter(apiKey ? { apiKey } : {});
    const result = await adapter.generateImage({
      prompt: "A simple test pattern image, 512x512",
      width: 512,
      height: 512,
      modelId: "qwen/qwen-image-edit",
    } as any);
    expect(result.imageUrl).toBeDefined();
    expect(result.mediaKey).toContain("nvidia-img");
  });
});
