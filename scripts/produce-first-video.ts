/**
 * REAL PRODUCTION — first real VOX podcast video (Arabic, habits topic).
 * Runs through Temporal with REAL providers (NVIDIA NIM text, ElevenLabs voice,
 * real image provider). Video-model gate is reported honestly.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ensureProject, ensureEpisode, startProduction, waitForProduction } from "./helpers.js";
import { resolveRepo, providerSummary } from "@vox/config";
import { probeSummary, ffprobeJson } from "@vox/media";
import { prisma } from "@vox/database";

const TOPIC = "لماذا ينجح بعض الأشخاص في بناء العادات بينما يفشل الآخرون؟";

async function main() {
  console.log("=== VOX REAL production — first podcast video ===");
  console.log("provider summary:", JSON.stringify(providerSummary(), null, 2));

  const project = await ensureProject("VOX Real");
  const ep = await ensureEpisode(project.id, {
    title: "كيف تُبنى العادات؟",
    topic: TOPIC,
    config: {
      topic: TOPIC,
      language: "ar",
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

  const dir = resolveRepo("apps/worker/artifacts", ep.id);
  const finalPath = join(dir, "final.mp4");
  if (!existsSync(finalPath)) {
    console.error("final.mp4 missing at", finalPath);
    process.exit(1);
  }
  const summary = await probeSummary(finalPath);
  const probe = await ffprobeJson(finalPath);
  console.log("\n=== FINAL MEDIA ===");
  console.log(JSON.stringify({ path: finalPath, sizeBytes: summary.sizeBytes, durationSec: summary.durationSec, width: summary.width, height: summary.height, videoCodec: summary.videoCodec, audioCodec: summary.audioCodec, bitRate: summary.bitRate, container: summary.formatName }, null, 2));

  console.log("\n=== EVIDENCE ===");
  const evidence = join(dir, "real-provider-evidence.json");
  if (existsSync(evidence)) {
    const ev = JSON.parse(readFileSync(evidence, "utf8"));
    console.log(JSON.stringify({ runtimeMode: ev.runtimeMode, providers: ev.providers, artifactSizes: ev.artifactSizes, finalQa: ev.finalQa }, null, 2));
  }

  await prisma.$disconnect();
  console.log("\n=== REAL PRODUCTION COMPLETE ===");
}

main().catch((e) => {
  console.error("produce-first-video error:", e);
  process.exit(1);
});
