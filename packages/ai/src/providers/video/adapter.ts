/**
 * Video Provider Adapter (P0-N Track N2)
 *
 * Implements UnifiedProviderAdapter for VIDEO_GENERATION.
 * Enforces VOX_RUNTIME_MODE=mock isolation and secret redaction.
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

import { RealVideoClient } from "./client";
import { getRealVideoConfig, type RealVideoConfig } from "./config";

export class RealVideoAdapter implements UnifiedProviderAdapter {
  readonly providerId = "runway-video";
  readonly displayName = "Runway Video Adapter";

  private client: RealVideoClient;

  constructor(customConfig?: Partial<RealVideoConfig>) {
    const base = getRealVideoConfig();
    this.client = new RealVideoClient({ ...base, ...customConfig });
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  getClient(): RealVideoClient {
    return this.client;
  }

  // ─── Video Generation ──────────────────────────────────────────────────────

  async generateVideo(
    request: VideoGenerationRequest,
    onProgress?: (progress: number, phase: string) => void,
  ): Promise<VideoGenerationResponse> {
    if (process.env["VOX_RUNTIME_MODE"] === "mock") {
      return {
        videoUrl: `mock://video/generated-${Date.now().toString(36)}.mp4`,
        mediaKey: `mock-vid-${Date.now().toString(36)}`,
        durationSeconds: request.durationSeconds ?? 5,
        costUsd: 0.25,
      };
    }

    if (!this.isConfigured()) {
      throw Object.assign(new Error("[RealVideoAdapter] RUNWAY_API_KEY / REPLICATE_API_KEY is not configured in environment."), {
        code: "AUTH_ERROR",
        isTransient: false,
      });
    }

    const res = await this.client.generateVideo(
      {
        prompt: request.prompt,
        ...(request.styleKeyUrl ? { imagePromptUrl: request.styleKeyUrl } : {}),
        ...(request.durationSeconds ? { durationSeconds: request.durationSeconds } : {}),
        ...(request.aspectRatio ? { aspectRatio: request.aspectRatio } : {}),
      },
      onProgress,
    );

    if (!res.success || !res.videoUrl) {
      const err = res.error;
      throw Object.assign(new Error(`[RealVideoAdapter] Video generation failed: ${err?.message ?? "Unknown error"}`), {
        code: err?.code ?? "PROVIDER_ERROR",
        isTransient: err?.isTransient ?? false,
      });
    }

    return {
      videoUrl: res.videoUrl,
      mediaKey: res.mediaKey,
      durationSeconds: res.durationSeconds,
      costUsd: res.costUsd,
    };
  }

  // ─── Unsupported Methods ──────────────────────────────────────────────────

  async generateText(_request: TextGenerationRequest): Promise<TextGenerationResponse> {
    throw new Error("[RealVideoAdapter] Text generation not supported.");
  }

  async generateImage(_request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    throw new Error("[RealVideoAdapter] Image generation not supported.");
  }

  async generateVoice(_request: VoiceGenerationRequest): Promise<VoiceGenerationResponse> {
    throw new Error("[RealVideoAdapter] Voice generation not supported.");
  }
}
