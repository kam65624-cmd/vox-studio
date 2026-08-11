/**
 * ElevenLabs HTTP Client (P0-M Track M5)
 *
 * Minimal fetch-based client for ElevenLabs TTS API.
 * Returns raw audio Buffer (MP3) — no file I/O here.
 * API key is NEVER logged or included in error messages.
 */

import type { ElevenLabsConfig, ElevenLabsVoiceSettings } from "./config";

// ─── Request / Response ───────────────────────────────────────────────────────

export interface TTSRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
  voiceSettings?: ElevenLabsVoiceSettings;
}

export interface TTSResponse {
  success: boolean;
  audioBuffer?: Buffer;
  audioBase64?: string;
  /** Rough estimate: ~150ms per character at normal speaking rate */
  durationEstimateMs?: number;
  characterCount: number;
  voiceId: string;
  model: string;
  latencyMs: number;
  error?: {
    code: string;
    message: string;
    isTransient: boolean;
    httpStatus?: number;
  };
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class ElevenLabsClient {
  constructor(private config: ElevenLabsConfig) {}

  /**
   * Converts text to speech using ElevenLabs TTS API.
   *
   * @param request - TTS params (text, optional voiceId/modelId override)
   * @param fetchFn - injectable fetch for unit testing (defaults to global fetch)
   */
  async textToSpeech(
    request: TTSRequest,
    fetchFn: typeof fetch = globalThis.fetch,
  ): Promise<TTSResponse> {
    const t0 = Date.now();
    const voiceId = request.voiceId ?? this.config.defaultVoiceId;
    const modelId = request.modelId ?? this.config.defaultModelId;

    const url = `${this.config.baseUrl}/text-to-speech/${voiceId}`;

    const body = JSON.stringify({
      text:     request.text,
      model_id: modelId,
      voice_settings: {
        stability:        request.voiceSettings?.stability        ?? 0.5,
        similarity_boost: request.voiceSettings?.similarityBoost  ?? 0.75,
        style:            request.voiceSettings?.style            ?? 0,
        use_speaker_boost: request.voiceSettings?.useSpeakerBoost ?? true,
      },
    });

    let resp: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      resp = await fetchFn(url, {
        method:  "POST",
        headers: {
          "xi-api-key":    this.config.apiKey,  // standard ElevenLabs auth header
          "Content-Type":  "application/json",
          "Accept":        "audio/mpeg",
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        success:        false,
        characterCount: request.text.length,
        voiceId,
        model:          modelId,
        latencyMs:      Date.now() - t0,
        error: {
          code:        isAbort ? "TIMEOUT" : "NETWORK_ERROR",
          message:     isAbort ? "ElevenLabs request timed out" : "Network error reaching ElevenLabs",
          isTransient: true,
        },
      };
    }

    const latencyMs = Date.now() - t0;

    if (!resp.ok) {
      let errBody = "";
      try { errBody = await resp.text(); } catch { /* ignore */ }

      const isTransient = resp.status === 429 || resp.status >= 500;
      const code = resp.status === 401
        ? "AUTH_ERROR"
        : resp.status === 429
        ? "RATE_LIMIT"
        : resp.status >= 500
        ? "PROVIDER_ERROR"
        : "REQUEST_ERROR";

      return {
        success:        false,
        characterCount: request.text.length,
        voiceId,
        model: modelId,
        latencyMs,
        error: {
          code,
          // Do NOT include apiKey in error messages
          message:     `ElevenLabs HTTP ${resp.status}: ${errBody.slice(0, 200)}`,
          isTransient,
          httpStatus:  resp.status,
        },
      };
    }

    const arrayBuffer = await resp.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const audioBase64 = audioBuffer.toString("base64");

    // ElevenLabs doesn't return duration — estimate from char count
    const durationEstimateMs = Math.round(request.text.length * 50); // ~50ms/char average

    return {
      success:           true,
      audioBuffer,
      audioBase64,
      durationEstimateMs,
      characterCount:    request.text.length,
      voiceId,
      model:             modelId,
      latencyMs,
    };
  }

  isConfigured(): boolean {
    return (
      this.config.apiKey.trim().length > 0 &&
      this.config.baseUrl.trim().length > 0 &&
      this.config.defaultVoiceId.trim().length > 0
    );
  }

  getSanitizedConfig(): {
    hasApiKey: boolean;
    isConfigured: boolean;
    baseUrl: string;
    defaultVoiceId: string;
    defaultModelId: string;
  } {
    return {
      hasApiKey:      this.config.apiKey.trim().length > 0,
      isConfigured:   this.isConfigured(),
      baseUrl:        this.config.baseUrl,
      defaultVoiceId: this.config.defaultVoiceId,
      defaultModelId: this.config.defaultModelId,
    };
  }
}
