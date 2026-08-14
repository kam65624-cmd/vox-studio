/**
 * Replicate Provider Config (P0-N Track N.1)
 *
 * Reads REPLICATE_API_KEY from environment variables only — zero hardcoded API keys.
 */

export interface ReplicateConfig {
  readonly providerId: "replicate";
  readonly displayName: "Replicate Hosted AI Engine";
  apiKey: string;
  baseUrl: string;
  defaultImageModel: string;
  defaultEditModel: string;
  defaultVideoModel: string;
  imageTimeoutMs: number;
  videoTimeoutMs: number;
  pollIntervalMs: number;
  maxRetries: number;
}

export function getReplicateConfig(): ReplicateConfig {
  return {
    providerId: "replicate",
    displayName: "Replicate Hosted AI Engine",
    apiKey: process.env["REPLICATE_API_KEY"] ?? "",
    baseUrl: process.env["REPLICATE_BASE_URL"] ?? "https://api.replicate.com/v1",
    defaultImageModel: process.env["REPLICATE_IMAGE_MODEL"] ?? "black-forest-labs/flux-1.1-pro",
    defaultEditModel: process.env["REPLICATE_EDIT_MODEL"] ?? "black-forest-labs/flux-fill-pro",
    defaultVideoModel: process.env["REPLICATE_VIDEO_MODEL"] ?? "minimax/video-01",
    imageTimeoutMs: parseInt(process.env["REPLICATE_IMAGE_TIMEOUT_MS"] ?? "120000", 10), // 2 minutes
    videoTimeoutMs: parseInt(process.env["REPLICATE_VIDEO_TIMEOUT_MS"] ?? "300000", 10), // 5 minutes
    pollIntervalMs: parseInt(process.env["REPLICATE_POLL_INTERVAL_MS"] ?? "3000", 10),  // 3 seconds
    maxRetries: parseInt(process.env["REPLICATE_MAX_RETRIES"] ?? "2", 10),
  };
}
