/**
 * Visual Provider HTTP Client (P0-N Track N1)
 *
 * Implements standard REST client calls for Image Generation & Image Editing APIs:
 *   - Text-to-Image: POST /v1/images/generations
 *   - Image Editing: POST /v1/images/edits
 *
 * API keys are strictly redacted from logs and error objects.
 */

import type { OpenAIVisualConfig } from "./config";
import type { ImageGenerationOptions, ImageEditOptions, VisualProviderResponse } from "./types";

export class OpenAIVisualClient {
  constructor(private config: OpenAIVisualConfig) {}

  isConfigured(): boolean {
    return this.config.apiKey.trim().length > 0;
  }

  getSanitizedConfig() {
    return {
      hasApiKey: this.isConfigured(),
      baseUrl: this.config.baseUrl,
      defaultImageModel: this.config.defaultImageModel,
    };
  }

  /**
   * Generates a new image from a text prompt.
   */
  async generateImage(
    options: ImageGenerationOptions,
    fetchFn: typeof fetch = globalThis.fetch,
  ): Promise<VisualProviderResponse> {
    const t0 = Date.now();
    const model = options.model ?? this.config.defaultImageModel;
    const url = `${this.config.baseUrl}/images/generations`;

    const size = options.width && options.height ? `${options.width}x${options.height}` : "1024x1024";

    const payload: Record<string, any> = {
      model,
      prompt: options.prompt,
      n: 1,
      size,
      response_format: options.responseFormat ?? "url",
    };

    if (model === "dall-e-3") {
      payload["quality"] = options.quality ?? "standard";
      payload["style"] = options.style ?? "vivid";
    }

    let resp: Response;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

      resp = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        success: false,
        mediaKey: `img-err-${Date.now().toString(36)}`,
        model,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        error: {
          code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
          message: isAbort ? "Visual API request timed out" : "Network error reaching Visual API",
          isTransient: true,
        },
      };
    }

    const latencyMs = Date.now() - t0;

    if (!resp.ok) {
      let errBody = "";
      try { errBody = await resp.text(); } catch { /* ignore */ }

      const status = resp.status;
      const isTransient = status === 429 || status >= 500;
      const code =
        status === 401
          ? "AUTH_ERROR"
          : status === 429
          ? "RATE_LIMIT"
          : status === 400 && errBody.includes("content_policy")
          ? "CONTENT_POLICY"
          : status === 400
          ? "INVALID_REQUEST"
          : "PROVIDER_ERROR";

      return {
        success: false,
        mediaKey: `img-err-${Date.now().toString(36)}`,
        model,
        latencyMs,
        costUsd: 0,
        error: {
          code,
          message: `Visual API HTTP ${status}: ${errBody.slice(0, 200)}`,
          isTransient,
          httpStatus: status,
        },
      };
    }

    const data = await resp.json();
    const item = data.data?.[0];
    const imageUrl = item?.url;
    const imageBase64 = item?.b64_json;
    const mediaKey = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const costUsd = model === "dall-e-3" ? 0.04 : 0.02;

    return {
      success: true,
      imageUrl,
      imageBase64,
      mediaKey,
      model,
      latencyMs,
      costUsd,
    };
  }

  /**
   * Edits an existing image based on a prompt instruction.
   */
  async editImage(
    options: ImageEditOptions,
    fetchFn: typeof fetch = globalThis.fetch,
  ): Promise<VisualProviderResponse> {
    const t0 = Date.now();
    const model = options.model ?? this.config.defaultEditModel;
    const url = `${this.config.baseUrl}/images/edits`;

    const formData = new FormData();
    formData.append("model", model);
    formData.append("prompt", options.prompt);
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("response_format", options.responseFormat ?? "url");

    if (Buffer.isBuffer(options.image)) {
      const plainBuf: ArrayBuffer = options.image.buffer.slice(
        options.image.byteOffset,
        options.image.byteOffset + options.image.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([plainBuf], { type: "image/png" });
      formData.append("image", blob, "reference.png");
    } else {
      formData.append("image", options.image);
    }

    let resp: Response;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

      resp = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timer);
    } catch (err: unknown) {
      return {
        success: false,
        mediaKey: `img-edit-err-${Date.now().toString(36)}`,
        model,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        error: {
          code: "NETWORK_ERROR",
          message: "Network error during image edit API call",
          isTransient: true,
        },
      };
    }

    const latencyMs = Date.now() - t0;

    if (!resp.ok) {
      let errBody = "";
      try { errBody = await resp.text(); } catch { /* ignore */ }

      return {
        success: false,
        mediaKey: `img-edit-err-${Date.now().toString(36)}`,
        model,
        latencyMs,
        costUsd: 0,
        error: {
          code: resp.status === 401 ? "AUTH_ERROR" : "PROVIDER_ERROR",
          message: `Visual Edit API HTTP ${resp.status}: ${errBody.slice(0, 200)}`,
          isTransient: resp.status === 429 || resp.status >= 500,
          httpStatus: resp.status,
        },
      };
    }

    const data = await resp.json();
    const item = data.data?.[0];
    const imageUrl = item?.url;
    const imageBase64 = item?.b64_json;
    const mediaKey = `img-edit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    return {
      success: true,
      imageUrl,
      imageBase64,
      mediaKey,
      model,
      latencyMs,
      costUsd: 0.02,
    };
  }
}
