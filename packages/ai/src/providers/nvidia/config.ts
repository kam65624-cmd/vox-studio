import { OpenAICompatibleConfig } from "../openai-compatible/types";

// ─── Per-Model Parameter Presets ──────────────────────────────────────────────

export interface NVIDIAModelPreset {
  /** Model ID as used in NVIDIA NIM API requests */
  modelId: string;
  displayName: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  /** Whether this model is called with stream=true */
  stream: boolean;
  /** Optional fixed seed for deterministic outputs */
  seed?: number | undefined;
  /** Capability category for routing */
  category: "text" | "image";
}

export const NVIDIA_MODEL_PRESETS: Record<string, NVIDIAModelPreset> = {
  "meta/muse-glimmer-30b": {
    modelId: "meta/muse-glimmer-30b",
    displayName: "Meta Muse Glimmer 30B",
    temperature: 1,
    top_p: 0.95,
    max_tokens: 8192,
    stream: false,
    category: "text",
  },
  "z-ai/glm-5.2": {
    modelId: "z-ai/glm-5.2",
    displayName: "Z.AI GLM-5.2",
    temperature: 1,
    top_p: 1,
    max_tokens: 16384,
    stream: true,
    seed: 42,
    category: "text",
  },
  "qwen/qwen-image-edit": {
    modelId: "qwen/qwen-image-edit",
    displayName: "Qwen Image Edit",
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 1024,
    stream: false,
    category: "image",
  },
};

/** Returns the preset for a given NVIDIA NIM model ID, or a sensible default. */
export function getNVIDIAModelPreset(modelId: string): NVIDIAModelPreset {
  return (
    NVIDIA_MODEL_PRESETS[modelId] ?? {
      modelId,
      displayName: modelId,
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
      stream: false,
      category: "text",
    }
  );
}

// ─── Provider-Level Config ─────────────────────────────────────────────────────

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

  const maxRetriesEnv =
    typeof process !== "undefined" ? process.env["NVIDIA_MAX_RETRIES"] : undefined;
  const maxRetries = maxRetriesEnv ? parseInt(maxRetriesEnv, 10) : 2;

  return {
    providerId: "nvidia",
    displayName: "NVIDIA NIM",
    baseUrl,
    apiKey,
    apiKeyEnv: "NVIDIA_API_KEY",
    defaultModel,
    timeoutMs,
    maxRetries,
  };
}

/**
 * Returns the model ID configured for a specific NVIDIA NIM model slot.
 * Falls back to the canonical model ID when no override is set.
 */
export function getNVIDIAModelId(
  slot: "muse" | "glm" | "qwen"
): string {
  if (typeof process === "undefined") {
    return slot === "muse"
      ? "meta/muse-glimmer-30b"
      : slot === "glm"
      ? "z-ai/glm-5.2"
      : "qwen/qwen-image-edit";
  }
  switch (slot) {
    case "muse":
      return process.env["NVIDIA_MUSE_MODEL"] || "meta/muse-glimmer-30b";
    case "glm":
      return process.env["NVIDIA_GLM_MODEL"] || "z-ai/glm-5.2";
    case "qwen":
      return process.env["NVIDIA_QWEN_MODEL"] || "qwen/qwen-image-edit";
  }
}

/**
 * Returns the API key for a specific NVIDIA NIM model.
 * Priority: per-model key (NVIDIA_<SLOT>_API_KEY) → shared key (NVIDIA_API_KEY) → ""
 *
 * This allows each model to use a separate NVIDIA credential if needed,
 * while still supporting a single shared key for accounts with one key.
 */
export function getNVIDIAApiKeyForModel(modelId: string): string {
  if (typeof process === "undefined") return "";

  const slotKeyMap: Record<string, string> = {
    "meta/muse-glimmer-30b": process.env["NVIDIA_MUSE_API_KEY"] || "",
    "z-ai/glm-5.2":          process.env["NVIDIA_GLM_API_KEY"]  || "",
    "qwen/qwen-image-edit":  process.env["NVIDIA_QWEN_API_KEY"] || "",
  };

  const perModelKey = slotKeyMap[modelId];
  if (perModelKey && perModelKey.trim().length > 0) return perModelKey;

  // Fallback to shared key
  return process.env["NVIDIA_API_KEY"] || "";
}
