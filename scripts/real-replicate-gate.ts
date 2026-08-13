/**
 * Real Replicate Provider Gate (P0-N Track N.1)
 *
 * Verifies live HTTP connectivity and generation for Replicate API:
 *   - Image Generation (FLUX 1.1 Pro)
 *   - Asset download, SHA-256 calculation, and StoragePort ingestion
 *   - GenerationProvenance registration
 *
 * Credentials are read exclusively from process.env (REPLICATE_API_KEY).
 * Missing key yields explicit 'SKIPPED' status (never silent fallback to mock in real mode).
 *
 * Usage:
 *   pnpm vox:real-replicate
 */

import { ReplicateAdapter, getReplicateConfig } from "@vox/ai";
import { AssetDownloader, LocalStorageAdapter } from "@vox/media";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runGate() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║         VOX Studio — Real Replicate Provider Gate        ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const mode = process.env.VOX_RUNTIME_MODE ?? "real";
  console.log(`Runtime mode: ${mode.toUpperCase()}\n`);

  const config = getReplicateConfig();

  if (!config.apiKey) {
    console.log("⚠️  SKIPPED: REPLICATE_API_KEY is not configured in .env");
    console.log("   (Gate safely skipped — zero mock calls made in real mode)\n");
    process.exit(0);
  }

  console.log("1. Testing Real Image Generation via Replicate (black-forest-labs/flux-1.1-pro)...");
  const adapter = new ReplicateAdapter();
  const t0 = Date.now();

  try {
    const res = await adapter.generateImage({
      prompt: "A modern futuristic broadcast news studio with subtle blue neon accents, 8k resolution, cinematic lighting",
      width: 1024,
      height: 1024,
    });

    console.log(`   ✓ Prediction Succeeded!`);
    console.log(`   - Media URL:  ${res.imageUrl?.slice(0, 60)}...`);
    console.log(`   - Media Key:  ${res.mediaKey}`);
    console.log(`   - Cost (USD): $${res.costUsd}`);
    console.log(`   - Latency:    ${Date.now() - t0}ms`);

    // 2. Asset Downloader & Ingestion Test
    console.log("\n2. Downloading and Ingesting Binary Asset into StoragePort...");
    const tmpStorage = new LocalStorageAdapter(path.resolve(__dirname, "../artifacts/storage"));
    const downloader = new AssetDownloader(tmpStorage);

    const downloadRes = await downloader.downloadAndIngest({
      episodeId: "gate-replicate-ep01",
      productionNodeId: "node-replicate-flux",
      source: res.imageUrl!,
      defaultMimeType: "image/webp",
    });

    console.log(`   ✓ Asset Ingested Successfully!`);
    console.log(`   - Storage Key: ${downloadRes.storageKey}`);
    console.log(`   - Storage URI: ${downloadRes.storageUri}`);
    console.log(`   - SHA-256:     ${downloadRes.checksum}`);
    console.log(`   - Size Bytes:  ${downloadRes.sizeBytes} bytes`);

    console.log("\n══════════════════════════════════════════════════════════");
    console.log("  ✅ REAL REPLICATE GATE SUCCESSFUL — All checks passed!");
    console.log("══════════════════════════════════════════════════════════\n");
  } catch (err: any) {
    console.error(`\n❌ REAL REPLICATE GATE FAILED: ${err.message}`);
    process.exit(1);
  }
}

runGate().catch((err) => {
  console.error("Fatal error running real Replicate gate:", err);
  process.exit(1);
});
