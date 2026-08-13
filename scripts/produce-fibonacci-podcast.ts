/**
 * REAL PRODUCTION — deterministic Fibonacci podcast (English) for reproducibility.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureProject, ensureEpisode, startProduction, waitForProduction } from "./helpers.js";
import { resolveRepo } from "@vox/config";
import { probeSummary } from "@vox/media";
import { prisma } from "@vox/database";

const TOPIC = "Why does the Fibonacci sequence appear everywhere in nature?";

async function main() {
  console.log("=== VOX REAL production — Fibonacci podcast ===");
  const project = await ensureProject("VOX Real");
  const ep = await ensureEpisode(project.id, {
    title: "The Fibonacci Podcast",
    topic: TOPIC,
    config: {
      topic: TOPIC,
      language: "en",
      format: "podcast",
      durationTargetSec: 45,
      speakerCount: 2,
      sceneCount: 2,
      shotCount: 4,
      style: "Premium cinematic podcast",
    },
    runtimeMode: "real",
  });

  const { workflowId } = await startProduction(ep.id, "real", TOPIC);
  console.log("workflow:", workflowId);

  const res = await waitForProduction(ep.id, 25 * 60_000);
  console.log("production:", res.status, res.stage, res.error ?? "");

  const finalPath = join(resolveRepo("apps/worker/artifacts", ep.id), "final.mp4");
  if (!existsSync(finalPath)) {
    console.error("final.mp4 missing");
    process.exit(1);
  }
  const summary = await probeSummary(finalPath);
  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("produce-fibonacci error:", e);
  process.exit(1);
});
