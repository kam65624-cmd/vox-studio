/**
 * Video Provider Config (P0-N Track N2)
 *
 * Configures video generation provider credentials and polling parameters.
 * Reads environment variables only — zero hardcoded API keys.
 */

export interface RealVideoConfig {
  readonly providerId: "runway-video";
  readonly displayName: "Runway Video API";
  apiKey: string;
  baseUrl: string;
  defaultVideoModel: string;
  timeoutMs: number;
  pollIntervalMs: number;
  maxRetries: number;
}

export function getRealVideoConfig(): RealVideoConfig {
  return {
    providerId: "runway-video",
    displayName: "Runway Video API",
    apiKey: process.env["RUNWAY_API_KEY"] ?? process.env["REPLICATE_API_KEY"] ?? "",
    baseUrl: process.env["RUNWAY_BASE_URL"] ?? "https://api.dev.runwayml.com/v1",
    defaultVideoModel: process.env["RUNWAY_VIDEO_MODEL"] ?? "gen3a_turbo",
    timeoutMs: parseInt(process.env["RUNWAY_TIMEOUT_MS"] ?? "300000", 10), // 5 min timeout for video
    pollIntervalMs: parseInt(process.env["RUNWAY_POLL_INTERVAL_MS"] ?? "5000", 10), // 5s poll interval
    maxRetries: parseInt(process.env["RUNWAY_MAX_RETRIES"] ?? "2", 10),
  };
}
