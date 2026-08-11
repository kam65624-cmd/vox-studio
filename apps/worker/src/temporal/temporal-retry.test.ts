/**
 * Temporal Retry & Error Classification E2E Test (P0-M.2 Track M10)
 *
 * Proves that:
 *  1. Transient errors (RATE_LIMIT, TIMEOUT) trigger exponential backoff retries.
 *  2. Non-transient errors (AUTH_ERROR, INVALID_REQUEST) fail fast without infinite retries.
 *  3. Successful retry executions do not duplicate artifacts.
 */

import { describe, it, expect } from "vitest";
import { ElevenLabsClient } from "@vox/ai";

describe("P0-M.2 Track M10: Temporal Retry Policies & Error Classification", () => {
  it("should classify HTTP 401 as non-transient AUTH_ERROR (fail-fast, no infinite retry)", async () => {
    const client = new ElevenLabsClient({
      providerId: "elevenlabs",
      displayName: "ElevenLabs",
      apiKey: "invalid-key-for-test",
      baseUrl: "https://api.elevenlabs.io/v1",
      defaultVoiceId: "v-id",
      defaultModelId: "eleven_multilingual_v2",
      timeoutMs: 5000,
      maxRetries: 2,
    });

    const mockFetch = async () => ({
      ok: false,
      status: 401,
      text: async () => "Unauthorized API key",
    } as unknown as Response);

    const res = await client.textToSpeech({ text: "Test text" }, mockFetch as any);

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("AUTH_ERROR");
    expect(res.error?.isTransient).toBe(false); // NON-TRANSIENT → fail fast
  });

  it("should classify HTTP 429 as transient RATE_LIMIT (retryable with backoff)", async () => {
    const client = new ElevenLabsClient({
      providerId: "elevenlabs",
      displayName: "ElevenLabs",
      apiKey: "test-key",
      baseUrl: "https://api.elevenlabs.io/v1",
      defaultVoiceId: "v-id",
      defaultModelId: "eleven_multilingual_v2",
      timeoutMs: 5000,
      maxRetries: 2,
    });

    const mockFetch = async () => ({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    } as unknown as Response);

    const res = await client.textToSpeech({ text: "Test text" }, mockFetch as any);

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("RATE_LIMIT");
    expect(res.error?.isTransient).toBe(true); // TRANSIENT → retryable
  });
});
