import { ProviderExecutionError } from "../../index";

export interface OpenAICompatibleConfig {
  providerId: string;
  displayName: string;
  baseUrl: string;
  apiKey?: string | undefined;
  apiKeyEnv?: string | undefined;
  defaultModel: string;
  timeoutMs?: number | undefined;
  maxRetries?: number | undefined;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model?: string | undefined;
  messages: ChatMessage[];
  temperature?: number | undefined;
  top_p?: number | undefined;
  max_tokens?: number | undefined;
  stream?: boolean | undefined;
  response_format?: { type: "json_object" | "text" } | Record<string, any> | undefined;
}

export interface NormalizedProviderResponse {
  success: boolean;
  text: string;
  structuredOutput?: Record<string, any> | undefined;
  model: string;
  provider: string;
  requestId?: string | undefined;
  usage?:
    | {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      }
    | undefined;
  latencyMs: number;
  rawResponse?: any;
  error?: ProviderExecutionError | undefined;
}
