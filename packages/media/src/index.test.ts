import { describe, it, expect } from "vitest";
import { PROFILES, validateProbeResult, MediaProbeResult } from "./index";

describe("Media Render Profiles", () => {
  it("defines standard resolution profiles", () => {
    expect(PROFILES["16:9"]).toEqual({
      name: "16:9",
      width: 1920,
      height: 1080,
      fps: 30,
      videoBitrate: "10M",
      audioBitrate: "192k",
    });

    expect(PROFILES["9:16"]).toEqual({
      name: "9:16",
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrate: "8M",
      audioBitrate: "192k",
    });
  });

  it("validates healthy probe result", () => {
    const probe: MediaProbeResult = {
      filePath: "/media/render-01.mp4",
      formatName: "mov,mp4,m4a,3gp,3g2,mj2",
      durationSeconds: 75.4,
      sizeBytes: 45_000_000,
      bitrateBps: 4_700_000,
      videoStream: {
        codec: "h264",
        width: 1920,
        height: 1080,
        fps: 30,
        aspectRatio: "16:9",
      },
      audioStream: {
        codec: "aac",
        sampleRate: 48000,
        channels: 2,
        loudnessLufs: -14.2,
      },
    };

    const res = validateProbeResult(probe);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("detects invalid probe missing streams", () => {
    const probe: MediaProbeResult = {
      filePath: "/media/bad.mp4",
      formatName: "mp4",
      durationSeconds: 0,
      sizeBytes: 0,
      bitrateBps: 0,
    };

    const res = validateProbeResult(probe);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("Duration must be greater than 0");
    expect(res.errors).toContain("Missing video stream");
    expect(res.errors).toContain("Missing audio stream");
  });
});
