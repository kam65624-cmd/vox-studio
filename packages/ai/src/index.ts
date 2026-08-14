import {
  ModelCapability,
  ModelDefinition,
  RouterSelectionRequest,
  RouterSelectionResponse,
  GenerationProvenance,
} from "@vox/contracts";

// ─── Legacy Provider Interfaces (Preserved for Backward Compatibility) ─────

export interface TextGenerationRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TextGenerationResponse {
  text: string;
  model: string;
  tokensUsed: number;
  costUsd: number;
}

export interface TextModelProvider {
  name: string;
  generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>;
}

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  mediaKey: string;
  costUsd: number;
}

export interface ImageModelProvider {
  name: string;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}

export interface VideoGenerationRequest {
  prompt: string;
  styleKeyUrl?: string;
  durationSeconds: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
}

export interface VideoGenerationResponse {
  videoUrl: string;
  mediaKey: string;
  durationSeconds: number;
  costUsd: number;
}

export interface VideoModelProvider {
  name: string;
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
}

export interface VoiceGenerationRequest {
  text: string;
  voiceId: string;
  language: "ar" | "en";
  speechRate?: number;
}

export interface VoiceGenerationResponse {
  audioUrl: string;
  mediaKey: string;
  durationSeconds: number;
  costUsd: number;
}

export interface VoiceModelProvider {
  name: string;
  generateVoice(request: VoiceGenerationRequest): Promise<VoiceGenerationResponse>;
}

// ─── Legacy Mock Implementations ──────────────────────────────────────────────

export class MockTextModelProvider implements TextModelProvider {
  name = "mock-text-provider";
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    return {
      text: `[Mock Response to: ${request.prompt.slice(0, 30)}...]`,
      model: "mock-llm-v1",
      tokensUsed: 150,
      costUsd: 0.0003,
    };
  }
}

export class MockImageModelProvider implements ImageModelProvider {
  name = "mock-image-provider";
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    return {
      imageUrl: "http://localhost:9000/vox-studio/mock-image.png",
      mediaKey: "mock-image-key-001",
      costUsd: 0.02,
    };
  }
}

export class MockVideoModelProvider implements VideoModelProvider {
  name = "mock-video-provider";
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return {
      videoUrl: "http://localhost:9000/vox-studio/mock-video.mp4",
      mediaKey: "mock-video-key-001",
      durationSeconds: request.durationSeconds,
      costUsd: 0.3,
    };
  }
}

export class MockVoiceModelProvider implements VoiceModelProvider {
  name = "mock-voice-provider";
  async generateVoice(request: VoiceGenerationRequest): Promise<VoiceGenerationResponse> {
    return {
      audioUrl: "http://localhost:9000/vox-studio/mock-audio.mp3",
      mediaKey: "mock-audio-key-001",
      durationSeconds: Math.ceil(request.text.length / 15),
      costUsd: 0.015,
    };
  }
}

// ─── P0-I Provider-Agnostic Model Registry & Adapters ───────────────────────

