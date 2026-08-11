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
  });
});

describe("StoragePort & ArtifactRegistry", () => {
  it("stores file and returns valid SHA-256 checksum and URI", async () => {
    const { LocalStorageAdapter, ArtifactRegistry } = await import("./index");
    const storage = new LocalStorageAdapter();
    const registry = new ArtifactRegistry(storage);

    const asset = await registry.registerArtifact({
      episodeId: "ep-test-01",
      productionNodeId: "node-shot-01",
      assetType: "VISUAL",
      data: Buffer.from("test visual artifact content"),
      mimeType: "image/png",
    });

    expect(asset.id).toBeDefined();
    expect(asset.checksum).toBeDefined();
    expect(asset.checksum.length).toBe(64); // SHA-256 length
    expect(asset.status).toBe("VALID");
    expect(asset.sizeBytes).toBeGreaterThan(0);

    const fetched = registry.getAsset(asset.id);
    expect(fetched).toBeDefined();
    expect(fetched?.checksum).toBe(asset.checksum);
  });
});

describe("FFmpegMediaEngine", () => {
  it("creates media engine instance and exposes MediaEnginePort methods", async () => {
    const { FFmpegMediaEngine, PROFILES } = await import("./index");
    process.env["VOX_RUNTIME_MODE"] = "mock";
    const engine = new FFmpegMediaEngine();

    const probeRes = await engine.probe("./dummy.mp4");
    expect(probeRes.filePath).toBe("./dummy.mp4");
    expect(probeRes.videoStream).toBeDefined();

    const renderRes = await engine.renderVideo({ episodeId: "ep-01", totalDurationSeconds: 10 }, "./artifacts/test-output.mp4");
    expect(renderRes.outputPath).toBe("./artifacts/test-output.mp4");
    expect(renderRes.checksum.length).toBe(64);
  });
});
