import {
  UnifiedProviderAdapter,
  TextGenerationRequest,
  TextGenerationResponse,
} from "../../index";
import { OpenAICompatibleClient } from "./client";
import { OpenAICompatibleConfig } from "./types";

export class OpenAICompatibleAdapter implements UnifiedProviderAdapter {
  public providerId: string;
  public displayName: string;
  protected client: OpenAICompatibleClient;

  constructor(config: OpenAICompatibleConfig) {
    this.providerId = config.providerId;
    this.displayName = config.displayName;
    this.client = new OpenAICompatibleClient(config);
  }

  public isConfigured(): boolean {
    return this.client.isConfigured();
  }

  public getClient(): OpenAICompatibleClient {
    return this.client;
  }

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const res = await this.client.chatCompletion({
      messages: [
        ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
        { role: "user" as const, content: request.prompt },
      ],
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    });

    if (!res.success) {
      throw res.error || new Error(`Text generation failed for provider ${this.providerId}`);
    }

    return {
      text: res.text,
      model: res.model,
      tokensUsed: res.usage?.totalTokens || 0,
      costUsd: 0.0001 * (res.usage?.totalTokens || 100),
    };
  }

  async generateStructuredOutput(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const res = await this.client.chatCompletion({
      messages: [
        ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
        { role: "user" as const, content: request.prompt },
      ],
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.2,
      response_format: { type: "json_object" },
    });

    if (!res.success) {
      throw res.error || new Error(`Structured output generation failed for provider ${this.providerId}`);
    }

    return {
      text: res.text,
      model: res.model,
      tokensUsed: res.usage?.totalTokens || 0,
      costUsd: 0.0001 * (res.usage?.totalTokens || 100),
    };
  }
}