export interface UnifiedProviderAdapter {
  providerId: string;
  displayName: string;
  generateText?(request: TextGenerationRequest): Promise<TextGenerationResponse>;
  generateStructuredOutput?(request: TextGenerationRequest): Promise<TextGenerationResponse>;
  generateImage?(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  editImage?(request: ImageGenerationRequest & { referenceImageKey: string }): Promise<ImageGenerationResponse>;
  generateVideo?(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
  generateVoice?(request: VoiceGenerationRequest): Promise<VoiceGenerationResponse>;
}

export class UnifiedMockAdapter implements UnifiedProviderAdapter {
  providerId = "vox-mock-provider";
  displayName = "VOX Mock Provider Adapter";

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    return {
      text: `[Unified Mock Text: ${request.prompt.slice(0, 40)}]`,
      model: "vox-mock-model",
      tokensUsed: 100,
      costUsd: 0.0001,
    };
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    return {
      imageUrl: "http://localhost:9000/vox-studio/unified-mock-image.png",
      mediaKey: "unified-mock-img-key",
      costUsd: 0.01,
    };
  }

  async editImage(request: ImageGenerationRequest & { referenceImageKey: string }): Promise<ImageGenerationResponse> {
    return {
      imageUrl: "http://localhost:9000/vox-studio/unified-mock-image-edited.png",
      mediaKey: `edited-${request.referenceImageKey}`,
      costUsd: 0.015,
    };
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return {
      videoUrl: "http://localhost:9000/vox-studio/unified-mock-video.mp4",
      mediaKey: "unified-mock-video-key",
      durationSeconds: request.durationSeconds,
      costUsd: 0.25,
    };
  }

  async generateVoice(request: VoiceGenerationRequest): Promise<VoiceGenerationResponse> {
    return {
      audioUrl: "http://localhost:9000/vox-studio/unified-mock-audio.mp3",
      mediaKey: "unified-mock-audio-key",
      durationSeconds: 5,
      costUsd: 0.005,
    };
  }
}

export const INITIAL_MODEL_REGISTRY: ModelDefinition[] = [
  {
    modelId: "meta/muse-glimmer-30b",
    providerId: "nvidia",
    displayName: "Meta Muse Glimmer 30B (NVIDIA NIM)",
    version: "3.0.0",
    capabilities: ["TEXT_GENERATION", "REASONING", "STRUCTURED_OUTPUT"],
    modalities: { inputs: ["text"], outputs: ["text"] },
    languages: ["ar", "en"],
    maxInput: 128000,
    maxOutput: 8192,
    qualityTier: "HIGH",
    speedTier: "BALANCED",
    costTier: "LOW",
    supportsStreaming: true,
    supportsBatch: true,
    supportsStructuredOutput: true,
    supportsImageReference: false,
    supportsImageEditing: false,
    supportsVideo: false,
    supportsAudio: false,
    availability: "ONLINE",
  },
  {
    // Served via NVIDIA NIM — https://integrate.api.nvidia.com/v1
    // stream=true, seed=42, temperature=1, top_p=1, max_tokens=16384
    modelId: "z-ai/glm-5.2",
    providerId: "nvidia",
    displayName: "Z.AI GLM-5.2 (NVIDIA NIM)",
    version: "5.2.0",
    capabilities: ["TEXT_GENERATION", "REASONING", "STRUCTURED_OUTPUT", "VISION"],
    modalities: { inputs: ["text", "image"], outputs: ["text"] },
    languages: ["ar", "en", "zh"],
    maxInput: 200000,
    maxOutput: 16384,
    qualityTier: "PREMIUM",
    speedTier: "BALANCED",
    costTier: "MEDIUM",
    supportsStreaming: true,
    supportsBatch: false,
    supportsStructuredOutput: true,
    supportsImageReference: true,
    supportsImageEditing: false,
    supportsVideo: false,
    supportsAudio: false,
    availability: "ONLINE",
  },
  {
    // qwen/qwen-image-edit runs via self-hosted NVIDIA NIM container only.
    // It is NOT available as a hosted API on integrate.api.nvidia.com.
    // Endpoint: POST /v1/images/edits on your own NIM container.
    // Do NOT route hosted jobs to this model — use availability: "SELF_HOSTED".
    modelId: "qwen/qwen-image-edit",
    providerId: "nvidia",
    displayName: "Qwen Image Edit (NVIDIA NIM — Self-Hosted)",
    version: "2.5.0",
    capabilities: ["IMAGE_EDITING", "IMAGE_GENERATION"],
    modalities: { inputs: ["text", "image"], outputs: ["image"] },
    languages: ["ar", "en"],
    maxInput: 4096,
    maxOutput: 1,
    qualityTier: "HIGH",
    speedTier: "FAST",
    costTier: "LOW",
    supportsStreaming: false,
    supportsBatch: true,
    supportsStructuredOutput: false,
    supportsImageReference: true,
    supportsImageEditing: true,
    supportsVideo: false,
    supportsAudio: false,
    availability: "SELF_HOSTED",
  },
  {
    modelId: "openai/gpt-4o",
    providerId: "openai",
    displayName: "OpenAI GPT-4o",
    version: "2024-08-06",
    capabilities: ["TEXT_GENERATION", "REASONING", "STRUCTURED_OUTPUT", "VISION"],
    modalities: { inputs: ["text", "image"], outputs: ["text"] },
    languages: ["ar", "en"],
    maxInput: 128000,
    maxOutput: 16384,
    qualityTier: "PREMIUM",
    speedTier: "FAST",
    costTier: "HIGH",
    supportsStreaming: true,
    supportsBatch: true,
    supportsStructuredOutput: true,
    supportsImageReference: true,
    supportsImageEditing: false,
    supportsVideo: false,
    supportsAudio: false,
    availability: "ONLINE",
  },
  {
    modelId: "elevenlabs/multilingual-v2",
    providerId: "elevenlabs",
    displayName: "ElevenLabs Multilingual v2",
    version: "2.0.0",
    capabilities: ["VOICE_GENERATION"],
    modalities: { inputs: ["text"], outputs: ["audio"] },
    languages: ["ar", "en"],
    maxInput: 10000,
    maxOutput: 600,
    qualityTier: "PREMIUM",
    speedTier: "FAST",
    costTier: "MEDIUM",
    supportsStreaming: true,
    supportsBatch: false,
    supportsStructuredOutput: false,
    supportsImageReference: false,
    supportsImageEditing: false,
    supportsVideo: false,
    supportsAudio: true,
    availability: "ONLINE",
  },
  {
    modelId: "runway/gen-3-alpha",
    providerId: "runway",
    displayName: "Runway Gen-3 Alpha",
    version: "3.0.0",
    capabilities: ["VIDEO_GENERATION"],
    modalities: { inputs: ["text", "image"], outputs: ["video"] },
    languages: ["en"],
    maxInput: 1000,
    maxOutput: 10,
    qualityTier: "PREMIUM",
    speedTier: "SLOW",
    costTier: "HIGH",
    supportsStreaming: false,
    supportsBatch: false,
    supportsStructuredOutput: false,
    supportsImageReference: true,
    supportsImageEditing: false,
    supportsVideo: true,
    supportsAudio: false,
    availability: "ONLINE",
  },
  {
    modelId: "vox/mock-model",
    providerId: "vox-mock",
    displayName: "VOX Internal Mock Model",
    version: "1.0.0",
    capabilities: [
      "TEXT_GENERATION",
      "REASONING",
      "STRUCTURED_OUTPUT",
      "VISION",
      "IMAGE_GENERATION",
      "IMAGE_EDITING",
      "VIDEO_GENERATION",
      "VOICE_GENERATION",
      "VOICE_TRANSCRIPTION",
      "AUDIO_GENERATION",
      "EMBEDDINGS",
    ],
    modalities: { inputs: ["text", "image", "audio", "video"], outputs: ["text", "image", "audio", "video"] },
    languages: ["ar", "en"],
    maxInput: 1000000,
    maxOutput: 1000000,
    qualityTier: "STANDARD",
    speedTier: "FAST",
    costTier: "FREE",
    supportsStreaming: true,
    supportsBatch: true,
    supportsStructuredOutput: true,
    supportsImageReference: true,
    supportsImageEditing: true,
    supportsVideo: true,
    supportsAudio: true,
    availability: "ONLINE",
  },

  // ─── ElevenLabs Voice Models (M5) ────────────────────────────────────────
  {
    modelId:     "eleven_multilingual_v2",
    providerId:  "elevenlabs",
    displayName: "ElevenLabs Multilingual v2",
    version:     "2.0.0",
    capabilities: ["VOICE_GENERATION"],
    modalities: { inputs: ["text"], outputs: ["audio"] },
    languages:   ["ar", "en"],
    maxInput:    5000,
    maxOutput:   1,
    qualityTier: "HIGH",
    speedTier:   "BALANCED",
    costTier:    "MEDIUM",
    supportsStreaming:        true,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  false,
    supportsImageEditing:    false,
    supportsVideo:           false,
    supportsAudio:           true,
    availability: "ONLINE",
  },
  {
    modelId:     "eleven_turbo_v2_5",
    providerId:  "elevenlabs",
    displayName: "ElevenLabs Turbo v2.5",
    version:     "2.5.0",
    capabilities: ["VOICE_GENERATION"],
    modalities: { inputs: ["text"], outputs: ["audio"] },
    languages:   ["ar", "en"],
    maxInput:    5000,
    maxOutput:   1,
    qualityTier: "STANDARD",
    speedTier:   "FAST",
    costTier:    "LOW",
    supportsStreaming:        true,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  false,
    supportsImageEditing:    false,
    supportsVideo:           false,
    supportsAudio:           true,
    availability: "ONLINE",
  },
  {
    modelId:     "eleven_flash_v2_5",
    providerId:  "elevenlabs",
    displayName: "ElevenLabs Flash v2.5",
    version:     "2.5.0",
    capabilities: ["VOICE_GENERATION"],
    modalities: { inputs: ["text"], outputs: ["audio"] },
    languages:   ["ar", "en"],
    maxInput:    5000,
    maxOutput:   1,
    qualityTier: "STANDARD",
    speedTier:   "FAST",
    costTier:    "LOW",
    supportsStreaming:        true,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  false,
    supportsImageEditing:    false,
    supportsVideo:           false,
    supportsAudio:           true,
    availability: "ONLINE",
  },

  // ─── Visual & Video Online Models (N3) ───────────────────────────────────
  {
    modelId:     "dall-e-3",
    providerId:  "openai-visual",
    displayName: "OpenAI DALL-E 3 (Image Gen)",
    version:     "3.0.0",
    capabilities: ["IMAGE_GENERATION"],
    modalities: { inputs: ["text"], outputs: ["image"] },
    languages:   ["ar", "en"],
    maxInput:    4000,
    maxOutput:   1,
    qualityTier: "PREMIUM",
    speedTier:   "BALANCED",
    costTier:    "MEDIUM",
    supportsStreaming:        false,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  false,
    supportsImageEditing:    false,
    supportsVideo:           false,
    supportsAudio:           false,
    availability: "ONLINE",
  },
  {
    modelId:     "dall-e-2",
    providerId:  "openai-visual",
    displayName: "OpenAI DALL-E 2 (Image Edit)",
    version:     "2.0.0",
    capabilities: ["IMAGE_EDITING"],
    modalities: { inputs: ["text", "image"], outputs: ["image"] },
    languages:   ["ar", "en"],
    maxInput:    1000,
    maxOutput:   1,
    qualityTier: "HIGH",
    speedTier:   "FAST",
    costTier:    "LOW",
    supportsStreaming:        false,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  true,
    supportsImageEditing:    true,
    supportsVideo:           false,
    supportsAudio:           false,
    availability: "ONLINE",
  },
  {
    modelId:     "runway/gen-3-alpha",
    providerId:  "runway-video",
    displayName: "Runway Gen-3 Alpha (Video Gen)",
    version:     "3.0.0",
    capabilities: ["VIDEO_GENERATION"],
    modalities: { inputs: ["text", "image"], outputs: ["video"] },
    languages:   ["ar", "en"],
    maxInput:    1000,
    maxOutput:   1,
    qualityTier: "PREMIUM",
    speedTier:   "BALANCED",
    costTier:    "HIGH",
    supportsStreaming:        false,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  true,
    supportsImageEditing:    false,
    supportsVideo:           true,
    supportsAudio:           false,
    availability: "ONLINE",
  },
  {
    modelId:     "black-forest-labs/flux-1.1-pro",
    providerId:  "replicate",
    displayName: "FLUX 1.1 Pro (Image Gen via Replicate)",
    version:     "1.1.0",
    capabilities: ["IMAGE_GENERATION"],
    modalities: { inputs: ["text"], outputs: ["image"] },
    languages:   ["ar", "en"],
    maxInput:    4000,
    maxOutput:   1,
    qualityTier: "PREMIUM",
    speedTier:   "FAST",
    costTier:    "MEDIUM",
    supportsStreaming:        false,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  false,
    supportsImageEditing:    false,
    supportsVideo:           false,
    supportsAudio:           false,
    availability: "ONLINE",
  },
  {
    modelId:     "black-forest-labs/flux-fill-pro",
    providerId:  "replicate",
    displayName: "FLUX Fill Pro (Image Edit via Replicate)",
    version:     "1.0.0",
    capabilities: ["IMAGE_EDITING"],
    modalities: { inputs: ["text", "image"], outputs: ["image"] },
    languages:   ["ar", "en"],
    maxInput:    2000,
    maxOutput:   1,
    qualityTier: "HIGH",
    speedTier:   "BALANCED",
    costTier:    "MEDIUM",
    supportsStreaming:        false,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  true,
    supportsImageEditing:    true,
    supportsVideo:           false,
    supportsAudio:           false,
    availability: "ONLINE",
  },
  {
    modelId:     "minimax/video-01",
    providerId:  "replicate",
    displayName: "MiniMax Video-01 (Video Gen via Replicate)",
    version:     "1.0.0",
    capabilities: ["VIDEO_GENERATION"],
    modalities: { inputs: ["text", "image"], outputs: ["video"] },
    languages:   ["ar", "en"],
    maxInput:    2000,
    maxOutput:   1,
    qualityTier: "PREMIUM",
    speedTier:   "BALANCED",
    costTier:    "HIGH",
    supportsStreaming:        false,
    supportsBatch:           false,
    supportsStructuredOutput: false,
    supportsImageReference:  true,
    supportsImageEditing:    false,
    supportsVideo:           true,
    supportsAudio:           false,
    availability: "ONLINE",
  },
];

// ─── Model Registry Store ─────────────────────────────────────────────────────

export class ModelRegistry {
  private models = new Map<string, ModelDefinition>();

