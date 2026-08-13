/**
 * REAL VISUAL/VIDEO GATE — empirically tests the real image and video provider
 * gates. Does NOT fake anything: each provider either succeeds with real bytes,
 * reports BLOCKED (credential missing) or FAILED (call attempted but failed).
 */
import { ModelRouter } from "@vox/providers";
import { env, providerSummary } from "@vox/config";

async function main() {
  console.log("=== VOX real visual/video gate ===");
  console.log("runtime mode:", env.VOX_RUNTIME_MODE);
  console.log("providers:", JSON.stringify(providerSummary(), null, 2));

  const router = new ModelRouter({ mode: "real" });
  console.log("registry:", JSON.stringify(router.realProviderSummary(), null, 2));

  // IMAGE gate
  console.log("\n--- IMAGE gate ---");
  try {
    const { result, runs } = await router.runImage("cinematic podcast studio, felt puppet host, paper collage editorial style", { width: 1024, height: 576, seed: 3 });
    console.log("IMAGE SUCCEEDED:", JSON.stringify({ provider: result.provider, model: result.model, requestId: result.requestId, sizeBytes: result.sizeBytes }));
    console.log("runs:", JSON.stringify(runs.map((r) => ({ p: r.provider, s: r.status, e: r.error, id: r.requestId })), null, 2));
  } catch (e) {
    console.log("IMAGE GATE:", e instanceof Error ? e.message : String(e));
    if ((e as { runs?: unknown[] }).runs) {
      console.log("attempts:", JSON.stringify((e as { runs: { provider: string; status: string; error?: string }[] }).runs.map((r) => ({ p: r.provider, s: r.status, e: r.error })), null, 2));
    }
  }

  // VIDEO gate
  console.log("\n--- VIDEO gate ---");
  try {
    const { result, runs } = await router.runVideo("cinematic slow push-in of podcast host studio");
    console.log("VIDEO SUCCEEDED:", JSON.stringify({ provider: result.provider, model: result.model, requestId: result.requestId, sizeBytes: result.sizeBytes }));
    console.log("runs:", JSON.stringify(runs.map((r) => ({ p: r.provider, s: r.status, e: r.error, id: r.requestId })), null, 2));
  } catch (e) {
    console.log("VIDEO GATE:", e instanceof Error ? e.message : String(e));
    if ((e as { runs?: unknown[] }).runs) {
      console.log("attempts:", JSON.stringify((e as { runs: { provider: string; status: string; error?: string }[] }).runs.map((r) => ({ p: r.provider, s: r.status, e: r.error })), null, 2));
    }
  }

  console.log("\n=== gate probe complete ===");
}

main().catch((e) => {
  console.error("gate error:", e);
  process.exit(1);
});
