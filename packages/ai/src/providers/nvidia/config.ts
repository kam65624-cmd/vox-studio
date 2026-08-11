import { OpenAICompatibleConfig } from "../openai-compatible/types";

export function getNVIDIAConfig(): OpenAICompatibleConfig {
  const baseUrl =
    (typeof process !== "undefined" && process.env["NVIDIA_BASE_URL"]) ||
    "https://integrate.api.nvidia.com/v1";

  const apiKey = (typeof process !== "undefined" && process.env["NVIDIA_API_KEY"]) || "";

  const defaultModel =
    (typeof process !== "undefined" && process.env["NVIDIA_MUSE_MODEL"]) ||
    "meta/muse-glimmer-30b";

  const timeoutEnv = typeof process !== "undefined" ? process.env["NVIDIA_TIMEOUT_MS"] : undefined;
  const timeoutMs = timeoutEnv ? parseInt(timeoutEnv, 10) : 60000;

  return {
    providerId: "nvidia",
    displayName: "NVIDIA NIM",
    baseUrl,
    apiKey,
    apiKeyEnv: "NVIDIA_API_KEY",
    defaultModel,
    timeoutMs,
  };
}