  constructor(initialModels: ModelDefinition[] = INITIAL_MODEL_REGISTRY) {
    initialModels.forEach((m) => this.registerModel(m));
  }

  registerModel(def: ModelDefinition): void {
    this.models.set(def.modelId, def);
  }

  getModel(modelId: string): ModelDefinition | undefined {
    return this.models.get(modelId);
  }

  listModels(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

  getModelsByCapability(capability: ModelCapability): ModelDefinition[] {
    return this.listModels().filter((m) => m.capabilities.includes(capability));
  }

  getProviders(): Array<{ providerId: string; name: string; count: number }> {
    const map = new Map<string, number>();
    this.listModels().forEach((m) => {
      map.set(m.providerId, (map.get(m.providerId) || 0) + 1);
    });
    return Array.from(map.entries()).map(([providerId, count]) => ({
      providerId,
      name: providerId.toUpperCase(),
      count,
    }));
  }
}

// ─── Capability-Aware Model Router ──────────────────────────────────────────

const QUALITY_RANK: Record<string, number> = {
  LOW: 1,
  STANDARD: 2,
  HIGH: 3,
  PREMIUM: 4,
};

export class ModelRouter {
  constructor(private registry: ModelRegistry) {}

  selectModel(request: RouterSelectionRequest): RouterSelectionResponse {
    const candidates = this.registry.getModelsByCapability(request.capability);

    if (candidates.length === 0) {
      throw new Error(`No models registered supporting capability: ${request.capability}`);
    }

    // Filter by language compatibility if specified
    const langFiltered = request.language
      ? candidates.filter((m) => m.languages.includes(request.language!) || m.languages.includes("*"))
      : candidates;

    if (langFiltered.length === 0) {
      throw new Error(`No models support capability ${request.capability} with language ${request.language}`);
    }

    // Quality check (prevent silent quality downgrade)
    const requiredQualityRank = request.qualityRequirement
      ? QUALITY_RANK[request.qualityRequirement] || 1
      : 1;

    const qualityFiltered = langFiltered.filter(
      (m) => (QUALITY_RANK[m.qualityTier] || 1) >= requiredQualityRank
    );

    if (qualityFiltered.length === 0) {
      throw new Error(
        `Cannot fulfill quality requirement ${request.qualityRequirement} for capability ${request.capability} without silent downgrade`
      );
    }

    // Deterministically score candidates
    const scored = qualityFiltered.map((m) => {
      let score = 100;
      if (request.qualityRequirement && m.qualityTier === request.qualityRequirement) score += 20;
      if (request.latencyRequirement && m.speedTier === request.latencyRequirement) score += 15;
      if (request.costPreference && m.costTier === request.costPreference) score += 10;
      if (m.availability === "ONLINE") score += 5;
      return { model: m, score };
    });

    scored.sort((a, b) => b.score - a.score || a.model.modelId.localeCompare(b.model.modelId));

    const selected = scored[0]!.model;
    const fallbackCandidates = scored.slice(1).map((s) => s.model.modelId);
    const fallbackChain = [...fallbackCandidates, "PRIMARY -> FALLBACK 1 -> ESCALATE"];

    return {
      selectedModel: selected,
      providerId: selected.providerId,
      reason: `Deterministically selected ${selected.displayName} for task "${request.task}" (${request.capability})`,
      fallbackChain,
    };
  }
}

// ─── Provenance Contract Helper ──────────────────────────────────────────────

export function createGenerationProvenance(input: {
  providerId: string;
  modelId: string;
  modelVersion: string;
  generationRequestId: string;
  creativeDnaVersion?: number;
  styleSkillVersion?: string;
  episodeId?: string;
  sceneId?: string;
  shotId?: string;
  productionNodeId?: string;
}): GenerationProvenance {
  return {
    id: `prov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    createdAt: new Date().toISOString(),
  };
}

// ─── P0-K Provider Error Classification & Smart Retry Engine ────────────────

export type ProviderErrorCode =
  | "PROVIDER_NOT_CONFIGURED"
  | "AUTH_ERROR"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_REQUEST"
  | "UNSUPPORTED_CAPABILITY"
  | "INVALID_ARTIFACT"
  | "PROVIDER_ERROR"
  | "UNKNOWN_ERROR";

export class ProviderExecutionError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly providerId?: string,
    public readonly modelId?: string,
    public readonly isTransient: boolean = false
  ) {
    super(`[${code}] ${message}`);
    this.name = "ProviderExecutionError";
  }
}

export function classifyError(err: unknown): { code: ProviderErrorCode; isTransient: boolean } {
  if (err instanceof ProviderExecutionError) {
    return { code: err.code, isTransient: err.isTransient };
  }
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes("rate limit") || msg.includes("429") || msg.includes("too many requests")) {
    return { code: "RATE_LIMIT", isTransient: true };
  }
  if (msg.includes("timeout") || msg.includes("etimedout")) {
    return { code: "TIMEOUT", isTransient: true };
  }
  if (msg.includes("network") || msg.includes("econnreset") || msg.includes("fetch failed")) {
    return { code: "NETWORK_ERROR", isTransient: true };
  }
  if (msg.includes("unauthorized") || msg.includes("api key") || msg.includes("401") || msg.includes("403")) {
    return { code: "AUTH_ERROR", isTransient: false };
  }
  if (msg.includes("invalid request") || msg.includes("bad request") || msg.includes("400")) {
    return { code: "INVALID_REQUEST", isTransient: false };
  }
  if (msg.includes("not configured") || msg.includes("missing key")) {
    return { code: "PROVIDER_NOT_CONFIGURED", isTransient: false };
  }
  if (msg.includes("unsupported capability") || msg.includes("capability not supported")) {
    return { code: "UNSUPPORTED_CAPABILITY", isTransient: false };
  }
  if (msg.includes("invalid artifact") || msg.includes("corrupt")) {
    return { code: "INVALID_ARTIFACT", isTransient: false };
  }
  return { code: "PROVIDER_ERROR", isTransient: false };
}

export interface ProviderExecutionResult<T = any> {
  success: boolean;
  result?: T;
  provenance?: GenerationProvenance;
  error?: ProviderExecutionError;
  attempts: number;
  selectedModelId: string;
  selectedProviderId: string;
}

// ─── Provider Module Exports ──────────────────────────────────────────────

export * from "./providers/openai-compatible/types";
export * from "./providers/openai-compatible/client";
export * from "./providers/openai-compatible/adapter";
export * from "./providers/nvidia/config";
export * from "./providers/nvidia/adapter";

import { NVIDIAAdapter } from "./providers/nvidia/adapter";
import { ElevenLabsAdapter } from "./providers/elevenlabs/adapter";
import { OpenAIVisualAdapter } from "./providers/visual/adapter";
import { RealVideoAdapter } from "./providers/video/adapter";
import { ReplicateAdapter } from "./providers/replicate/adapter";

export type VoxRuntimeMode = "mock" | "real" | "auto";

export class ProviderExecutionEngine {
  private adapters = new Map<string, UnifiedProviderAdapter>();

  constructor(
    private registry: ModelRegistry = new ModelRegistry(),
    private router: ModelRouter = new ModelRouter(registry)
  ) {
    // Register default unified mock adapter
    const mockAdapter = new UnifiedMockAdapter();
    this.adapters.set(mockAdapter.providerId, mockAdapter);
    this.adapters.set("vox-mock", mockAdapter);
    this.adapters.set("openai", mockAdapter);
    this.adapters.set("anthropic", mockAdapter);
    this.adapters.set("elevenlabs", mockAdapter);
    this.adapters.set("runway", mockAdapter);

    // Register real adapters
    const nvidiaAdapter = new NVIDIAAdapter();
    this.adapters.set(nvidiaAdapter.providerId, nvidiaAdapter);

    const elevenLabsAdapter = new ElevenLabsAdapter();
    this.adapters.set(elevenLabsAdapter.providerId, elevenLabsAdapter);

    const openAiVisualAdapter = new OpenAIVisualAdapter();
    this.adapters.set(openAiVisualAdapter.providerId, openAiVisualAdapter);

    const realVideoAdapter = new RealVideoAdapter();
    this.adapters.set(realVideoAdapter.providerId, realVideoAdapter);

    const replicateAdapter = new ReplicateAdapter();
    this.adapters.set(replicateAdapter.providerId, replicateAdapter);
  }

  registerAdapter(adapter: UnifiedProviderAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  public getRuntimeMode(): VoxRuntimeMode {
    const raw = typeof process !== "undefined" ? process.env["VOX_RUNTIME_MODE"] : undefined;
    const envMode = typeof raw === "string" ? raw.toLowerCase() : undefined;
    if (envMode === "real") return "real";
    if (envMode === "mock") return "mock";
    return "auto";
  }

  public getProvidersStatus(): Array<{
    providerId: string;
    displayName: string;
    status: "AVAILABLE" | "NOT_CONFIGURED" | "AUTH_FAILED" | "UNAVAILABLE";
    runtimeMode: VoxRuntimeMode;
    defaultModel?: string;
  }> {
    const mode = this.getRuntimeMode();
    const result: Array<{
      providerId: string;
      displayName: string;
      status: "AVAILABLE" | "NOT_CONFIGURED" | "AUTH_FAILED" | "UNAVAILABLE";
      runtimeMode: VoxRuntimeMode;
      defaultModel?: string;
    }> = [];

    const providers = this.registry.getProviders();
    for (const p of providers) {
      const adapter = this.adapters.get(p.providerId);
      const isConfigured = (adapter as any)?.isConfigured ? (adapter as any).isConfigured() : true;
      let status: "AVAILABLE" | "NOT_CONFIGURED" | "AUTH_FAILED" | "UNAVAILABLE" = "AVAILABLE";

      if (mode === "mock") {
        status = "AVAILABLE";
      } else if (!isConfigured) {
        status = "NOT_CONFIGURED";
      }

      result.push({
        providerId: p.providerId,
        displayName: adapter?.displayName || p.name,
        status,
        runtimeMode: mode,
      });
    }

    return result;
  }

  async executeJob(job: {
    capability: any;
    prompt: string;
    episodeId?: string;
    sceneId?: string;
    shotId?: string;
    productionNodeId?: string;
    creativeDnaVersion?: number;
    styleSkillVersion?: string;
    maxRetries?: number;
  }): Promise<ProviderExecutionResult> {
    const route = this.router.selectModel({
      capability: job.capability,
      task: `Execute job for capability ${job.capability}`,
      qualityRequirement: "HIGH",
    });

    let currentModel = route.selectedModel;
    let currentProviderId = route.providerId;
    const maxRetries = job.maxRetries ?? 3;
    let attempts = 0;
    let lastError: ProviderExecutionError | undefined;

    const mode = this.getRuntimeMode();

    while (attempts < maxRetries) {
      attempts++;
      let adapter = this.adapters.get(currentProviderId);
      const isConfigured = (adapter as any)?.isConfigured ? (adapter as any).isConfigured() : true;

      if (mode === "mock") {
        adapter = this.adapters.get("vox-mock-provider")!;
        currentProviderId = adapter.providerId;
      } else if (mode === "real") {
        if (!adapter || !isConfigured) {
          lastError = new ProviderExecutionError(
            "AUTH_ERROR",
            `Real runtime mode requested (VOX_RUNTIME_MODE=real) but provider "${currentProviderId}" is not configured or missing API key.`,
            currentProviderId,
            currentModel.modelId,
            false
          );
          break;
        }
      } else {
        // mode === "auto"
        if (!adapter || !isConfigured) {
          adapter = this.adapters.get("vox-mock-provider")!;
          currentProviderId = adapter.providerId;
        }
      }

      try {
        let rawResult: any;
        if (job.capability === "TEXT_GENERATION" || job.capability === "REASONING" || job.capability === "STRUCTURED_OUTPUT" || job.capability === "VISION") {
          rawResult = adapter.generateText ? await adapter.generateText({ prompt: job.prompt }) : { text: `[Mock text for ${job.prompt.slice(0, 30)}]` };
        } else if (job.capability === "IMAGE_GENERATION" || job.capability === "IMAGE_EDITING") {
          rawResult = adapter.generateImage ? await adapter.generateImage({ prompt: job.prompt, width: 1920, height: 1080 }) : { imageUrl: "http://localhost:9000/vox/mock.png", mediaKey: "mock-img-key" };
        } else if (job.capability === "VIDEO_GENERATION") {
          rawResult = adapter.generateVideo ? await adapter.generateVideo({ prompt: job.prompt, durationSeconds: 5, aspectRatio: "16:9" }) : { videoUrl: "http://localhost:9000/vox/mock.mp4", mediaKey: "mock-vid-key", durationSeconds: 5 };
        } else if (job.capability === "VOICE_GENERATION") {
          rawResult = adapter.generateVoice ? await adapter.generateVoice({ text: job.prompt, voiceId: "mock-voice", language: "ar" }) : { audioUrl: "http://localhost:9000/vox/mock.mp3", mediaKey: "mock-aud-key", durationSeconds: 5 };
        } else {
          rawResult = { output: `[Generated for capability ${job.capability}]` };
        }

        const provenanceInput: any = {
          providerId: currentProviderId,
          modelId: currentModel.modelId,
          modelVersion: currentModel.version,
          generationRequestId: `req-${Date.now().toString(36)}`,
        };
        if (job.creativeDnaVersion !== undefined) provenanceInput.creativeDnaVersion = job.creativeDnaVersion;
        if (job.styleSkillVersion !== undefined) provenanceInput.styleSkillVersion = job.styleSkillVersion;
        if (job.episodeId !== undefined) provenanceInput.episodeId = job.episodeId;
        if (job.sceneId !== undefined) provenanceInput.sceneId = job.sceneId;
        if (job.shotId !== undefined) provenanceInput.shotId = job.shotId;
        if (job.productionNodeId !== undefined) provenanceInput.productionNodeId = job.productionNodeId;

        const provenance = createGenerationProvenance(provenanceInput);

        return {
          success: true,
          result: rawResult,
          provenance,
          attempts,
          selectedModelId: currentModel.modelId,
          selectedProviderId: currentProviderId,
        };
      } catch (err: unknown) {
        const { code, isTransient } = classifyError(err);
        lastError = new ProviderExecutionError(
          code,
          err instanceof Error ? err.message : String(err),
          currentProviderId,
          currentModel.modelId,
          isTransient
        );

        if (!isTransient) {
          // Non-transient error -> check fallback chain
          if (route.fallbackChain && route.fallbackChain.length > 0) {
            const fallbackModelId = route.fallbackChain.shift();
            if (fallbackModelId && fallbackModelId !== "PRIMARY -> FALLBACK 1 -> ESCALATE") {
              const fallbackModel = this.registry.getModel(fallbackModelId);
              if (fallbackModel) {
                currentModel = fallbackModel;
                currentProviderId = fallbackModel.providerId;
                continue;
              }
            }
          }
          break; // No fallbacks left
        }
      }
    }

    return {
      success: false,
      error: lastError || new ProviderExecutionError("UNKNOWN_ERROR", "Execution failed after maximum retries", currentProviderId, currentModel.modelId, false),
      attempts,
      selectedModelId: currentModel.modelId,
      selectedProviderId: currentProviderId,
    };
  }
}

// ─── P0-K Mock Renderer (Strictly Separate from Real Media Engine) ──────────

export class MockProductionRenderer {
  public readonly mode = "MOCK";

  async renderMockVideo(nodeId: string, durationSeconds = 5): Promise<{ videoUrl: string; checksum: string; durationSeconds: number }> {
    return {
      videoUrl: `http://localhost:9000/vox-studio/mock-render-${nodeId}.mp4`,
      checksum: `sha256-mock-${nodeId}-${Date.now()}`,
      durationSeconds,
    };
  }

