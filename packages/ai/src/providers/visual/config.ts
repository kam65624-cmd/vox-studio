/**
 * Visual Provider Config (P0-N Track N1)
 *
 * Configures image generation & editing provider credentials and parameters.
 * Reads environment variables only — zero hardcoded API keys.
 */

export interface OpenAIVisualConfig {
  readonly providerId: "openai-visual";
  readonly displayName: "OpenAI Visual API";
  apiKey: string;
  baseUrl: string;
  defaultImageModel: string;
  defaultEditModel: string;
  timeoutMs: number;
  maxRetries: number;
}

export function getOpenAIVisualConfig(): OpenAIVisualConfig {
  return {
    providerId: "openai-visual",
    displayName: "OpenAI Visual API",
    apiKey: process.env["OPENAI_API_KEY"] ?? "",
    baseUrl: process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1",
    defaultImageModel: process.env["OPENAI_IMAGE_MODEL"] ?? "dall-e-3",
    defaultEditModel: process.env["OPENAI_EDIT_MODEL"] ?? "dall-e-2",
    timeoutMs: parseInt(process.env["OPENAI_TIMEOUT_MS"] ?? "60000", 10),
    maxRetries: parseInt(process.env["OPENAI_MAX_RETRIES"] ?? "2", 10),
  };
}
