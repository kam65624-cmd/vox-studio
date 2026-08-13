/**
 * Replicate Provider Adapter (P0-N Track N.1)
 *
 * Implements UnifiedProviderAdapter for IMAGE_GENERATION, IMAGE_EDITING, and VIDEO_GENERATION.
 * Enforces VOX_RUNTIME_MODE isolation and secret redaction.
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

import { ReplicateClient } from "./client";
import { getReplicateConfig, type ReplicateConfig } from "./config";

export class ReplicateAdapter implements UnifiedProviderAdapter {
  readonly providerId = "replicate";
  readonly displayName = "Replicate Hosted AI Engine";

  private client: ReplicateClient;
  private config: ReplicateConfig;

  constructor(customConfig?: Partial<ReplicateConfig>) {
    this.config = { ...getReplicateConfig(), ...customConfig };
    this.client = new ReplicateClient(this.config);
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  getClient(): ReplicateClient {
    return this.client;
  }

  // ─── Image Generation ──────────────────────────────────────────────────────

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (process.env["VOX_RUNTIME_MODE"] === "mock") {
      return {
        imageUrl: `mock://replicate/image-${Date.now().toString(36)}.png`,
        mediaKey: `mock-rep-img-${Date.now().toString(36)}`,
        costUsd: 0.04,
      };
    }

    if (!this.isConfigured()) {
      throw Object.assign(new Error("[ReplicateAdapter] REPLICATE_API_KEY is not configured in environment."), {
        code: "AUTH_ERROR",
        isTransient: false,
      });
    }

    const model = (request as any).modelId ?? this.config.defaultImageModel;
    const aspect_ratio =
      request.width && request.height
        ? request.width === request.height
          ? "1:1"
          : request.width > request.height
          ? "16:9"
          : "9:16"
        : "16:9";

    const res = await this.client.runPrediction(
      model,
      {
        prompt: request.prompt,
        aspect_ratio,
        output_format: "webp",
        output_quality: 90,
      },
      this.config.imageTimeoutMs,
    );

    if (!res.success || !res.mediaUrl) {
      const err = res.error;
      throw Object.assign(new Error(`[ReplicateAdapter] Image generation failed: ${err?.message ?? "Unknown error"}`), {
        code: err?.code ?? "PROVIDER_UNAVAILABLE",
        isTransient: err?.isTransient ?? false,
      });
    }

    return {
      imageUrl: res.mediaUrl,
      mediaKey: res.mediaKey,
      costUsd: res.costUsd,
    };
  }

  // ─── Image Editing ─────────────────────────────────────────────────────────

  async editImage(request: ImageGenerationRequest & { referenceImageKey: string }): Promise<ImageGenerationResponse> {
    if (process.env["VOX_RUNTIME_MODE"] === "mock") {
      return {
        imageUrl: `mock://replicate/edited-${request.referenceImageKey}.png`,
        mediaKey: `mock-rep-edit-${Date.now().toString(36)}`,
        costUsd: 0.04,
      };
    }

    if (!this.isConfigured()) {
      throw Object.assign(new Error("[ReplicateAdapter] REPLICATE_API_KEY is not configured in environment."), {
        code: "AUTH_ERROR",
        isTransient: false,
      });
    }

    const model = (request as any).modelId ?? this.config.defaultEditModel;

    const res = await this.client.runPrediction(
      model,
      {
        prompt: request.prompt,
        image: request.referenceImageKey,
      },
      this.config.imageTimeoutMs,
    );

    if (!res.success || !res.mediaUrl) {
      const err = res.error;
      throw Object.assign(new Error(`[ReplicateAdapter] Image edit failed: ${err?.message ?? "Unknown error"}`), {
        code: err?.code ?? "PROVIDER_UNAVAILABLE",
        isTransient: err?.isTransient ?? false,
      });
    }

    return {
      imageUrl: res.mediaUrl,
      mediaKey: res.mediaKey,
      costUsd: res.costUsd,
    };
  }

  // ─── Video Generation ──────────────────────────────────────────────────────

  async generateVideo(
    request: VideoGenerationRequest,
    onProgress?: (progress: number, phase: string) => void,
  ): Promise<VideoGenerationResponse> {
    if (process.env["VOX_RUNTIME_MODE"] === "mock") {
      return {
        videoUrl: `mock://replicate/video-${Date.now().toString(36)}.mp4`,
        mediaKey: `mock-rep-vid-${Date.now().toString(36)}`,
        durationSeconds: request.durationSeconds ?? 5,
        costUsd: 0.15,
      };
    }

    if (!this.isConfigured()) {
      throw Object.assign(new Error("[ReplicateAdapter] REPLICATE_API_KEY is not configured in environment."), {
        code: "AUTH_ERROR",
        isTransient: false,
      });
    }

    const model = (request as any).modelId ?? this.config.defaultVideoModel;

    const res = await this.client.runPrediction(
      model,
      {
        prompt: request.prompt,
        ...(request.styleKeyUrl ? { first_frame_image: request.styleKeyUrl } : {}),
      },
      this.config.videoTimeoutMs,
      onProgress,
    );

    if (!res.success || !res.mediaUrl) {
      const err = res.error;
      throw Object.assign(new Error(`[ReplicateAdapter] Video generation failed: ${err?.message ?? "Unknown error"}`), {
        code: err?.code ?? "PROVIDER_UNAVAILABLE",
        isTransient: err?.isTransient ?? false,
      });
    }

    return {
      videoUrl: res.mediaUrl,
      mediaKey: res.mediaKey,
      durationSeconds: request.durationSeconds ?? 5,
      costUsd: res.costUsd,
    };
  }

  // ─── Unsupported Methods ──────────────────────────────────────────────────

  async generateText(_request: TextGenerationRequest): Promise<TextGenerationResponse> {
    throw new Error("[ReplicateAdapter] Text generation not supported.");
  }

  async generateVoice(_request: VoiceGenerationRequest): Promise<VoiceGenerationResponse> {
    throw new Error("[ReplicateAdapter] Voice generation not supported.");
  }
}
