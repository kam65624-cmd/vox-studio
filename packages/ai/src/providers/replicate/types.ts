/**
 * Replicate Provider Type Definitions (P0-N Track N.1)
 */

export interface ReplicatePredictionRequest {
  model: string;
  version?: string;
  input: Record<string, any>;
}

export interface ReplicatePredictionResponse {
  id: string;
  model: string;
  version?: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled" | "aborted";
  output?: any;
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
  created_at?: string;
  completed_at?: string;
}

export interface ReplicateProviderExecutionResponse {
  success: boolean;
  predictionId: string;
  model: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaKey: string;
  latencyMs: number;
  costUsd: number;
  error?: {
    code: string;
    message: string;
    isTransient: boolean;
    httpStatus?: number;
  };
}
