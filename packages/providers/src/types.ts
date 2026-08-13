import type { Capability, RuntimeMode } from "@vox/contracts";

export type ProviderKind = "TEXT" | "REASONING" | "VOICE" | "IMAGE" | "VIDEO";

export interface TextRequest {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  seed?: number;
  outputLanguage?: string;
}

export interface TextResponse {
  text: string;
  requestId: string;
  model: string;
  usage?: Record<string, unknown>;
}

export interface VoiceRequest {
  text: string;
  language: string;
  voiceName?: string;
  outputFormat?: string;
}

export interface MediaRequest {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  language?: string;
  sceneType?: string;
  outputFormat?: string;
}

export interface MediaResponse {
  binary: Buffer;
  mimeType: string;
  requestId: string;
  model: string;
  sizeBytes: number;
  sourceUrl?: string;
}

export interface Provider {
  readonly name: string;
  readonly capability: Capability;
  readonly model: string;
  /** True when this provider is usable in "real" mode with current configuration. */
  isConfigured(): boolean;
  /** Human-readable reason when not configured. */
  configurationError(): string | undefined;
  readonly isMock: boolean;
}

export interface TextProvider extends Provider {
  capability: "TEXT";
  generate(req: TextRequest): Promise<TextResponse>;
}

export interface VoiceProvider extends Provider {
  capability: "VOICE";
  synthesize(req: VoiceRequest): Promise<MediaResponse>;
}

export interface ImageProvider extends Provider {
  capability: "IMAGE";
  generate(req: MediaRequest): Promise<MediaResponse>;
}

export interface VideoProvider extends Provider {
  capability: "VIDEO";
  generate(req: MediaRequest): Promise<MediaResponse>;
}

export interface ProviderRegistry {
  text(): TextProvider[];
  voice(): VoiceProvider[];
  image(): ImageProvider[];
  video(): VideoProvider[];
}

export interface RouterSelection {
  provider: Provider;
  blockedReason?: string;
}

export interface RuntimeContext {
  mode: RuntimeMode;
}
