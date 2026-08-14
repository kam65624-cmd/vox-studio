/**
 * Real ElevenLabs Connectivity Gate (P0-M Track M5)
 *
 * Verifies real HTTP connection to ElevenLabs TTS API using key in process.env.ELEVENLABS_API_KEY.
 * Tests voice generation, checks returned audio buffer, and validates response normalization.
 *
 * Usage:
 *   pnpm --filter @vox/worker exec tsx ../../scripts/real-elevenlabs-gate.ts
 */

import { ElevenLabsAdapter } from "../packages/ai/src/providers/elevenlabs/adapter";
import { getElevenLabsConfig } from "../packages/ai/src/providers/elevenlabs/config";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runGate() {
  console.log("🚀 Starting ElevenLabs Real Connectivity Gate...\n");

  const config = getElevenLabsConfig();
  console.log("Environment check:");
  console.log(`  VOX_RUNTIME_MODE: ${process.env.VOX_RUNTIME_MODE ?? "unset"}`);
  console.log(`  ELEVENLABS_API_KEY set: ${Boolean(config.apiKey)}`);
  console.log(`  Default Voice ID: ${config.defaultVoiceId}`);
  console.log(`  Default Model ID: ${config.defaultModelId}\n`);

  if (!config.apiKey) {
    console.error("❌ ELEVENLABS_API_KEY is not set in .env!");
    process.exit(1);
  }

  const adapter = new ElevenLabsAdapter();

  console.log("--- Testing ElevenLabs TTS Generation (Arabic) ---");
  try {
    const res = await adapter.generateVoice({
      text: "مرحبا بكم في فُكس ستوديو، منصة إنتاج المحتوى الذكي.",
      language: "ar",
      voiceId: config.defaultVoiceId,
    });

    console.log("✅ Success!");
    console.log(`  Media Key: ${res.mediaKey}`);
    console.log(`  Duration (estimated): ${res.durationSeconds}s`);
    console.log(`  Cost (estimated): $${res.costUsd.toFixed(6)}`);
    console.log(`  Audio Buffer size: ${res.audioBuffer?.length ?? 0} bytes`);
    console.log(`  Audio Base64 length: ${res.audioBase64?.length ?? 0} chars`);
    console.log(`  Character Count: ${res.characterCount}`);
    console.log(`  Latency: ${res.latencyMs}ms\n`);

    if (!res.audioBuffer || res.audioBuffer.length < 100) {
      throw new Error("Returned audio buffer is empty or suspiciously small!");
    }
  } catch (err: any) {
    console.error("❌ ElevenLabs Exception:", err.message);
    process.exit(1);
  }

  console.log("🎉 ElevenLabs Real Connectivity Gate PASSED successfully!");
}

runGate().catch((err) => {
  console.error("Fatal error running ElevenLabs gate:", err);
  process.exit(1);
});
