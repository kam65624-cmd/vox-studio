/**
 * Visual Provider Type Definitions (P0-N Track N1)
 */

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  model?: string;
  responseFormat?: "url" | "b64_json";
  seed?: number;
}

export interface ImageEditOptions {
  prompt: string;
  /** Base64 or Buffer of the reference/source image */
  image: string | Buffer;
  mask?: string | Buffer;
  width?: number;
  height?: number;
  model?: string;
  responseFormat?: "url" | "b64_json";
}

export interface VisualProviderResponse {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  mediaKey: string;
  model: string;
  latencyMs: number;
  costUsd: number;
  error?: {
    code: string;
    message: string;
    isTransient: boolean;
    httpStatus?: number;
  };
}
