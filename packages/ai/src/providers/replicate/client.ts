/**
 * Replicate Unified Prediction Client (P0-N Track N.1)
 *
 * Single client handling Submit -> Poll -> Result for Image Generation,
 * Image Editing, and Video Generation on Replicate API.
 *
 * REPLICATE_API_KEY is strictly redacted from error tracebacks and logs.
 */

import type { ReplicateConfig } from "./config";
import type { ReplicateProviderExecutionResponse } from "./types";

export class ReplicateClient {
  constructor(private config: ReplicateConfig) {}

  isConfigured(): boolean {
    return this.config.apiKey.trim().length > 0;
  }

  getSanitizedConfig() {
    return {
      hasApiKey: this.isConfigured(),
      baseUrl: this.config.baseUrl,
      defaultImageModel: this.config.defaultImageModel,
      defaultVideoModel: this.config.defaultVideoModel,
    };
  }

  /**
   * Submits a prediction task and polls until completion or timeout.
   */
  async runPrediction(
    model: string,
    input: Record<string, any>,
    timeoutMs?: number,
    onProgress?: (progress: number, phase: string) => void,
    fetchFn: typeof fetch = globalThis.fetch,
  ): Promise<ReplicateProviderExecutionResponse> {
    const t0 = Date.now();
    const effectiveTimeout = timeoutMs ?? this.config.imageTimeoutMs;

    if (!this.isConfigured()) {
      return {
        success: false,
        predictionId: "",
        model,
        mediaKey: `rep-err-${Date.now().toString(36)}`,
        latencyMs: 0,
        costUsd: 0,
        error: {
          code: "AUTH_ERROR",
          message: "REPLICATE_API_KEY is not configured in environment.",
          isTransient: false,
        },
      };
    }

    // Submit prediction — POST /v1/models/{owner}/{name}/predictions OR POST /v1/predictions
    const isModelPath = model.includes("/");
    const url = isModelPath
      ? `${this.config.baseUrl}/models/${model}/predictions`
      : `${this.config.baseUrl}/predictions`;

    const payload: Record<string, any> = { input };
    if (!isModelPath) {
      payload["version"] = model;
    }

    let resp: Response;
    try {
      resp = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          Prefer: "respond-async",
        },
        body: JSON.stringify(payload),
      });
    } catch (err: unknown) {
      return {
        success: false,
        predictionId: "",
        model,
        mediaKey: `rep-err-${Date.now().toString(36)}`,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        error: {
          code: "NETWORK_ERROR",
          message: "Network error submitting prediction to Replicate",
          isTransient: true,
        },
      };
    }

    const latencyMs0 = Date.now() - t0;

    if (!resp.ok) {
      let errText = "";
      try { errText = await resp.text(); } catch { /* ignore */ }
      const status = resp.status;

      const code =
        status === 401
          ? "AUTH_ERROR"
          : status === 429
          ? "RATE_LIMIT"
          : status === 400 && errText.toLowerCase().includes("nsfw")
          ? "CONTENT_POLICY"
          : status === 400
          ? "INVALID_REQUEST"
          : status >= 500
          ? "PROVIDER_UNAVAILABLE"
          : "UNKNOWN";

      const isTransient = status === 429 || status >= 500;

      return {
        success: false,
        predictionId: "",
        model,
        mediaKey: `rep-err-${Date.now().toString(36)}`,
        latencyMs: latencyMs0,
        costUsd: 0,
        error: {
          code,
          message: `Replicate API HTTP ${status}: ${errText.slice(0, 200)}`,
          isTransient,
          httpStatus: status,
        },
      };
    }

    const predictionData = await resp.json();
    const predictionId = predictionData.id;

    if (!predictionId) {
      return {
        success: false,
        predictionId: "",
        model,
        mediaKey: `rep-err-${Date.now().toString(36)}`,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        error: {
          code: "INVALID_REQUEST",
          message: "Replicate response missing prediction ID",
          isTransient: false,
        },
      };
    }

    // Fast-path: if status is already succeeded (e.g. sync response)
    if (predictionData.status === "succeeded" && predictionData.output) {
      return this.formatSuccessResponse(predictionId, model, predictionData.output, t0);
    }

    // ─── Polling Loop ─────────────────────────────────────────────────────────
    const pollUrl = predictionData.urls?.get ?? `${this.config.baseUrl}/predictions/${predictionId}`;
    const deadline = Date.now() + effectiveTimeout;
    let attempts = 0;

    while (Date.now() < deadline) {
      attempts++;
      const pct = Math.min(95, attempts * 5);
      onProgress?.(pct, `Polling Replicate prediction ${predictionId} (attempt ${attempts})`);

      await new Promise((r) => setTimeout(r, this.config.pollIntervalMs));

      let pollResp: Response;
      try {
        pollResp = await fetchFn(pollUrl, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        });
      } catch {
        continue; // transient poll network error, retry next loop
      }

      if (!pollResp.ok) {
        if (pollResp.status === 401) {
          return {
            success: false,
            predictionId,
            model,
            mediaKey: `rep-err-${Date.now().toString(36)}`,
            latencyMs: Date.now() - t0,
            costUsd: 0,
            error: {
              code: "AUTH_ERROR",
              message: "Replicate API authentication failed during polling",
              isTransient: false,
            },
          };
        }
        continue;
      }

      const pollData = await pollResp.json();
      const status = pollData.status;

      if (status === "succeeded") {
        onProgress?.(100, `Replicate prediction ${predictionId} succeeded`);
        return this.formatSuccessResponse(predictionId, model, pollData.output, t0);
      }

      if (status === "failed" || status === "canceled" || status === "aborted") {
        const errorMsg = pollData.error ?? `Prediction ${status}`;
        const isNsfw = errorMsg.toLowerCase().includes("nsfw") || errorMsg.toLowerCase().includes("content policy");
        return {
          success: false,
          predictionId,
          model,
          mediaKey: `rep-err-${Date.now().toString(36)}`,
          latencyMs: Date.now() - t0,
          costUsd: 0,
          error: {
            code: isNsfw ? "CONTENT_POLICY" : status === "canceled" ? "PERMANENT" : "PROVIDER_UNAVAILABLE",
            message: `Replicate prediction failed: ${errorMsg}`,
            isTransient: status !== "canceled" && !isNsfw,
          },
        };
      }
    }

    // Timeout exceeded
    return {
      success: false,
      predictionId,
      model,
      mediaKey: `rep-timeout-${Date.now().toString(36)}`,
      latencyMs: Date.now() - t0,
      costUsd: 0,
      error: {
        code: "TIMEOUT",
        message: `Replicate prediction timed out after ${effectiveTimeout}ms`,
        isTransient: true,
      },
    };
  }

  private formatSuccessResponse(
    predictionId: string,
    model: string,
    output: any,
    t0: number,
  ): ReplicateProviderExecutionResponse {
    let mediaUrl: string | undefined;
    let mediaUrls: string[] | undefined;

    if (typeof output === "string") {
      mediaUrl = output;
      mediaUrls = [output];
    } else if (Array.isArray(output) && output.length > 0) {
      mediaUrl = output[0];
      mediaUrls = output;
    } else if (output && typeof output === "object" && output.url) {
      mediaUrl = output.url;
      mediaUrls = [output.url];
    }

    const mediaKey = `rep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const isVideo = model.includes("video") || (mediaUrl && mediaUrl.endsWith(".mp4"));
    const costUsd = isVideo ? 0.15 : 0.04;

    return {
      success: true,
      predictionId,
      model,
      ...(mediaUrl ? { mediaUrl } : {}),
      ...(mediaUrls ? { mediaUrls } : {}),
      mediaKey,
      latencyMs: Date.now() - t0,
      costUsd,
    };
  }
}
