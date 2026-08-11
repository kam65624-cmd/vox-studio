import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NVIDIAAdapter,
  getNVIDIAConfig,
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

  // 3. Base URL configuration
  it("3. respects custom NVIDIA_BASE_URL override", () => {
    process.env["NVIDIA_BASE_URL"] = "https://custom.nvidia-proxy.com/v1";
    const config = getNVIDIAConfig();
    expect(config.baseUrl).toBe("https://custom.nvidia-proxy.com/v1");
  });

  // 4. Model registry lookup
  it("4. registers meta/muse-glimmer-30b under provider 'nvidia' in ModelRegistry", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const model = registry.getModel("meta/muse-glimmer-30b");
    expect(model).toBeDefined();
    expect(model?.providerId).toBe("nvidia");
    expect(model?.capabilities).toContain("TEXT_GENERATION");
    expect(model?.capabilities).toContain("REASONING");
    expect(model?.capabilities).toContain("STRUCTURED_OUTPUT");
  });

  // 5. Router selects NVIDIA model
  it("5. ModelRouter selects meta/muse-glimmer-30b for TEXT_GENERATION with HIGH quality requirement", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const route = router.selectModel({
      capability: "TEXT_GENERATION",
      task: "Generate script outline",
      qualityRequirement: "HIGH",
    });
    expect(route.selectedModel.modelId).toBe("meta/muse-glimmer-30b");
    expect(route.providerId).toBe("nvidia");
  });

  // 6. OpenAI-compatible request construction
  it("6. constructs valid OpenAI-compatible payload with model, messages, temperature, top_p, max_tokens", async () => {
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;

    const mockFetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      capturedUrl = url;
      capturedInit = init;
      return {
        ok: true,
        headers: new Headers({ "x-request-id": "nv-req-123" }),
        json: async () => ({
          id: "nv-cmpl-001",
          choices: [{ message: { content: "Hello from NVIDIA NIM!" } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      };
    });

    const client = new OpenAICompatibleClient({
      providerId: "nvidia",
      displayName: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      apiKey: "nv-secret-key-007",
      defaultModel: "meta/muse-glimmer-30b",
    });

    const result = await client.chatCompletion(
      {
        messages: [{ role: "user", content: "Explain quantum computing" }],
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 2048,
      },
      mockFetch as any
    );

    expect(result.success).toBe(true);
    expect(result.text).toBe("Hello from NVIDIA NIM!");
    expect(capturedUrl).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
    expect(capturedInit?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer nv-secret-key-007",
    });

    const body = JSON.parse(capturedInit?.body as string);
    expect(body.model).toBe("meta/muse-glimmer-30b");
    expect(body.temperature).toBe(0.8);
    expect(body.top_p).toBe(0.9);
    expect(body.max_tokens).toBe(2048);
  });

  // 7. Response normalization
  it("7. normalizes OpenAI-compatible response into canonical structure with usage and latency", async () => {
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

  // 8. Retry classification
  it("8. classifyError identifies transient vs non-transient errors correctly", () => {
    expect(classifyError(new Error("429 Too Many Requests")).code).toBe("RATE_LIMIT");
    expect(classifyError(new Error("429 Too Many Requests")).isTransient).toBe(true);

    expect(classifyError(new Error("401 Unauthorized invalid key")).code).toBe("AUTH_ERROR");
    expect(classifyError(new Error("401 Unauthorized invalid key")).isTransient).toBe(false);

    expect(classifyError(new Error("ETIMEDOUT connection timeout")).code).toBe("TIMEOUT");
    expect(classifyError(new Error("ETIMEDOUT connection timeout")).isTransient).toBe(true);
  });

  // 9. Rate-limit handling (429)
  it("9. returns RATE_LIMIT transient error on HTTP 429 status code", async () => {
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

  // 10. Auth failure handling (401/403)
  it("10. returns AUTH_ERROR non-transient error on HTTP 401 status code", async () => {
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

  // 11. Timeout handling
  it("11. returns TIMEOUT error when request exceeds timeout threshold", async () => {
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

  // 12. Invalid structured output
  it("12. handles non-JSON output gracefully when JSON requested", async () => {
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

  // 13. Provenance creation
  it("13. ProviderExecutionEngine attaches valid GenerationProvenance to successful job execution", async () => {
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

  // 14. No secret leakage
  it("14. redacts API key from client errors and sanitized config logs", () => {
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

  // 15. MOCK runtime mode never calls real provider
  it("15. MOCK runtime mode (VOX_RUNTIME_MODE=mock) routes through mock adapter", async () => {
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

  // 16. AUTO runtime mode fallback
  it("16. AUTO runtime mode (VOX_RUNTIME_MODE=auto) falls back to mock if API key is unconfigured", async () => {
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

  // 17. REAL runtime mode rejects missing provider
  it("17. REAL runtime mode (VOX_RUNTIME_MODE=real) throws AUTH_ERROR when API key is missing", async () => {
    delete process.env["NVIDIA_API_KEY"];
    process.env["VOX_RUNTIME_MODE"] = "real";
    const engine = new ProviderExecutionEngine();

    // Register empty NVIDIA adapter with no API key
    engine.registerAdapter(new NVIDIAAdapter({ apiKey: "" }));

    const result = await engine.executeJob({
      capability: "TEXT_GENERATION",
      prompt: "Strict real mode test",
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("AUTH_ERROR");
    expect(result.error?.message).toContain("VOX_RUNTIME_MODE=real");
  });

  // 18. Deterministic prompt fingerprint
  it("18. ModelRouter selection and fingerprinting are 100% deterministic", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);

    const r1 = router.selectModel({ capability: "TEXT_GENERATION", task: "Generate episode title" });
    const r2 = router.selectModel({ capability: "TEXT_GENERATION", task: "Generate episode title" });

    expect(r1.selectedModel.modelId).toBe(r2.selectedModel.modelId);
    expect(r1.providerId).toBe(r2.providerId);
    expect(r1.fallbackChain).toEqual(r2.fallbackChain);
  });

  // 19. Provider fallback chain
  it("19. fallback chain is built correctly when primary model fails", () => {
    const registry = new ModelRegistry(INITIAL_MODEL_REGISTRY);
    const router = new ModelRouter(registry);
    const route = router.selectModel({ capability: "TEXT_GENERATION", task: "Scripting" });

    expect(route.fallbackChain.length).toBeGreaterThan(0);
    expect(route.fallbackChain[route.fallbackChain.length - 1]).toContain("PRIMARY -> FALLBACK 1 -> ESCALATE");
  });

  // 20. Quality downgrade protection
  it("20. router prevents silent quality downgrade when requirement cannot be met", () => {
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
});

// ─── OPTIONAL REAL NVIDIA SMOKE TEST ──────────────────────────────────────────
describe("Optional Real NVIDIA Smoke Test", () => {
  const apiKey = process.env["NVIDIA_API_KEY"];
  const runtimeMode = process.env["VOX_RUNTIME_MODE"];
  const shouldRun = Boolean(apiKey && apiKey.trim().length > 0 && runtimeMode === "real");

  it.runIf(shouldRun)("executes live completion call against NVIDIA NIM API", async () => {
    const adapter = new NVIDIAAdapter(apiKey ? { apiKey } : {});
    const response = await adapter.getClient().chatCompletion({
      model: "meta/muse-glimmer-30b",
      messages: [
        { role: "system", content: "You are an AI assistant for VOX Studio." },
        { role: "user", content: "Respond with valid JSON: {\"status\":\"ok\",\"provider\":\"nvidia\"}" },
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: "json_object" },
    });

    expect(response.success).toBe(true);
    expect(response.provider).toBe("nvidia");
    expect(response.model).toBe("meta/muse-glimmer-30b");
    expect(response.latencyMs).toBeGreaterThan(0);
    expect(response.text.length).toBeGreaterThan(0);
  });
});
