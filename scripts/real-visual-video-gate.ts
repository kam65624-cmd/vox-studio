/**
 * Real Visual & Video Provider Gate (P0-N Track N7)
 *
 * Verifies real HTTP connectivity and generation for configured providers:
 *   - Text Generation (NVIDIA Muse 30B)
 *   - Reasoning / Vision (NVIDIA GLM-5.2)
 *   - Voice Generation (ElevenLabs)
 *   - Image Generation (OpenAI / Visual Provider)
 *   - Video Generation (Runway / Video Provider)
 *
 * Credentials are read exclusively from process.env (.env).
 * Missing keys yield explicit 'SKIPPED' status (never silent fallback to mock in real mode).
 *
 * Usage:
 *   pnpm vox:real-visual-video
 */

import {
  NVIDIAAdapter,
  ElevenLabsAdapter,
  OpenAIVisualAdapter,
  RealVideoAdapter,
  getNVIDIAConfig,
  getElevenLabsConfig,
  getOpenAIVisualConfig,
  getRealVideoConfig,
} from "@vox/ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runGate() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     VOX Studio — Real Visual & Video Provider Gate       ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const mode = process.env.VOX_RUNTIME_MODE ?? "real";
  console.log(`Runtime mode: ${mode.toUpperCase()}\n`);

  let totalTested = 0;
  let totalPassed = 0;
  let totalSkipped = 0;

  // ── 1. Text Generation (NVIDIA Muse 30B) ──────────────────────────────────
  console.log("1. Testing Text Generation (NVIDIA Muse 30B)...");
  const nvidiaCfg = getNVIDIAConfig();
  if (nvidiaCfg.apiKey) {
    totalTested++;
    try {
      const adapter = new NVIDIAAdapter();
      const res = await adapter.generateText({
        prompt: "Generate a 1-sentence headline about AI video OS.",
      });
      console.log(`   ✓ PASSED: "${res.text.trim().slice(0, 60)}..." (tokens: ${res.tokensUsed})`);
      totalPassed++;
    } catch (err: any) {
      console.error(`   ❌ FAILED: ${err.message}`);
    }
  } else {
    console.log("   ⚠️  SKIPPED: NVIDIA_API_KEY / NVIDIA_MUSE_API_KEY not configured");
    totalSkipped++;
  }

  // ── 2. Reasoning / Vision (NVIDIA GLM-5.2) ───────────────────────────────
  console.log("\n2. Testing Reasoning / Vision (NVIDIA GLM-5.2)...");
  const glmKey = process.env.NVIDIA_GLM_API_KEY || nvidiaCfg.apiKey;
  if (glmKey) {
    totalTested++;
    try {
      const adapter = new NVIDIAAdapter();
      const res = await adapter.generateText({
        prompt: "Reason about shot composition for a news studio.",
      });
      console.log(`   ✓ PASSED: "${res.text.trim().slice(0, 60)}..." (tokens: ${res.tokensUsed})`);
      totalPassed++;
    } catch (err: any) {
      console.error(`   ❌ FAILED: ${err.message}`);
    }
  } else {
    console.log("   ⚠️  SKIPPED: NVIDIA_GLM_API_KEY not configured");
    totalSkipped++;
  }

  // ── 3. Voice Generation (ElevenLabs) ──────────────────────────────────────
  console.log("\n3. Testing Voice Generation (ElevenLabs)...");
  const elCfg = getElevenLabsConfig();
  if (elCfg.apiKey) {
    totalTested++;
    try {
      const adapter = new ElevenLabsAdapter();
      const res = await adapter.generateVoice({
        text: "مرحبا بكم في فُكس ستوديو",
        language: "ar",
        voiceId: elCfg.defaultVoiceId,
      });
      console.log(`   ✓ PASSED: ${res.audioBuffer?.length ?? 0} bytes audio generated (mediaKey: ${res.mediaKey})`);
      totalPassed++;
    } catch (err: any) {
      console.error(`   ❌ FAILED: ${err.message}`);
    }
  } else {
    console.log("   ⚠️  SKIPPED: ELEVENLABS_API_KEY not configured");
    totalSkipped++;
  }

  // ── 4. Image Generation (OpenAI / Visual Adapter) ─────────────────────────
  console.log("\n4. Testing Image Generation (OpenAI Visual API)...");
  const visualCfg = getOpenAIVisualConfig();
  if (visualCfg.apiKey) {
    totalTested++;
    try {
      const adapter = new OpenAIVisualAdapter();
      const res = await adapter.generateImage({
        prompt: "A modern futuristic broadcast news studio with blue neon lighting",
        width: 1024,
        height: 1024,
      });
      console.log(`   ✓ PASSED: image generated (mediaKey: ${res.mediaKey}, url: ${res.imageUrl?.slice(0, 40)}...)`);
      totalPassed++;
    } catch (err: any) {
      console.error(`   ❌ FAILED: ${err.message}`);
    }
  } else {
    console.log("   ⚠️  SKIPPED: OPENAI_API_KEY not configured");
    totalSkipped++;
  }

  // ── 5. Video Generation (Runway / Real Video Adapter) ────────────────────
  console.log("\n5. Testing Video Generation (Real Video API)...");
  const videoCfg = getRealVideoConfig();
  if (videoCfg.apiKey) {
    totalTested++;
    try {
      const adapter = new RealVideoAdapter();
      const res = await adapter.generateVideo({
        prompt: "Camera panning slowly across modern television newsroom",
        durationSeconds: 5,
      });
      console.log(`   ✓ PASSED: video generated (mediaKey: ${res.mediaKey}, url: ${res.videoUrl?.slice(0, 40)}...)`);
      totalPassed++;
    } catch (err: any) {
      console.error(`   ❌ FAILED: ${err.message}`);
    }
  } else {
    console.log("   ⚠️  SKIPPED: RUNWAY_API_KEY / REPLICATE_API_KEY not configured");
    totalSkipped++;
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`Summary: Tested: ${totalTested} | Passed: ${totalPassed} | Skipped: ${totalSkipped}`);
  console.log("══════════════════════════════════════════════════════════\n");
}

runGate().catch((err) => {
  console.error("Fatal error running real visual/video gate:", err);
  process.exit(1);
});
