/**
 * ElevenLabs Provider Config (P0-M Track M5)
 *
 * All secrets from environment variables — never hardcoded.
 */

export interface ElevenLabsConfig {
  readonly providerId: "elevenlabs";
  readonly displayName: "ElevenLabs";
  apiKey: string;
  baseUrl: string;
  defaultVoiceId: string;
  defaultModelId: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface ElevenLabsVoiceSettings {
  stability?: number;          // 0–1, default 0.5
  similarityBoost?: number;    // 0–1, default 0.75
  style?: number;              // 0–1, default 0 (v2 only)
  useSpeakerBoost?: boolean;   // default true
}

/**
 * Loads ElevenLabs config from environment variables.
 * API key must be set in ELEVENLABS_API_KEY — never committed to source.
 */
export function getElevenLabsConfig(): ElevenLabsConfig {
  return {
    providerId:     "elevenlabs",
    displayName:    "ElevenLabs",
    apiKey:         process.env["ELEVENLABS_API_KEY"]             ?? "",
    baseUrl:        process.env["ELEVENLABS_BASE_URL"]            ?? "https://api.elevenlabs.io/v1",
    defaultVoiceId: process.env["ELEVENLABS_DEFAULT_VOICE_ID"]    ?? "pNInz6obpgDQGcFmaJgB", // Adam (multilingual)
    defaultModelId: process.env["ELEVENLABS_MODEL_ID"]            ?? "eleven_multilingual_v2",
    timeoutMs:      parseInt(process.env["ELEVENLABS_TIMEOUT_MS"]   ?? "60000", 10),
    maxRetries:     parseInt(process.env["ELEVENLABS_MAX_RETRIES"]  ?? "2",     10),
  };
}

/**
 * Known ElevenLabs model IDs for use in ModelRegistry.
 * Keep in sync with INITIAL_MODEL_REGISTRY in @vox/ai.
 */
export const ELEVENLABS_MODELS = {
  MULTILINGUAL_V2: "eleven_multilingual_v2",
  TURBO_V2_5:      "eleven_turbo_v2_5",
  FLASH_V2_5:      "eleven_flash_v2_5",
} as const;

export type ElevenLabsModelId = (typeof ELEVENLABS_MODELS)[keyof typeof ELEVENLABS_MODELS];
