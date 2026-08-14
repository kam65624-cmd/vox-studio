/**
 * VOX Studio — Top-Level Mock E2E Script
 * 
 * Invokes the actual EpisodeProductionWorkflow from @vox/worker,
 * outputs all required artifacts to artifacts/mock-e2e/,
 * and validates the resulting MP4 container using FFmpegMediaEngine/probe.
 */

import path from "node:path";
import fs from "node:fs/promises";
import { EpisodeProductionWorkflow } from "../apps/worker/src/workflow";
import { FFmpegMediaEngine } from "../packages/media/src/index";

async function runMockE2E() {
  console.log("🎬 Running VOX Studio Top-Level Mock E2E Pipeline...\n");

  const outputDir = path.resolve(process.cwd(), "artifacts", "mock-e2e");
  await fs.mkdir(outputDir, { recursive: true });

  // 1. Execute actual production workflow engine
  const workflow = new EpisodeProductionWorkflow({
    episodeId: "mock-e2e-ep101",
    runtimeMode: "mock",
    outputDir,
  });

  const result = await workflow.run();

  if (!result.success) {
    console.error("❌ Workflow failed:", result.errors);
    process.exit(1);
  }

  // 2. Validate all 7 required artifact outputs exist
  const requiredFiles = [
    "final.mp4",
    "thumbnail.jpg",
    "captions.srt",
    "captions.vtt",
    "production-run.json",
    "manifest.json",
    "report.json",
  ];

  console.log("📁 Validating Artifact Outputs in artifacts/mock-e2e/:");
  for (const filename of requiredFiles) {
    const filePath = path.join(outputDir, filename);
    try {
      const stat = await fs.stat(filePath);
      console.log(`  ✓ ${filename.padEnd(20)} [${stat.size} bytes]`);
    } catch {
      console.error(`  ❌ MISSING: ${filename}`);
      process.exit(1);
    }
  }

  // 3. Run probe against final.mp4
  console.log("\n🔍 Running Media Probe against final.mp4...");
  const finalMp4Path = path.join(outputDir, "final.mp4");
  const mediaEngine = new FFmpegMediaEngine();
  const probeResult = await mediaEngine.probe(finalMp4Path);

  console.log("  Video Stream:", probeResult.videoStream ? "✓ Present" : "❌ Missing");
  console.log("  Audio Stream:", probeResult.audioStream ? "✓ Present" : "❌ Missing");
  console.log("  Format:      ", probeResult.formatName);
  console.log("  Duration:    ", `${probeResult.durationSeconds}s`);
  console.log("  Bitrate:     ", `${probeResult.bitrateBps} bps`);
  console.log("  Video Codec: ", probeResult.videoStream?.codec || "N/A");
  console.log("  Audio Codec: ", probeResult.audioStream?.codec || "N/A");
  console.log("  Resolution:  ", `${probeResult.videoStream?.width}x${probeResult.videoStream?.height}`);
  console.log("  FPS:         ", probeResult.videoStream?.fps);

  const validation = await mediaEngine.validate(finalMp4Path);
  if (!validation.valid) {
    console.error("❌ Media Validation Failed:", validation.errors);
    process.exit(1);
  }

  console.log("\n✅ P0-K.1 MOCK E2E SUCCESSFUL — All artifacts valid and verified!\n");
}

runMockE2E().catch((err) => {
  console.error("Fatal error during mock-e2e:", err);
  process.exit(1);
});
