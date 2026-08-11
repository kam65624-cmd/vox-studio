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
   * AND the correct timeout for the given model ID.
   * GLM-5.2 can take up to 120s for complex reasoning — we give it extra headroom.
   */
  private getClientForModel(modelId: string): OpenAICompatibleClient {
    const apiKey = getNVIDIAApiKeyForModel(modelId);
    const sharedKey = this.baseConfig.apiKey ?? "";

    // Per-model timeout overrides (read from env or use sensible defaults)
    const perModelTimeoutMs: Record<string, number> = {
      "meta/muse-glimmer-30b": parseInt(process.env["NVIDIA_MUSE_TIMEOUT_MS"] || "60000", 10),
      "z-ai/glm-5.2": parseInt(process.env["NVIDIA_GLM_TIMEOUT_MS"] || "120000", 10),
      "qwen/qwen-image-edit": parseInt(process.env["NVIDIA_QWEN_TIMEOUT_MS"] || "90000", 10),
    };
    const timeoutMs = perModelTimeoutMs[modelId] ?? this.baseConfig.timeoutMs ?? 60000;

    // If key and timeout both match the base config, reuse the shared client
    if (
      (apiKey === sharedKey || apiKey === "") &&
      timeoutMs === (this.baseConfig.timeoutMs ?? 60000)
    ) {
      return this.client;
    }

    return new OpenAICompatibleClient({
      ...this.baseConfig,
      apiKey: apiKey || sharedKey,
      timeoutMs,
    });
  }

  override isConfigured(): boolean {
    if (this.client.isConfigured()) return true;
    const museKey = getNVIDIAApiKeyForModel("meta/muse-glimmer-30b");
    const glmKey = getNVIDIAApiKeyForModel("z-ai/glm-5.2");
    const qwenKey = getNVIDIAApiKeyForModel("qwen/qwen-image-edit");
    return Boolean(
      (museKey && museKey.trim().length > 0) ||
      (glmKey && glmKey.trim().length > 0) ||
      (qwenKey && qwenKey.trim().length > 0)
    );
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
      stream: false,
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
  //
  // NVIDIA NIM does NOT expose a /images/generations or /images/edits endpoint.
  // All models — including image-capable models — are accessed via /chat/completions.
  // For qwen/qwen-image-edit:
  //   • Text-to-image: pass text prompt → model returns image URL in response
  //   • Image editing: pass base64 image data in a multimodal user message
  // We use stream: false since we need the full response to extract the image URL.

  async generateImage(
    request: ImageGenerationRequest & { modelId?: string; sourceImageBase64?: string }
  ): Promise<ImageGenerationResponse> {
    const modelId = request.modelId ?? "qwen/qwen-image-edit";
    const client = this.getClientForModel(modelId);

    const userMessageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }> =
      request.sourceImageBase64
        ? [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${request.sourceImageBase64}` },
            },
            { type: "text", text: request.prompt },
          ]
        : request.prompt;

    const res = await client.chatCompletion({
      model: modelId,
      messages: [
        {
          role: "user" as const,
          content: typeof userMessageContent === "string"
            ? userMessageContent
            : JSON.stringify(userMessageContent),
        },
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1024,
      stream: false,
    });

    if (!res.success) {
      throw res.error || new Error(`Image generation failed for NVIDIA model ${modelId}`);
    }

    // qwen/qwen-image-edit returns either:
    //   • A URL in the text (text-to-image generation)
    //   • A base64 string in data[0].b64_json
    //   • A Markdown image link: ![](url)
    const rawText = res.text;
    const urlMatch = rawText.match(/https?:\/\/[^\s)"']+/);
    const imageUrl: string =
      urlMatch?.[0] ||
      (res.rawResponse as any)?.data?.[0]?.url ||
      (res.rawResponse as any)?.data?.[0]?.b64_json ||
      rawText ||
      `nvidia-img-placeholder`;

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
