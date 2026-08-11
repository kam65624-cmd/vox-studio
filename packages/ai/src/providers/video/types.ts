/**
 * Video Provider Type Definitions (P0-N Track N2)
 */

export interface VideoGenerationOptions {
  prompt: string;
  imagePromptUrl?: string;
  durationSeconds?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:5";
  model?: string;
  fps?: number;
}

export interface VideoProviderTaskResponse {
  taskId: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  videoUrl?: string;
  error?: string;
  costUsd: number;
}

export interface VideoProviderResponse {
  success: boolean;
  videoUrl?: string;
  mediaKey: string;
  durationSeconds: number;
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
