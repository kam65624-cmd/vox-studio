import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TextProvider, TextRequest, TextResponse, VoiceProvider, VoiceRequest, ImageProvider, MediaRequest, MediaResponse, VideoProvider } from "./types.js";

const MOCK_TEXT =
  "مرحبا بك في استوديو فوكس. اليوم نتحدث عن العادات ولماذا ينجح البعض في بنائها بينما يفشل الآخرون.";

function ffmpegAvailable(): boolean {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export class MockTextProvider implements TextProvider {
  readonly capability = "TEXT" as const;
  readonly isMock = true;
  readonly name = "mock-text";
  readonly model = "mock/deterministic";
  isConfigured() {
    return true;
  }
  configurationError() {
    return undefined;
  }
  async generate(_req: TextRequest): Promise<TextResponse> {
    return { text: MOCK_TEXT, requestId: "mock-text-1", model: this.model };
  }
}

export class MockVoiceProvider implements VoiceProvider {
  readonly capability = "VOICE" as const;
  readonly isMock = true;
  readonly name = "mock-voice";
  readonly model = "mock/sine-tone";
  isConfigured() {
    return true;
  }
  configurationError() {
    return undefined;
  }
  async synthesize(_req: VoiceRequest): Promise<MediaResponse> {
    const audio = this.renderTone();
    return { binary: audio, mimeType: "audio/mpeg", requestId: "mock-voice-1", model: this.model, sizeBytes: audio.length };
  }
  private renderTone(): Buffer {
    if (ffmpegAvailable()) {
      const tmp = join(tmpdir(), `vox-mock-${Date.now()}.mp3`);
      execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-ac", "1", "-ar", "44100", tmp], { stdio: "pipe" });
      const buf = readFileSync(tmp);
      return buf;
    }
    // Minimal real WAV fallback
    const sr = 44100;
    const n = sr * 3;
    const data = Buffer.alloc(44 + n * 2);
    data.write("RIFF", 0);
    data.writeUInt32LE(36 + n * 2, 4);
    data.write("WAVE", 8);
    data.write("fmt ", 12);
    data.writeUInt32LE(16, 16);
    data.writeUInt16LE(1, 20);
    data.writeUInt16LE(1, 22);
    data.writeUInt32LE(sr, 24);
    data.writeUInt32LE(sr * 2, 28);
    data.writeUInt16LE(2, 32);
    data.writeUInt16LE(16, 34);
    data.write("data", 36);
    data.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / sr) * 8000), 44 + i * 2);
    return data;
  }
}

export class MockImageProvider implements ImageProvider {
  readonly capability = "IMAGE" as const;
  readonly isMock = true;
  readonly name = "mock-image";
  readonly model = "mock/lavfi";
  isConfigured() {
    return true;
  }
  configurationError() {
    return undefined;
  }
  async generate(_req: MediaRequest): Promise<MediaResponse> {
    const img = this.renderImage();
    return { binary: img, mimeType: "image/png", requestId: "mock-image-1", model: this.model, sizeBytes: img.length };
  }
  private renderImage(): Buffer {
    if (ffmpegAvailable()) {
      const tmp = join(tmpdir(), `vox-mock-img-${Date.now()}.png`);
      execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=0x0E5B56:s=1280x720:d=1", "-frames:v", "1", tmp], { stdio: "pipe" });
      const buf = readFileSync(tmp);
      return buf;
    }
    return Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
  }
}

export class MockVideoProvider implements VideoProvider {
  readonly capability = "VIDEO" as const;
  readonly isMock = true;
  readonly name = "mock-video";
  readonly model = "mock/lavfi";
  isConfigured() {
    return true;
  }
  configurationError() {
    return undefined;
  }
  async generate(_req: MediaRequest): Promise<MediaResponse> {
    const video = this.renderVideo();
    return { binary: video, mimeType: "video/mp4", requestId: "mock-video-1", model: this.model, sizeBytes: video.length };
  }
  private renderVideo(): Buffer {
    if (ffmpegAvailable()) {
      const tmp = join(tmpdir(), `vox-mock-vid-${Date.now()}.mp4`);
      execFileSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=24:duration=2", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-an", tmp], { stdio: "pipe" });
      const buf = readFileSync(tmp);
      return buf;
    }
    return Buffer.alloc(0);
  }
}

export const mockTextProvider = new MockTextProvider();
export const mockVoiceProvider = new MockVoiceProvider();
export const mockImageProvider = new MockImageProvider();
export const mockVideoProvider = new MockVideoProvider();
