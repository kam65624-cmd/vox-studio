import { OpenAICompatibleAdapter } from "../openai-compatible/adapter";
import { OpenAICompatibleClient } from "../openai-compatible/client";
import {
  getNVIDIAConfig,
  getNVIDIAModelPreset,
  getNVIDIAApiKeyForModel,
} from "./config";
import { OpenAICompatibleConfig } from "../openai-compatible/types";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  TextGenerationRequest,
  TextGenerationResponse,
} from "../../index";

/**
 * NVIDIAAdapter — wraps the OpenAI-compatible layer for all NVIDIA NIM models.
 *
 * Supported models (all via https://integrate.api.nvidia.com/v1):
 *  • meta/muse-glimmer-30b  — TEXT_GENERATION, REASONING, STRUCTURED_OUTPUT
 *                             temperature=1, top_p=0.95, max_tokens=8192, stream=false
 *                             Key: NVIDIA_MUSE_API_KEY → NVIDIA_API_KEY
 *
 *  • z-ai/glm-5.2           — TEXT_GENERATION, REASONING, STRUCTURED_OUTPUT, VISION
 *                             temperature=1, top_p=1, max_tokens=16384, stream=true, seed=42
 *                             Key: NVIDIA_GLM_API_KEY → NVIDIA_API_KEY
 *
 *  • qwen/qwen-image-edit   — IMAGE_EDITING, IMAGE_GENERATION
 *                             Key: NVIDIA_QWEN_API_KEY → NVIDIA_API_KEY
 *
 * Per-model keys are resolved via getNVIDIAApiKeyForModel().
 * Secrets are never hardcoded — always sourced from environment variables.
 */
export class NVIDIAAdapter extends OpenAICompatibleAdapter {
  private baseConfig: OpenAICompatibleConfig;

  constructor(customConfig?: Partial<OpenAICompatibleConfig>) {
    const baseConfig = getNVIDIAConfig();
    super({ ...baseConfig, ...customConfig });
    this.baseConfig = { ...baseConfig, ...customConfig };
  }

  /**
   * Returns an OpenAICompatibleClient configured with the correct API key
   * for the given model ID. Uses per-model key if set, falls back to shared key.
   */
  private getClientForModel(modelId: string): OpenAICompatibleClient {
    const apiKey = getNVIDIAApiKeyForModel(modelId);
    // Reuse the shared client if the API key matches (avoids unnecessary allocation)
    const sharedKey = this.client.getSanitizedConfig().isConfigured
      ? (this.baseConfig.apiKey ?? "")
      : "";

    if (apiKey === sharedKey || apiKey === "") {
      return this.client;
    }

    return new OpenAICompatibleClient({
      ...this.baseConfig,
      apiKey,
    });
  }

  // ─── Text Generation (Muse 30B or GLM-5.2) ──────────────────────────────────

  override async generateText(
    request: TextGenerationRequest & { modelId?: string }
  ): Promise<TextGenerationResponse> {
    const modelId = request.modelId ?? this.getClient().getSanitizedConfig().defaultModel;
    const preset = getNVIDIAModelPreset(modelId);
    const client = this.getClientForModel(modelId);

    const res = await client.chatCompletion({
      model: modelId,
      messages: [
        ...(request.systemPrompt
          ? [{ role: "system" as const, content: request.systemPrompt }]
          : []),
        { role: "user" as const, content: request.prompt },
      ],
      temperature: request.temperature ?? preset.temperature,
      top_p: preset.top_p,
      max_tokens: request.maxTokens ?? preset.max_tokens,
      stream: preset.stream,
      ...(preset.seed !== undefined ? { seed: preset.seed } : {}),
    });

    if (!res.success) {
      throw res.error || new Error(`Text generation failed for NVIDIA model ${modelId}`);
    }

    return {
      text: res.text,
      model: res.model,
      tokensUsed: res.usage?.totalTokens || 0,
      costUsd: 0.0001 * (res.usage?.totalTokens || 100),
    };
  }

  // ─── Structured Output ───────────────────────────────────────────────────────

  override async generateStructuredOutput(
    request: TextGenerationRequest & { modelId?: string }
  ): Promise<TextGenerationResponse> {
    const modelId = request.modelId ?? this.getClient().getSanitizedConfig().defaultModel;
    const preset = getNVIDIAModelPreset(modelId);
    const client = this.getClientForModel(modelId);

    const res = await client.chatCompletion({
      model: modelId,
      messages: [
        ...(request.systemPrompt
          ? [{ role: "system" as const, content: request.systemPrompt }]
          : []),
        { role: "user" as const, content: request.prompt },
      ],
      temperature: request.temperature ?? preset.temperature,
      top_p: preset.top_p,
      max_tokens: request.maxTokens ?? preset.max_tokens,
      stream: false, // structured output must not stream
      ...(preset.seed !== undefined ? { seed: preset.seed } : {}),
      response_format: { type: "json_object" },
    });

    if (!res.success) {
      throw res.error || new Error(`Structured output failed for NVIDIA model ${modelId}`);
    }

    return {
      text: res.text,
      model: res.model,
      tokensUsed: res.usage?.totalTokens || 0,
      costUsd: 0.0001 * (res.usage?.totalTokens || 100),
    };
  }

  // ─── Image Generation / Editing (qwen/qwen-image-edit) ──────────────────────

  async generateImage(
    request: ImageGenerationRequest & { modelId?: string }
  ): Promise<ImageGenerationResponse> {
    const modelId = request.modelId ?? "qwen/qwen-image-edit";
    const preset = getNVIDIAModelPreset(modelId);
    const client = this.getClientForModel(modelId);

    const prompt = request.negativePrompt
      ? `${request.prompt}\n\nNegative: ${request.negativePrompt}`
      : request.prompt;

    const res = await client.chatCompletion({
      model: modelId,
      messages: [{ role: "user" as const, content: prompt }],
      temperature: preset.temperature,
      top_p: preset.top_p,
      max_tokens: preset.max_tokens,
      stream: preset.stream,
    });

    if (!res.success) {
      throw res.error || new Error(`Image generation failed for NVIDIA model ${modelId}`);
    }

    const imageUrl: string =
      (res.rawResponse as any)?.data?.[0]?.url ||
      (res.rawResponse as any)?.choices?.[0]?.message?.content ||
      res.text ||
      `https://integrate.api.nvidia.com/v1/images/generated`;

    const mediaKey = res.requestId
      ? `nvidia-img-${res.requestId}`
      : `nvidia-img-${Date.now().toString(36)}`;

    return {
      imageUrl,
      mediaKey,
      costUsd: 0.002,
    };
  }
}
