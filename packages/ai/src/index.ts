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

// ─── Initial Model Registry Entries ──────────────────────────────────────────

export const INITIAL_MODEL_REGISTRY: ModelDefinition[] = [
  {
    modelId: "meta/muse-glimmer-30b",
    providerId: "meta",
    displayName: "Meta Muse Glimmer 30B",
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
    modelId: "zai/glm-5.2",
    providerId: "zai",
    displayName: "Z.AI GLM-5.2",
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
    modelId: "qwen/qwen-image-edit",
    providerId: "qwen",
    displayName: "Qwen Image Edit",
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
    availability: "ONLINE",
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
