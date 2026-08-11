/**
 * ElevenLabs Provider Unit Tests (P0-M Track M5)
 * 12 test scenarios — all mock HTTP, no real API calls needed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ElevenLabsClient }    from "./elevenlabs/client";
import { ElevenLabsAdapter }   from "./elevenlabs/adapter";
import { getElevenLabsConfig, ELEVENLABS_MODELS } from "./elevenlabs/config";
import { ModelRegistry }       from "../index";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMp3Buffer(): Buffer {
  // Minimal valid-looking buffer (just for testing — not real MP3)
  return Buffer.from("ID3mock-mp3-bytes");
}

function makeMockFetch(
  status: number,
  body: Buffer | string = makeMp3Buffer(),
): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok:     status >= 200 && status < 300,
    status,
    arrayBuffer: async () => {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    },
    text: async () => (Buffer.isBuffer(body) ? body.toString() : body),
  } as unknown as Response);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ElevenLabs Provider (P0-M Track M5)", () => {

  // ── 1. Config ──────────────────────────────────────────────────────────────

  it("1. loads ElevenLabs config from env correctly", () => {
    const env = process.env;
    process.env = {
      ...env,
      ELEVENLABS_API_KEY:          "test-xi-key",
      ELEVENLABS_BASE_URL:         "https://api.elevenlabs.io/v1",
      ELEVENLABS_DEFAULT_VOICE_ID: "test-voice-id",
      ELEVENLABS_MODEL_ID:         "eleven_multilingual_v2",
      ELEVENLABS_TIMEOUT_MS:       "30000",
      ELEVENLABS_MAX_RETRIES:      "3",
    };

    const cfg = getElevenLabsConfig();
    expect(cfg.apiKey).toBe("test-xi-key");
    expect(cfg.baseUrl).toBe("https://api.elevenlabs.io/v1");
    expect(cfg.defaultVoiceId).toBe("test-voice-id");
    expect(cfg.defaultModelId).toBe("eleven_multilingual_v2");
    expect(cfg.timeoutMs).toBe(30000);
    expect(cfg.maxRetries).toBe(3);
    expect(cfg.providerId).toBe("elevenlabs");

    process.env = env;
  });

  it("2. isConfigured() returns false when API key is missing", () => {
    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey: "",
    });
    expect(client.isConfigured()).toBe(false);
  });

  it("3. isConfigured() returns true when API key is set", () => {
    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey: "nvapi-test-key",
    });
    expect(client.isConfigured()).toBe(true);
  });

  // ── 2. HTTP Request ────────────────────────────────────────────────────────

  it("4. sends correct xi-api-key Authorization header", async () => {
    const mockFetch = makeMockFetch(200);
    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey:         "secret-xi-key",
      defaultVoiceId: "adam-voice",
      defaultModelId: "eleven_multilingual_v2",
      timeoutMs:      5000,
    });

    await client.textToSpeech({ text: "Hello world" }, mockFetch);

    const [url, init] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("adam-voice");
    expect((init.headers as Record<string, string>)["xi-api-key"]).toBe("secret-xi-key");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("5. sends correct body with voiceId, modelId, and voice_settings", async () => {
    const mockFetch = makeMockFetch(200);
    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey:         "key",
      defaultVoiceId: "default-voice",
      defaultModelId: "eleven_multilingual_v2",
      timeoutMs:      5000,
    });

    await client.textToSpeech(
      {
        text:    "Test text",
        voiceId: "custom-voice",
        modelId: "eleven_turbo_v2_5",
        voiceSettings: { stability: 0.8, similarityBoost: 0.9 },
      },
      mockFetch,
    );

    const [, init] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.text).toBe("Test text");
    expect(body.model_id).toBe("eleven_turbo_v2_5");
    expect(body.voice_settings.stability).toBe(0.8);
    expect(body.voice_settings.similarity_boost).toBe(0.9);
  });

  it("6. returns audio Buffer on HTTP 200", async () => {
    const mockFetch = makeMockFetch(200, makeMp3Buffer());
    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey: "key",
      defaultVoiceId: "v",
      defaultModelId: "m",
      timeoutMs: 5000,
    });

    const res = await client.textToSpeech({ text: "Hello" }, mockFetch);
    expect(res.success).toBe(true);
    expect(res.audioBuffer).toBeInstanceOf(Buffer);
    expect(res.audioBuffer!.length).toBeGreaterThan(0);
    expect(res.audioBase64).toBeTruthy();
    expect(res.voiceId).toBe("v");
  });

  // ── 3. Error Handling ──────────────────────────────────────────────────────

  it("7. 401 → AUTH_ERROR non-transient", async () => {
    const mockFetch = makeMockFetch(401, "Unauthorized");
    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey: "bad-key",
      defaultVoiceId: "v",
      defaultModelId: "m",
      timeoutMs: 5000,
    });

    const res = await client.textToSpeech({ text: "hi" }, mockFetch);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("AUTH_ERROR");
    expect(res.error?.isTransient).toBe(false);
    // API key must NOT appear in error message
    expect(res.error?.message).not.toContain("bad-key");
  });

  it("8. 429 → RATE_LIMIT transient", async () => {
    const mockFetch = makeMockFetch(429, "Too Many Requests");
    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey: "key",
      defaultVoiceId: "v",
      defaultModelId: "m",
      timeoutMs: 5000,
    });

    const res = await client.textToSpeech({ text: "hi" }, mockFetch);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("RATE_LIMIT");
    expect(res.error?.isTransient).toBe(true);
  });

  it("9. Timeout → TIMEOUT error transient", async () => {
    const abortFetch = vi.fn().mockImplementation(async (_url: string, opts: RequestInit) => {
      const signal = opts.signal as AbortSignal;
      if (signal?.aborted) throw Object.assign(new Error("Aborted"), { name: "AbortError" });
      // Simulate immediate abort
      await Promise.resolve();
      throw Object.assign(new Error("Aborted"), { name: "AbortError" });
    });

    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey: "key",
      defaultVoiceId: "v",
      defaultModelId: "m",
      timeoutMs: 1, // 1ms timeout — will always abort
    });

    const res = await client.textToSpeech({ text: "hi" }, abortFetch as unknown as typeof fetch);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("TIMEOUT");
    expect(res.error?.isTransient).toBe(true);
  });

  it("10. API key is never included in error messages", async () => {
    const SECRET = "super-secret-xi-key-abc123";
    const mockFetch = makeMockFetch(500, "Internal Server Error");
    const client = new ElevenLabsClient({
      ...getElevenLabsConfig(),
      apiKey: SECRET,
      defaultVoiceId: "v",
      defaultModelId: "m",
      timeoutMs: 5000,
    });

    const res = await client.textToSpeech({ text: "hi" }, mockFetch);
    expect(res.error?.message).not.toContain(SECRET);
    const sanitized = client.getSanitizedConfig();
    expect(JSON.stringify(sanitized)).not.toContain(SECRET);
  });

  // ── 4. Adapter ─────────────────────────────────────────────────────────────

  it("11. ElevenLabsAdapter.generateVoice returns mediaKey and durationSeconds in mock mode", async () => {
    const original = process.env["VOX_RUNTIME_MODE"];
    process.env["VOX_RUNTIME_MODE"] = "mock";

    const adapter = new ElevenLabsAdapter({ apiKey: "key", defaultVoiceId: "v", defaultModelId: "m" } as any);
    const res = await adapter.generateVoice({
      text:     "مرحبا بالعالم",
      voiceId:  "v",
      language: "ar",
    });

    expect(res.mediaKey).toBeTruthy();
    expect(res.durationSeconds).toBeGreaterThan(0);
    expect(res.audioBuffer).toBeInstanceOf(Buffer);

    process.env["VOX_RUNTIME_MODE"] = original;
  });

  // ── 5. Model Registry ──────────────────────────────────────────────────────

  it("12. ModelRegistry contains all 3 ElevenLabs voice models", () => {
    const registry = new ModelRegistry();
    const voiceModels = registry.getModelsByCapability("VOICE_GENERATION");
    const elModels = voiceModels.filter((m: { providerId: string }) => m.providerId === "elevenlabs");

    expect(elModels.length).toBeGreaterThanOrEqual(3);

    const ids = elModels.map((m: { modelId: string }) => m.modelId);
    expect(ids).toContain(ELEVENLABS_MODELS.MULTILINGUAL_V2);
    expect(ids).toContain(ELEVENLABS_MODELS.TURBO_V2_5);
    expect(ids).toContain(ELEVENLABS_MODELS.FLASH_V2_5);
  });
});
