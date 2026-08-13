import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { Connection, Client } from "@temporalio/client";
import { env, resolveRepo } from "@vox/config";
import { prisma } from "@vox/database";
import { ProductionConfigSchema, type ProductionConfig } from "@vox/contracts";
import { validateConfigForProduction } from "@vox/domain";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(fastifyStatic, { root: resolveRepo(env.ARTIFACTS_DIR), prefix: "/api/artifacts/", decorateReply: false });

let temporalClient: Client | undefined;

async function getTemporalClient(): Promise<Client> {
  if (!temporalClient) {
    const connection = await Connection.connect({ address: env.TEMPORAL_ADDRESS });
    temporalClient = new Client({ connection, namespace: env.TEMPORAL_NAMESPACE });
  }
  return temporalClient;
}

function artifactBaseDir(): string {
  return resolveRepo(env.ARTIFACTS_DIR);
}

// ─── Health ──────────────────────────────────────────────────────────────────

app.get("/api/health", async () => ({ ok: true, runtimeMode: env.VOX_RUNTIME_MODE, ts: new Date().toISOString() }));

// ─── Projects ────────────────────────────────────────────────────────────────

app.post<{ Body: { name?: string } }>("/api/projects", async (req, reply) => {
  const name = (req.body?.name ?? "").trim();
  if (!name) return reply.code(400).send({ error: "name is required" });
  const p = await prisma.project.create({ data: { name } });
  return { id: p.id, name: p.name, createdAt: p.createdAt.toISOString() };
});

app.get("/api/projects", async () => {
  const rows = await prisma.project.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { episodes: true } } } });
  return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.createdAt.toISOString(), episodeCount: r._count.episodes }));
});

app.get<{ Params: { id: string } }>("/api/projects/:id", async (req, reply) => {
  const p = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!p) return reply.code(404).send({ error: "project not found" });
  return p;
});

// ─── Episodes ────────────────────────────────────────────────────────────────

app.post<{ Params: { id: string }; Body: { title?: string; config?: Partial<ProductionConfig> } }>("/api/projects/:id/episodes", async (req, reply) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return reply.code(404).send({ error: "project not found" });

  const config = ProductionConfigSchema.safeParse({
    topic: req.body?.config?.topic ?? req.body?.title ?? "",
    language: req.body?.config?.language ?? "ar",
    format: req.body?.config?.format ?? "podcast",
    durationTargetSec: req.body?.config?.durationTargetSec ?? 45,
    speakerCount: req.body?.config?.speakerCount ?? 2,
    sceneCount: req.body?.config?.sceneCount ?? 2,
    shotCount: req.body?.config?.shotCount ?? 4,
    style: req.body?.config?.style ?? "Premium cinematic podcast",
    resolution: req.body?.config?.resolution ?? { width: 1280, height: 720 },
    fps: req.body?.config?.fps ?? 24,
  });
  if (!config.success) return reply.code(400).send({ error: "invalid config", issues: config.error.flatten() });

  const title = (req.body?.title ?? "").trim() || config.data.topic.slice(0, 60);
  const ep = await prisma.episode.create({
    data: {
      projectId: req.params.id,
      title,
      topic: config.data.topic,
      language: config.data.language,
      format: config.data.format,
      durationTargetSec: config.data.durationTargetSec,
      speakerCount: config.data.speakerCount,
      sceneCount: config.data.sceneCount,
      shotCount: config.data.shotCount,
      style: config.data.style,
      status: "DRAFT",
    },
  });
  return { id: ep.id, projectId: ep.projectId, title: ep.title, config: config.data, status: ep.status, createdAt: ep.createdAt.toISOString() };
});

