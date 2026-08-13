/**
 * VOX Studio — Local Video Production Launcher Script
 *
 * Runs the full 18-step VOX Episode Production Pipeline locally:
 *   1. Load Episode & Generate Execution Plan
 *   2. Generate & Validate Assets
 *   3. Assemble Shots, Scenes & Timeline
 *   4. Generate Audio, Voices & RTL Captions
 *   5. Perform Mentor QA & Continuity Checks
 *   6. Render Final MP4 using FFmpeg
 *   7. Generate Thumbnails & Final QA
 */

import path from "node:path";
import fs from "node:fs/promises";
import { EpisodeProductionWorkflow } from "../apps/worker/src/workflow";
import { FFmpegMediaEngine } from "../packages/media/src/index";

async function produceLocalVideo() {
  console.log("==========================================================");
  console.log("🎬 VOX Studio — Local Video Production Engine");
  console.log("==========================================================\n");

  const episodeId = `ep-local-${Date.now().toString(36)}`;
  const outputDir = path.resolve(process.cwd(), "artifacts", "produced-video", episodeId);
  await fs.mkdir(outputDir, { recursive: true });

  const runtimeMode = process.env.VOX_RUNTIME_MODE ?? "mock";
  console.log(`📌 Episode ID:    ${episodeId}`);
  console.log(`📌 Runtime Mode:  ${runtimeMode.toUpperCase()}`);
  console.log(`📌 Output Path:   ${outputDir}\n`);

  const workflow = new EpisodeProductionWorkflow({
    episodeId,
    runtimeMode,
    outputDir,
  });

  const startTime = Date.now();
  const result = await workflow.run();
  const elapsedTimeSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  if (!result.success) {
    console.error("❌ Video Production Failed:", result.errors);
    process.exit(1);
  }

  const finalMp4Path = path.join(outputDir, "final.mp4");
  const mediaEngine = new FFmpegMediaEngine();
  const probe = await mediaEngine.probe(finalMp4Path);

  console.log("\n==========================================================");
  console.log("🎉 FIRST VIDEO PRODUCED SUCCESSFULLY!");
  console.log("==========================================================");
  console.log(`📁 Video File:    ${finalMp4Path}`);
  console.log(`⏱️ Render Time:   ${elapsedTimeSeconds}s`);
  console.log(`📹 Video Stream:  ${probe.videoStream?.width}x${probe.videoStream?.height} @ ${probe.videoStream?.fps} FPS (${probe.videoStream?.codec})`);
  console.log(`🔊 Audio Stream:  ${probe.audioStream?.sampleRate} Hz, ${probe.audioStream?.channels} ch (${probe.audioStream?.codec})`);
  console.log(`⏳ Duration:      ${probe.durationSeconds} seconds`);
  console.log(`📦 File Size:     ${(probe.sizeBytes / 1024).toFixed(2)} KB`);
  console.log("==========================================================\n");
}

produceLocalVideo().catch((err) => {
  console.error("Fatal error producing local video:", err);
  process.exit(1);
});
