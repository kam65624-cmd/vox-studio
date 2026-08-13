import { env } from "@vox/config";
import type { MediaResponse, VoiceProvider, VoiceRequest } from "../types.js";

export interface ElevenLabsVoiceOptions {
  apiKey?: string;
  baseUrl?: string;
  voiceId?: string;
  modelId?: string;
  language?: string;
  timeoutMs?: number;
}

// Default voices available on the configured ElevenLabs account.
const DEFAULT_VOICES = {
  ar: {
    speakerA: "pNInz6obpgDQGcFmaJgB", // Adam - Dominant, Firm
    speakerB: "cgSgspJ2msm6clMCkdW9", // Jessica - Playful, Bright, Warm
    speakerC: "Xb7hH8MSUJpSbSDYk0k2", // Alice - Clear, Engaging Educator
  },
  en: {
    speakerA: "pNInz6obpgDQGcFmaJgB",
    speakerB: "cgSgspJ2msm6clMCkdW9",
    speakerC: "SAz9YHcvj6GT2YYXdXww", // River - Relaxed, Neutral
  },
} as const;

export class ElevenLabsVoiceProvider implements VoiceProvider {
  readonly capability = "VOICE" as const;
  readonly isMock = false;
  private apiKey: string | undefined;
  private baseUrl: string;
  readonly model: string;
  private timeoutMs: number;

  constructor(opts: ElevenLabsVoiceOptions = {}) {
    this.apiKey = opts.apiKey ?? env.ELEVENLABS_API_KEY;
    this.baseUrl = opts.baseUrl ?? env.ELEVENLABS_BASE_URL;
    this.model = opts.modelId ?? "eleven_multilingual_v2";
    this.timeoutMs = opts.timeoutMs ?? 180000;
  }

  get name(): string {
    return "elevenlabs";
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  configurationError(): string | undefined {
    return this.isConfigured() ? undefined : "ElevenLabs requires ELEVENLABS_API_KEY";
  }

  private voiceFor(language: string, index: number): string {
    const set = DEFAULT_VOICES[language === "ar" ? "ar" : "en"] as Record<string, string>;
    const keys = Object.keys(set) as string[];
    return set[keys[index % keys.length]];
  }

  async synthesize(req: VoiceRequest): Promise<MediaResponse> {
    if (!this.isConfigured()) throw new Error(this.configurationError());
    const voiceId = this.voiceFor(req.language, req.voiceName ? Number.parseInt(req.voiceName, 10) || 0 : 0);
    const url = `${this.baseUrl}/v1/text-to-speech/${voiceId}`;
    const body = {
      text: req.text,
      model_id: this.model,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "xi-api-key": this.apiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok) {
      const snippet = buf.toString("utf8").slice(0, 400);
      throw new Error(`ElevenLabs HTTP ${res.status}: ${snippet}`);
    }
    const requestId = (res.headers.get("x-request-id") ?? `el-${Date.now()}`) as string;
    if (buf.length < 1024) {
      throw new Error(`ElevenLabs returned suspiciously small audio (${buf.length} bytes)`);
    }
    return {
      binary: buf,
      mimeType: "audio/mpeg",
      requestId,
      model: this.model,
      sizeBytes: buf.length,
    };
  }
}

export const elevenLabsVoiceProvider = new ElevenLabsVoiceProvider();
