import { tts } from "edge-tts";
import type { MediaResponse, VoiceProvider, VoiceRequest } from "../types.js";

const ARABIC_VOICES = ["ar-EG-SalmaNeural", "ar-SA-HamedNeural", "ar-AE-FatimaNeural", "ar-SY-AmanyNeural"];
const ENGLISH_VOICES = ["en-US-AriaNeural", "en-US-GuyNeural", "en-GB-SoniaNeural"];

export class EdgeTtsVoiceProvider implements VoiceProvider {
  readonly capability = "VOICE" as const;
  readonly isMock = false;
  readonly model = "edge-tts";

  get name(): string {
    return "edge-tts";
  }

  isConfigured(): boolean {
    return true; // keyless real service
  }

  configurationError(): string | undefined {
    return undefined;
  }

  private voiceFor(language: string, index: number): string {
    const pool = language === "ar" ? ARABIC_VOICES : ENGLISH_VOICES;
    const idx = Number.parseInt(index >= 0 ? String(index) : "0", 10);
    return pool[Math.abs(idx) % pool.length];
  }

  async synthesize(req: VoiceRequest): Promise<MediaResponse> {
    const voice = this.voiceFor(req.language, req.voiceName ? Number.parseInt(req.voiceName, 10) : 0);
    const buffer = await tts(req.text, { voice });
    if (!buffer || buffer.length < 1024) {
      throw new Error(`edge-tts returned suspiciously small audio (${buffer?.length ?? 0} bytes)`);
    }
    return {
      binary: buffer,
      mimeType: "audio/mpeg",
      requestId: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      model: `edge-tts/${voice}`,
      sizeBytes: buffer.length,
    };
  }
}

export const edgeTtsVoiceProvider = new EdgeTtsVoiceProvider();
