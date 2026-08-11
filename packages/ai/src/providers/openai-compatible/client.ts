import { ProviderExecutionError, classifyError } from "../../index";
import {
  OpenAICompatibleConfig,
  ChatCompletionRequest,
  NormalizedProviderResponse,
} from "./types";

export class OpenAICompatibleClient {
  private providerId: string;
  private displayName: string;
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;
  private timeoutMs: number;

  constructor(config: OpenAICompatibleConfig) {
    this.providerId = config.providerId;
    this.displayName = config.displayName;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.defaultModel = config.defaultModel;
    this.timeoutMs = config.timeoutMs ?? 60000;

    // Resolve API key strictly from explicit parameter or designated env variable
    const envKeyName = config.apiKeyEnv || `${config.providerId.toUpperCase()}_API_KEY`;
    this.apiKey = config.apiKey || (typeof process !== "undefined" ? process.env[envKeyName] || "" : "");
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getSanitizedConfig() {
    return {
      providerId: this.providerId,
      displayName: this.displayName,
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      isConfigured: this.isConfigured(),
      hasApiKey: Boolean(this.apiKey),
    };
  }

  public async chatCompletion(
    request: ChatCompletionRequest,
    customFetch?: typeof globalThis.fetch
  ): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    if (!this.isConfigured()) {
      const err = new ProviderExecutionError(
        "AUTH_ERROR",
        `API key not configured for provider ${this.providerId}. Set environment variable or pass key.`,
        this.providerId,
        model,
        false
      );
      return {
        success: false,
        text: "",
        model,
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        error: err,
      };
    }

    const fetchFn = customFetch || globalThis.fetch;
    if (typeof fetchFn !== "function") {
      const err = new ProviderExecutionError(
        "PROVIDER_NOT_CONFIGURED",
        "globalThis.fetch is not available in current environment.",
        this.providerId,
        model,
        false
      );
      return {
        success: false,
        text: "",
        model,
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        error: err,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const url = `${this.baseUrl}/chat/completions`;
    const payload: Record<string, unknown> = {
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p ?? 0.95,
      max_tokens: request.max_tokens ?? 8192,
      stream: request.stream ?? false,
    };
    if (request.seed !== undefined) payload["seed"] = request.seed;
    if (request.response_format) payload["response_format"] = request.response_format;

    try {
      const response = await fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          errorBody = response.statusText;
        }

        let code: ProviderExecutionError["code"] = "PROVIDER_ERROR";
        let isTransient = false;

        if (response.status === 401 || response.status === 403) {
          code = "AUTH_ERROR";
          isTransient = false;
        } else if (response.status === 429) {
          code = "RATE_LIMIT";
          isTransient = true;
        } else if (response.status === 400 || response.status === 422) {
          code = "INVALID_REQUEST";
          isTransient = false;
        } else if (response.status >= 500) {
          code = "PROVIDER_NOT_CONFIGURED"; // or PROVIDER_ERROR
          isTransient = true;
        }

        // Sanitize any accidental credentials in error message
        const sanitizedMsg = errorBody.replace(new RegExp(this.apiKey, "g"), "[REDACTED_API_KEY]");

        const err = new ProviderExecutionError(
          code,
          `HTTP ${response.status} from ${this.displayName}: ${sanitizedMsg}`,
          this.providerId,
          model,
          isTransient
        );

        return {
          success: false,
          text: "",
          model,
          provider: this.providerId,
          latencyMs,
          error: err,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const isStreamResponse = contentType.includes("text/event-stream") || request.stream === true;

      let text = "";
      let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;
      let requestId = response.headers.get("x-request-id") || undefined;
      let rawJson: any = undefined;

      if (isStreamResponse) {
        const rawText = await response.text();
        const lines = rawText.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const chunkJson = JSON.parse(trimmed.slice(6));
              if (!requestId && chunkJson.id) requestId = chunkJson.id;
              const deltaContent = chunkJson.choices?.[0]?.delta?.content || chunkJson.choices?.[0]?.message?.content || "";
              text += deltaContent;
              if (chunkJson.usage) {
                usage = {
                  promptTokens: chunkJson.usage.prompt_tokens || 0,
                  completionTokens: chunkJson.usage.completion_tokens || 0,
                  totalTokens: chunkJson.usage.total_tokens || 0,
                };
              }
            } catch {
              // ignore invalid line
            }
          }
        }
      } else {
        const json = await response.json();
        rawJson = json;
        requestId = requestId || json.id || undefined;
        text = json.choices?.[0]?.message?.content || "";
        if (json.usage) {
          usage = {
            promptTokens: json.usage.prompt_tokens || 0,
            completionTokens: json.usage.completion_tokens || 0,
            totalTokens: json.usage.total_tokens || 0,
          };
        }
      }

      let structuredOutput: Record<string, any> | undefined;
      if (request.response_format?.type === "json_object" || text.trim().startsWith("{")) {
        try {
          structuredOutput = JSON.parse(text);
        } catch {
          // Soft failure on JSON parse
        }
      }

      return {
        success: true,
        text,
        structuredOutput,
        model,
        provider: this.providerId,
        requestId,
        usage,
        latencyMs,
        rawResponse: rawJson,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      let code: ProviderExecutionError["code"] = "UNKNOWN_ERROR";
      let isTransient = false;

      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        code = "TIMEOUT";
        isTransient = true;
      } else {
        const classified = classifyError(err);
        code = classified.code;
        isTransient = classified.isTransient;
      }

      const execError = new ProviderExecutionError(
        code,
        err.message || String(err),
        this.providerId,
        model,
        isTransient
      );

      return {
        success: false,
        text: "",
        model,
        provider: this.providerId,
        latencyMs,
        error: execError,
      };
    }
  }

  public async imageGeneration(
    request: {
      model?: string | undefined;
      prompt: string;
      width?: number | undefined;
      height?: number | undefined;
    },
    customFetch?: typeof globalThis.fetch
  ): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    if (!this.isConfigured()) {
      const err = new ProviderExecutionError(
        "AUTH_ERROR",
        `API key not configured for provider ${this.providerId}. Set environment variable or pass key.`,
        this.providerId,
        model,
        false
      );
      return {
        success: false,
        text: "",
        model,
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        error: err,
      };
    }

    const fetchFn = customFetch || globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const size = `${request.width || 1024}x${request.height || 1024}`;
    const payload = {
      model,
      prompt: request.prompt,
      n: 1,
      size,
      response_format: "url",
    };

    const url = `${this.baseUrl}/images/generations`;

    try {
      let response = await fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.status === 404) {
        const altUrl = `${this.baseUrl}/images/edits`;
        const altResponse = await fetchFn(altUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (altResponse.ok || altResponse.status !== 404) {
          response = altResponse;
        }
      }

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          errorBody = response.statusText;
        }

        let code: ProviderExecutionError["code"] = "PROVIDER_ERROR";
        let isTransient = false;
        if (response.status === 401 || response.status === 403) {
          code = "AUTH_ERROR";
        } else if (response.status === 429) {
          code = "RATE_LIMIT";
          isTransient = true;
        } else if (response.status === 400 || response.status === 422) {
          code = "INVALID_REQUEST";
        } else if (response.status >= 500) {
          code = "PROVIDER_NOT_CONFIGURED";
          isTransient = true;
        }

        const sanitizedMsg = errorBody.replace(new RegExp(this.apiKey, "g"), "[REDACTED_API_KEY]");
        return {
          success: false,
          text: "",
          model,
          provider: this.providerId,
          latencyMs,
          error: new ProviderExecutionError(
            code,
            `HTTP ${response.status} from ${this.displayName}: ${sanitizedMsg}`,
            this.providerId,
            model,
            isTransient
          ),
        };
      }

      const json = await response.json();
      const imageUrl = json.data?.[0]?.url || json.data?.[0]?.b64_json || json.url || "";
      const requestId = response.headers.get("x-request-id") || json.id || undefined;

      return {
        success: true,
        text: imageUrl,
        model,
        provider: this.providerId,
        requestId,
        latencyMs,
        rawResponse: json,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      return {
        success: false,
        text: "",
        model,
        provider: this.providerId,
        latencyMs: Date.now() - startTime,
        error: new ProviderExecutionError(
          "UNKNOWN_ERROR",
          err.message || String(err),
          this.providerId,
          model,
          false
        ),
      };
    }
  }
}
