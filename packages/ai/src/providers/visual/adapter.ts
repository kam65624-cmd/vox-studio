/**
 * Visual Provider Adapter (P0-N Track N1)
 *
 * Implements UnifiedProviderAdapter for IMAGE_GENERATION & IMAGE_EDITING.
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

import { OpenAIVisualClient } from "./client";
import { getOpenAIVisualConfig, type OpenAIVisualConfig } from "./config";

export class OpenAIVisualAdapter implements UnifiedProviderAdapter {
  readonly providerId = "openai-visual";
  readonly displayName = "OpenAI Visual Adapter";

  private client: OpenAIVisualClient;

  constructor(customConfig?: Partial<OpenAIVisualConfig>) {
    const base = getOpenAIVisualConfig();
    this.client = new OpenAIVisualClient({ ...base, ...customConfig });
  }

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  getClient(): OpenAIVisualClient {
    return this.client;
  }

  // ─── Image Generation ──────────────────────────────────────────────────────

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Mock mode isolation
    if (process.env["VOX_RUNTIME_MODE"] === "mock") {
      return {
        imageUrl: `mock://visual/image-${Date.now().toString(36)}.png`,
        mediaKey: `mock-img-${Date.now().toString(36)}`,
        costUsd: 0.01,
      };
    }

    if (!this.isConfigured()) {
      throw Object.assign(new Error("[OpenAIVisualAdapter] OPENAI_API_KEY is not configured in environment."), {
        code: "AUTH_ERROR",
        isTransient: false,
      });
    }

    const res = await this.client.generateImage({
      prompt: request.prompt,
      ...(request.negativePrompt ? { negativePrompt: request.negativePrompt } : {}),
      ...(request.width ? { width: request.width } : {}),
      ...(request.height ? { height: request.height } : {}),
      ...(request.seed !== undefined ? { seed: request.seed } : {}),
    });

    if (!res.success || (!res.imageUrl && !res.imageBase64)) {
      const err = res.error;
      throw Object.assign(new Error(`[OpenAIVisualAdapter] Image generation failed: ${err?.message ?? "Unknown error"}`), {
        code: err?.code ?? "PROVIDER_ERROR",
        isTransient: err?.isTransient ?? false,
      });
    }

    return {
      imageUrl: res.imageUrl ?? `data:image/png;base64,${res.imageBase64}`,
      mediaKey: res.mediaKey,
      costUsd: res.costUsd,
    };
  }

  // ─── Image Editing ─────────────────────────────────────────────────────────

  async editImage(request: ImageGenerationRequest & { referenceImageKey: string }): Promise<ImageGenerationResponse> {
    if (process.env["VOX_RUNTIME_MODE"] === "mock") {
      return {
        imageUrl: `mock://visual/edited-${request.referenceImageKey}.png`,
        mediaKey: `mock-edit-${Date.now().toString(36)}`,
        costUsd: 0.015,
      };
    }

    if (!this.isConfigured()) {
      throw Object.assign(new Error("[OpenAIVisualAdapter] OPENAI_API_KEY is not configured in environment."), {
        code: "AUTH_ERROR",
        isTransient: false,
      });
    }

    const res = await this.client.editImage({
      prompt: request.prompt,
      image: request.referenceImageKey,
      ...(request.width ? { width: request.width } : {}),
      ...(request.height ? { height: request.height } : {}),
    });

    if (!res.success || (!res.imageUrl && !res.imageBase64)) {
      const err = res.error;
      throw Object.assign(new Error(`[OpenAIVisualAdapter] Image edit failed: ${err?.message ?? "Unknown error"}`), {
        code: err?.code ?? "PROVIDER_ERROR",
        isTransient: err?.isTransient ?? false,
      });
    }

    return {
      imageUrl: res.imageUrl ?? `data:image/png;base64,${res.imageBase64}`,
      mediaKey: res.mediaKey,
      costUsd: res.costUsd,
    };
  }

  // ─── Unsupported Methods ──────────────────────────────────────────────────

  async generateText(_request: TextGenerationRequest): Promise<TextGenerationResponse> {
    throw new Error("[OpenAIVisualAdapter] Text generation not supported.");
  }

  async generateVideo(_request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    throw new Error("[OpenAIVisualAdapter] Video generation not supported.");
  }

  async generateVoice(_request: VoiceGenerationRequest): Promise<VoiceGenerationResponse> {
    throw new Error("[OpenAIVisualAdapter] Voice generation not supported.");
  }
}
