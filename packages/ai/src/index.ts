import { SceneContract, MentorReview } from "@vox/contracts";

// ─── Provider Interfaces ──────────────────────────────────────────────────────

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

// ─── Mock Implementations ─────────────────────────────────────────────────────

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
