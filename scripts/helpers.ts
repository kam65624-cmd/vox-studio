import { Connection, Client } from "@temporalio/client";
import { env } from "@vox/config";
import { prisma } from "@vox/database";
import type { ProductionConfig, RuntimeMode } from "@vox/contracts";

export async function connectTemporal(): Promise<Client> {
  const connection = await Connection.connect({ address: env.TEMPORAL_ADDRESS });
  return new Client({ connection, namespace: env.TEMPORAL_NAMESPACE });
}

export async function ensureProject(name: string): Promise<{ id: string }> {
  const existing = await prisma.project.findFirst({ where: { name }, orderBy: { createdAt: "desc" } });
  if (existing) return existing;
  return prisma.project.create({ data: { name } });
}

export async function ensureEpisode(
  projectId: string,
  input: { title: string; topic: string; config: Omit<ProductionConfig, "topic"> & { topic: string }; runtimeMode: RuntimeMode },
): Promise<{ id: string }> {
  const existing = await prisma.episode.findFirst({ where: { topic: input.topic }, orderBy: { createdAt: "desc" } });
  if (existing) return existing;
  const ep = await prisma.episode.create({
    data: {
      projectId,
      title: input.title,
      topic: input.topic,
      language: input.config.language,
      format: input.config.format,
      durationTargetSec: input.config.durationTargetSec,
      speakerCount: input.config.speakerCount,
      sceneCount: input.config.sceneCount,
      shotCount: input.config.shotCount,
      style: input.config.style,
      status: "DRAFT",
    },
  });
  return ep;
}

export async function startProduction(episodeId: string, runtimeMode: RuntimeMode, topic: string): Promise<{ workflowId: string }> {
  const client = await connectTemporal();
  const ep = await prisma.episode.findUnique({ where: { id: episodeId } });
  if (!ep) throw new Error(`episode ${episodeId} not found`);
  const workflowId = `episode-${episodeId}`;
  await prisma.production.upsert({
    where: { workflowId },
    create: { episodeId, workflowId, status: "DRAFT", stage: "script", runtimeMode },
    update: { status: "DRAFT", stage: "script", runtimeMode, error: null },
  });
  await client.workflow.start("episodeProductionWorkflow", {
    taskQueue: "vox-production",
    workflowId,
    args: [
      {
        episodeId,
        projectId: ep.projectId,
        title: ep.title,
        topic,
        config: {
          topic: ep.topic,
          language: ep.language as "ar" | "en",
          format: ep.format,
          durationTargetSec: ep.durationTargetSec,
          speakerCount: ep.speakerCount,
          sceneCount: ep.sceneCount,
          shotCount: ep.shotCount,
          style: ep.style,
          resolution: { width: 1280, height: 720 },
          fps: 24,
        },
        runtimeMode,
      },
    ],
  });
  return { workflowId };
}

export async function waitForProduction(episodeId: string, timeoutMs = 20 * 60_000): Promise<{ status: string; stage: string; error?: string | null }> {
  const deadline = Date.now() + timeoutMs;
  let last: { status: string; stage: string; error?: string | null } = { status: "RUNNING", stage: "script" };
  while (Date.now() < deadline) {
    const row = await prisma.production.findFirst({ where: { episodeId }, orderBy: { createdAt: "desc" } });
    if (row) {
      last = { status: row.status, stage: row.stage ?? "script", error: row.error };
      if (row.status === "EXPORTED" || row.status === "FAILED") return last;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return last;
}

export function currentStageMessage(episodeId: string): Promise<{ message?: string | null; progress?: number | null; status?: string }> {
  return prisma.production
    .findFirst({ where: { episodeId }, orderBy: { createdAt: "desc" } })
    .then((r) => ({ message: r?.message, progress: r?.progress, status: r?.status }));
}