app.get<{ Params: { projectId: string } }>("/api/projects/:projectId/episodes", async (req) => {
  const rows = await prisma.episode.findMany({ where: { projectId: req.params.projectId }, orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    topic: r.topic,
    language: r.language,
    status: r.status,
    stage: r.stage,
    stageMessage: r.stageMessage,
    durationTargetSec: r.durationTargetSec,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
});

app.get<{ Params: { id: string } }>("/api/episodes/:id", async (req, reply) => {
  const ep = await prisma.episode.findUnique({ where: { id: req.params.id }, include: { productions: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!ep) return reply.code(404).send({ error: "episode not found" });
  const prod = ep.productions[0];
  return {
    id: ep.id,
    projectId: ep.projectId,
    title: ep.title,
    topic: ep.topic,
    config: {
      topic: ep.topic,
      language: ep.language,
      format: ep.format,
      durationTargetSec: ep.durationTargetSec,
      speakerCount: ep.speakerCount,
      sceneCount: ep.sceneCount,
      shotCount: ep.shotCount,
      style: ep.style,
      resolution: { width: 1280, height: 720 },
      fps: 24,
    },
    status: ep.status,
    stage: ep.stage,
    stageMessage: ep.stageMessage,
    production: prod
      ? { id: prod.id, status: prod.status, stage: prod.stage, message: prod.message, progress: prod.progress, runtimeMode: prod.runtimeMode, error: prod.error, createdAt: prod.createdAt.toISOString(), updatedAt: prod.updatedAt.toISOString() }
      : null,
    createdAt: ep.createdAt.toISOString(),
    updatedAt: ep.updatedAt.toISOString(),
  };
});

// ─── Production trigger ──────────────────────────────────────────────────────

app.post<{ Params: { id: string }; Body: { runtimeMode?: string } }>("/api/episodes/:id/produce", async (req, reply) => {
  const ep = await prisma.episode.findUnique({ where: { id: req.params.id } });
  if (!ep) return reply.code(404).send({ error: "episode not found" });

  const config = {
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
  };
  const errors = validateConfigForProduction(config);
  if (errors.length > 0) return reply.code(400).send({ error: "invalid episode config", errors });

  const runtimeMode = (req.body?.runtimeMode ?? env.VOX_RUNTIME_MODE) as "mock" | "real" | "auto";
  const workflowId = `episode-${ep.id}`;
  const client = await getTemporalClient();
  const prod = await prisma.production.create({
    data: {
      episodeId: ep.id,
      workflowId,
      status: "DRAFT",
      stage: "script",
      runtimeMode,
    },
  });

  try {
    await client.workflow.start("episodeProductionWorkflow", {
      taskQueue: "vox-production",
      workflowId,
      args: [
        {
          episodeId: ep.id,
          projectId: ep.projectId,
          title: ep.title,
          topic: ep.topic,
          config,
          runtimeMode,
        },
      ],
    });
  } catch (e) {
    await prisma.production.update({ where: { id: prod.id }, data: { status: "FAILED", error: (e as Error).message } });
    return reply.code(500).send({ error: "failed to start workflow", detail: (e as Error).message });
  }

  await prisma.episode.update({ where: { id: ep.id }, data: { status: "PLANNING", stage: "script", stageMessage: "Production started" } });
  return { id: prod.id, workflowId, status: "STARTED", runtimeMode };
});

// ─── Production status / artifacts / media ───────────────────────────────────

app.get<{ Params: { id: string } }>("/api/episodes/:id/production", async (req, reply) => {
  const prod = await prisma.production.findFirst({ where: { episodeId: req.params.id }, orderBy: { createdAt: "desc" } });
  if (!prod) return reply.code(404).send({ error: "no production" });
  return {
    id: prod.id,
    workflowId: prod.workflowId,
    status: prod.status,
    stage: prod.stage,
    message: prod.message,
    progress: prod.progress,
    runtimeMode: prod.runtimeMode,
    error: prod.error,
    data: prod.data as unknown,
    createdAt: prod.createdAt.toISOString(),
    updatedAt: prod.updatedAt.toISOString(),
    completedAt: prod.completedAt?.toISOString() ?? null,
  };
});

app.get<{ Params: { id: string } }>("/api/episodes/:id/state", async (req, reply) => {
  const p = join(artifactBaseDir(), req.params.id, "state.json");
  if (!existsSync(p)) return reply.code(404).send({ error: "no state" });
  return JSON.parse(readFileSync(p, "utf8")) as unknown;
});

app.get<{ Params: { id: string } }>("/api/episodes/:id/media", async (req, reply) => {
  const dir = join(artifactBaseDir(), req.params.id);
  const exists = (f: string) => existsSync(join(dir, f));
  return {
    hasVideo: exists("final.mp4"),
    hasThumbnail: exists("thumbnail.jpg"),
    hasCaptionsSrt: exists("captions.srt"),
    hasCaptionsVtt: exists("captions.vtt"),
    videoUrl: exists("final.mp4") ? `/api/episodes/${req.params.id}/video` : null,
    thumbnailUrl: exists("thumbnail.jpg") ? `/api/episodes/${req.params.id}/thumbnail` : null,
    captionsUrl: exists("captions.vtt") ? `/api/episodes/${req.params.id}/captions` : null,
    artifacts: exists("real-provider-evidence.json") ? JSON.parse(readFileSync(join(dir, "real-provider-evidence.json"), "utf8")) : null,
  };
});

app.get<{ Params: { id: string } }>("/api/episodes/:id/video", async (req, reply) => {
  const p = join(artifactBaseDir(), req.params.id, "final.mp4");
  if (!existsSync(p)) return reply.code(404).send({ error: "video not ready" });
  return reply.type("video/mp4").send(await import("node:fs/promises").then((f) => f.readFile(p)));
});

app.get<{ Params: { id: string } }>("/api/episodes/:id/thumbnail", async (req, reply) => {
  const p = join(artifactBaseDir(), req.params.id, "thumbnail.jpg");
  if (!existsSync(p)) return reply.code(404).send({ error: "thumbnail not ready" });
  return reply.type("image/jpeg").send(await import("node:fs/promises").then((f) => f.readFile(p)));
});

app.get<{ Params: { id: string } }>("/api/episodes/:id/captions", async (req, reply) => {
  const p = join(artifactBaseDir(), req.params.id, "captions.vtt");
  if (!existsSync(p)) return reply.code(404).send({ error: "captions not ready" });
  return reply.type("text/vtt").send(readFileSync(p, "utf8"));
});

app.get<{ Params: { id: string } }>("/api/episodes/:id/captions.srt", async (req, reply) => {
  const p = join(artifactBaseDir(), req.params.id, "captions.srt");
  if (!existsSync(p)) return reply.code(404).send({ error: "captions not ready" });
  return reply.type("application/x-subrip").send(readFileSync(p, "utf8"));
});

const port = Number(process.env.PORT ?? 3001);

const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`[api] listening on :${port}`);
}

export { app };
