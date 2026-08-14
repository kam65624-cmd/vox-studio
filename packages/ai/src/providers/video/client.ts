/**
 * Video Provider HTTP Client (P0-N Track N2)
 *
 * Implements real async task lifecycle for Video Generation APIs:
 *   1. Submit task: POST /tasks or /image_to_video
 *   2. Poll status: GET /tasks/{id}
 *   3. Emit heartbeats during long-running generation
 *
 * Secrets are strictly redacted from error messages and logs.
 */

import type { RealVideoConfig } from "./config";
import type { VideoGenerationOptions, VideoProviderResponse } from "./types";

export class RealVideoClient {
  constructor(private config: RealVideoConfig) {}

  isConfigured(): boolean {
    return this.config.apiKey.trim().length > 0;
  }

  getSanitizedConfig() {
    return {
      hasApiKey: this.isConfigured(),
      baseUrl: this.config.baseUrl,
      defaultVideoModel: this.config.defaultVideoModel,
    };
  }

  /**
   * Submits a video generation task and polls until completion or timeout.
   */
  async generateVideo(
    options: VideoGenerationOptions,
    onProgress?: (progress: number, phase: string) => void,
    fetchFn: typeof fetch = globalThis.fetch,
  ): Promise<VideoProviderResponse> {
    const t0 = Date.now();
    const model = options.model ?? this.config.defaultVideoModel;
    const durationSeconds = options.durationSeconds ?? 5;

    const url = `${this.config.baseUrl}/tasks`;
    const payload = {
      model,
      promptText: options.prompt,
      promptImage: options.imagePromptUrl,
      duration: durationSeconds,
      ratio: options.aspectRatio === "9:16" ? "768:1280" : "1280:768",
    };

    let resp: Response;
    try {
      resp = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06",
        },
        body: JSON.stringify(payload),
      });
    } catch (err: unknown) {
      return {
        success: false,
        mediaKey: `vid-err-${Date.now().toString(36)}`,
        durationSeconds,
        model,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        error: {
          code: "NETWORK_ERROR",
          message: "Network error submitting video task",
          isTransient: true,
        },
      };
    }

    if (!resp.ok) {
      let errBody = "";
      try { errBody = await resp.text(); } catch { /* ignore */ }
      const status = resp.status;

      return {
        success: false,
        mediaKey: `vid-err-${Date.now().toString(36)}`,
        durationSeconds,
        model,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        error: {
          code: status === 401 ? "AUTH_ERROR" : status === 429 ? "RATE_LIMIT" : "PROVIDER_ERROR",
          message: `Video API HTTP ${status}: ${errBody.slice(0, 200)}`,
          isTransient: status === 429 || status >= 500,
          httpStatus: status,
        },
      };
    }

    const taskData = await resp.json();
    const taskId = taskData.id ?? taskData.taskId;

    if (!taskId) {
      return {
        success: false,
        mediaKey: `vid-err-${Date.now().toString(36)}`,
        durationSeconds,
        model,
        latencyMs: Date.now() - t0,
        costUsd: 0,
        error: {
          code: "INVALID_RESPONSE",
          message: "Video API response missing task ID",
          isTransient: false,
        },
      };
    }

    // ─── Polling Loop ─────────────────────────────────────────────────────────
    const deadline = Date.now() + this.config.timeoutMs;
    let attempts = 0;

    while (Date.now() < deadline) {
      attempts++;
      onProgress?.(Math.min(95, attempts * 10), `Polling video task ${taskId}`);

      await new Promise((r) => setTimeout(r, this.config.pollIntervalMs));

      let pollResp: Response;
      try {
        pollResp = await fetchFn(`${this.config.baseUrl}/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "X-Runway-Version": "2024-11-06",
          },
        });
      } catch {
        continue; // transient poll network error, retry next loop
      }

      if (!pollResp.ok) continue;

      const pollData = await pollResp.json();
      const status = (pollData.status ?? "").toUpperCase();

      if (status === "SUCCEEDED" || status === "COMPLETED") {
        const outputUrl = pollData.output?.[0] ?? pollData.videoUrl ?? pollData.url;
        const mediaKey = `vid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        onProgress?.(100, "Video task completed");

        return {
          success: true,
          videoUrl: outputUrl,
          mediaKey,
          durationSeconds,
          model,
          latencyMs: Date.now() - t0,
          costUsd: durationSeconds * 0.05, // ~$0.25 per 5s video
        };
      }

      if (status === "FAILED" || status === "CANCELLED") {
        return {
          success: false,
          mediaKey: `vid-err-${Date.now().toString(36)}`,
          durationSeconds,
          model,
          latencyMs: Date.now() - t0,
          costUsd: 0,
          error: {
            code: "PROVIDER_ERROR",
            message: `Video task ${taskId} failed: ${pollData.failure ?? pollData.error ?? "Unknown error"}`,
            isTransient: false,
          },
        };
      }
    }

    // Timeout exceeded
    return {
      success: false,
      mediaKey: `vid-timeout-${Date.now().toString(36)}`,
      durationSeconds,
      model,
      latencyMs: Date.now() - t0,
      costUsd: 0,
      error: {
        code: "TIMEOUT",
        message: `Video generation task timed out after ${this.config.timeoutMs}ms`,
        isTransient: true,
      },
    };
  }
}