  async renderMockAudio(nodeId: string, durationSeconds = 5): Promise<{ audioUrl: string; checksum: string; durationSeconds: number }> {
    return {
      audioUrl: `http://localhost:9000/vox-studio/mock-audio-${nodeId}.mp3`,
      checksum: `sha256-mock-audio-${nodeId}-${Date.now()}`,
      durationSeconds,
    };
  }
}

// ─── M5: ElevenLabs Voice Provider ───────────────────────────────────────────
export { ElevenLabsAdapter, type ElevenLabsVoiceRequest, type ElevenLabsVoiceResponse }
  from "./providers/elevenlabs/adapter";
export { ElevenLabsClient, type TTSRequest, type TTSResponse }
  from "./providers/elevenlabs/client";
export {
  getElevenLabsConfig,
  ELEVENLABS_MODELS,
  type ElevenLabsConfig,
  type ElevenLabsModelId,
  type ElevenLabsVoiceSettings,
} from "./providers/elevenlabs/config";

// ─── N1 & N2: Visual & Video Provider Exports ────────────────────────────────
export { OpenAIVisualAdapter } from "./providers/visual/adapter";
export { OpenAIVisualClient }  from "./providers/visual/client";
export { getOpenAIVisualConfig, type OpenAIVisualConfig } from "./providers/visual/config";
export * from "./providers/visual/types";

export { RealVideoAdapter } from "./providers/video/adapter";
export { RealVideoClient }  from "./providers/video/client";
export { getRealVideoConfig, type RealVideoConfig } from "./providers/video/config";
export * from "./providers/video/types";

// ─── Replicate Hosted Provider Exports ───────────────────────────────────────
export { ReplicateAdapter } from "./providers/replicate/adapter";
export { ReplicateClient }  from "./providers/replicate/client";
export { getReplicateConfig, type ReplicateConfig } from "./providers/replicate/config";
export * from "./providers/replicate/types";

