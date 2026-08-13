/**
 * REAL REPLICATE GATE — empirically tests the Replicate image and video providers.
 * Replicate is not configured in this environment (no REPLICATE_API_TOKEN); the
 * gate reports BLOCKED rather than falling back to a mock.
 */
import { replicateImageProvider, replicateVideoProvider } from "@vox/providers";
import { env } from "@vox/config";

async function main() {
  console.log("=== VOX real Replicate gate ===");
  console.log("REPLICATE_API_TOKEN configured:", !!env.REPLICATE_API_TOKEN && env.REPLICATE_API_TOKEN.trim().length > 0);

  const providers = [replicateImageProvider, replicateVideoProvider];
  for (const p of providers) {
    console.log(`\n--- ${p.name} (${p.model}) ---`);
    if (!p.isConfigured()) {
      console.log("STATUS: BLOCKED —", p.configurationError());
      continue;
    }
    try {
      const req = p.capability === "IMAGE" ? { prompt: "podcast studio" } : { prompt: "cinematic push-in" };
      const res = await p.generate(req as never);
      console.log("STATUS: SUCCEEDED", res.sizeBytes, "bytes", res.requestId);
    } catch (e) {
      console.log("STATUS: FAILED —", e instanceof Error ? e.message : String(e));
    }
  }
  console.log("\n=== Replicate gate complete ===");
}

main().catch((e) => {
  console.error("replicate gate error:", e);
  process.exit(1);
});
