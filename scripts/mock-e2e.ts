/**
 * MOCK END-TO-END — deterministic pipeline test through Temporal with mock providers.
 * Mock providers still produce real, playable local media files (lavfi/sine sources),
 * so this validates the full orchestration + render + QA chain without external APIs.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureProject, ensureEpisode, startProduction, waitForProduction } from "./helpers.js";
import { resolveRepo } from "@vox/config";
import { probeSummary } from "@vox/media";
import { prisma } from "@vox/database";

const TOPIC = "لماذا ينجح بعض الأشخاص في بناء العادات بينما يفشل الآخرون؟ (mock e2e)";

async function main() {
  console.log("=== VOX mock E2E (deterministic, via Temporal) ===");
  const project = await ensureProject("VOX Mock E2E");
  const ep = await ensureEpisode(project.id, {
    title: "Mock E2E Episode",
    topic: TOPIC,
    config: {
      topic: TOPIC,
      language: "ar",
      format: "podcast",
      durationTargetSec: 45,
      speakerCount: 2,
      sceneCount: 1,
      shotCount: 2,
      style: "Premium cinematic podcast",
    },
    runtimeMode: "mock",
  });

  const { workflowId } = await startProduction(ep.id, "mock", TOPIC);
  console.log("workflow started:", workflowId);

  const res = await waitForProduction(ep.id);
  console.log("final status:", res.status, res.stage, res.error ?? "");

  const finalPath = resolveRepo("apps/worker/artifacts", ep.id, "final.mp4");
  if (res.status !== "EXPORTED" || !existsSync(finalPath)) {
    console.error("MOCK E2E FAILED:", res.status);
    process.exit(1);
  }
  const summary = await probeSummary(finalPath);
  console.log("final.mp4:", finalPath);
  console.log(JSON.stringify({ sizeBytes: summary.sizeBytes, durationSec: summary.durationSec, video: summary.videoCodec, audio: summary.audioCodec, res: `${summary.width}x${summary.height}` }, null, 2));

  if (summary.sizeBytes < 50_000 || summary.durationSec <= 0 || summary.videoCodec !== "h264" || summary.audioCodec !== "aac") {
    console.error("MOCK E2E FAILED: final media invalid");
    process.exit(1);
  }
  await prisma.$disconnect();
  console.log("=== MOCK E2E PASSED ===");
}

main().catch((e) => {
  console.error("mock-e2e error:", e);
  process.exit(1);
});
