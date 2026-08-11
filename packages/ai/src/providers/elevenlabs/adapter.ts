/**
 * ElevenLabs Provider Adapter (P0-M Track M5)
 *
 * Implements UnifiedProviderAdapter for voice generation only.
 * Text/Image/Video generation is explicitly unsupported — caller must use NVIDIAAdapter.
 * Supports mock mode via VOX_RUNTIME_MODE=mock.
 */

import {
  type TextGenerationRequest,
  type TextGenerationResponse,
  type ImageGenerationRequest,
  type ImageGenerationResponse,
  type VideoGenerationRequest,
  type VideoGenerationResponse,
  type VoiceGenerationRequest,
  type VoiceGenerationResponse,
  type UnifiedProviderAdapter,
} from "../../index";

import { ElevenLabsClient }                from "./client";
import { getElevenLabsConfig, type ElevenLabsConfig } from "./config";

// ─── Voice Generation Request (extended) ─────────────────────────────────────

export interface ElevenLabsVoiceRequest extends VoiceGenerationRequest {
  modelId?: string;             // override default model
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface ElevenLabsVoiceResponse extends VoiceGenerationResponse {
  audioBuffer?: Buffer;         // raw MP3 bytes — store via StoragePort
  audioBase64?: string;         // base64 MP3 — for inline use
  characterCount?: number;
  latencyMs?: number;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class ElevenLabsAdapter implements UnifiedProviderAdapter {
  readonly providerId  = "elevenlabs";
  readonly displayName = "ElevenLabs";

  private client: ElevenLabsClient;

  constructor(customConfig?: Partial<ElevenLabsConfig>) {
    const base = getElevenLabsConfig();
    this.client = new ElevenLabsClient({ ...base, ...customConfig });
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  getClient(): ElevenLabsClient {
    return this.client;
  }

  // ── Voice Generation ─────────────────────────────────────────────────────

  async generateVoice(
    request: ElevenLabsVoiceRequest,
  ): Promise<ElevenLabsVoiceResponse> {
    // Mock mode: no real HTTP call
    if (process.env["VOX_RUNTIME_MODE"] === "mock") {
      return {
        audioUrl:      "mock://elevenlabs/mock-audio.mp3",
        mediaKey:      `el-mock-${Date.now().toString(36)}`,
        durationSeconds: Math.ceil(request.text.length / 15),
        costUsd:       0.0,
        audioBuffer:   Buffer.from("mock-mp3-data"),
        audioBase64:   Buffer.from("mock-mp3-data").toString("base64"),
        characterCount: request.text.length,
        latencyMs:     0,
      };
    }

    const res = await this.client.textToSpeech({
      text: request.text,
      ...(request.voiceId ? { voiceId: request.voiceId } : {}),
      ...((request as ElevenLabsVoiceRequest).modelId ? { modelId: (request as ElevenLabsVoiceRequest).modelId! } : {}),
      voiceSettings: {
        ...(typeof (request as ElevenLabsVoiceRequest).stability !== "undefined"
          ? { stability: (request as ElevenLabsVoiceRequest).stability! } : {}),
        ...(typeof (request as ElevenLabsVoiceRequest).similarityBoost !== "undefined"
          ? { similarityBoost: (request as ElevenLabsVoiceRequest).similarityBoost! } : {}),
        ...(typeof (request as ElevenLabsVoiceRequest).style !== "undefined"
          ? { style: (request as ElevenLabsVoiceRequest).style! } : {}),
        ...(typeof (request as ElevenLabsVoiceRequest).useSpeakerBoost !== "undefined"
          ? { useSpeakerBoost: (request as ElevenLabsVoiceRequest).useSpeakerBoost! } : {}),
      },
    });

    if (!res.success || !res.audioBuffer) {
      const err = res.error;
      throw Object.assign(
        new Error(`[ElevenLabs] TTS failed: ${err?.message ?? "Unknown error"}`),
        {
          code:        err?.code        ?? "PROVIDER_ERROR",
          isTransient: err?.isTransient ?? false,
        },
      );
    }

    // Duration: ElevenLabs doesn't return duration, so estimate from char count
    const durationSeconds = (res.durationEstimateMs ?? request.text.length * 50) / 1000;
    const mediaKey = `el-audio-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    // Cost estimate: eleven_multilingual_v2 ≈ $0.30/1000 chars
    const costUsd = (res.characterCount * 0.0003);

    return {
      audioUrl:       `elevenlabs://generated/${mediaKey}`,
      mediaKey,
      durationSeconds,
      costUsd,
      audioBuffer:    res.audioBuffer,
      ...(res.audioBase64 !== undefined ? { audioBase64: res.audioBase64 } : {}),
      characterCount: res.characterCount,
      latencyMs:      res.latencyMs,
    } as ElevenLabsVoiceResponse;
  }

  // ── Unsupported operations ────────────────────────────────────────────────
  // These throw clearly so ModelRouter doesn't silently route wrong capability.

  async generateText(_request: TextGenerationRequest): Promise<TextGenerationResponse> {
    throw new Error("[ElevenLabsAdapter] Text generation not supported. Use NVIDIAAdapter.");
  }

  async generateStructuredOutput(_request: TextGenerationRequest): Promise<TextGenerationResponse> {
    throw new Error("[ElevenLabsAdapter] Structured output not supported. Use NVIDIAAdapter.");
  }

  async generateImage(_request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    throw new Error("[ElevenLabsAdapter] Image generation not supported.");
  }

  async generateVideo(_request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    throw new Error("[ElevenLabsAdapter] Video generation not supported.");
  }
}
