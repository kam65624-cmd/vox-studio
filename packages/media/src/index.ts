export interface MediaProbeResult {
  filePath: string;
  formatName: string;
  durationSeconds: number;
  sizeBytes: number;
  bitrateBps: number;
  videoStream?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
    aspectRatio: string;
  };
  audioStream?: {
    codec: string;
    sampleRate: number;
    channels: number;
    loudnessLufs?: number;
  };
}

export interface RenderProfile {
  name: "16:9" | "9:16" | "1:1" | "4:5";
  width: number;
  height: number;
  fps: number;
  videoBitrate: string;
  audioBitrate: string;
}

export const PROFILES: Record<string, RenderProfile> = {
  "16:9": {
    name: "16:9",
    width: 1920,
    height: 1080,
    fps: 30,
    videoBitrate: "10M",
    audioBitrate: "192k",
  },
  "9:16": {
    name: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    videoBitrate: "8M",
    audioBitrate: "192k",
  },
  "1:1": {
    name: "1:1",
    width: 1080,
    height: 1080,
    fps: 30,
    videoBitrate: "6M",
    audioBitrate: "192k",
  },
  "4:5": {
    name: "4:5",
    width: 1080,
    height: 1350,
    fps: 30,
    videoBitrate: "7M",
    audioBitrate: "192k",
  },
};

export function validateProbeResult(probe: MediaProbeResult): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (probe.durationSeconds <= 0) {
    errors.push("Duration must be greater than 0");
  }
  if (!probe.videoStream) {
    errors.push("Missing video stream");
  } else {
    if (probe.videoStream.width <= 0 || probe.videoStream.height <= 0) {
      errors.push("Invalid video dimensions");
    }
  }
  if (!probe.audioStream) {
    errors.push("Missing audio stream");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
