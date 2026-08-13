import { z } from "zod";
import dotenv from "dotenv";

try {
  dotenv.config();
} catch {
  // .env is optional
}

export function secretMask(v: string | undefined): string {
  if (!v) return "";
  if (v.length <= 8) return "***";
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  APP_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:3001"),

  DATABASE_URL: z.string().default("postgresql://postgres:password@localhost:5432/vox_studio"),

  TEMPORAL_ADDRESS: z.string().default("localhost:7233"),
  TEMPORAL_NAMESPACE: z.string().default("vox-studio"),

  VOX_RUNTIME_MODE: z.enum(["mock", "auto", "real"]).default("auto"),

  // NVIDIA NIM (text)
  NVIDIA_BASE_URL: z.string().default("https://integrate.api.nvidia.com/v1"),
  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_MUSE_API_KEY: z.string().optional(),
  NVIDIA_MUSE_MODEL: z.string().default("meta/muse-glimmer-30b"),
  NVIDIA_GLM_API_KEY: z.string().optional(),
  NVIDIA_GLM_MODEL: z.string().default("z-ai/glm-5.2"),
  NVIDIA_QWEN_API_KEY: z.string().optional(),
  NVIDIA_QWEN_MODEL: z.string().default("qwen/qwen-image-edit"),
  NVIDIA_TIMEOUT_MS: z.coerce.number().default(60000),
  NVIDIA_MAX_RETRIES: z.coerce.number().default(2),

  // ElevenLabs (voice)
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_BASE_URL: z.string().default("https://api.elevenlabs.io"),

  // Replicate (image/video, optional)
  REPLICATE_API_TOKEN: z.string().optional(),
  REPLICATE_BASE_URL: z.string().default("https://api.replicate.com/v1"),

  // Storage
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_ROOT: z.string().default("apps/worker/storage"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("vox-studio"),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  // Artifacts evidence directory
  ARTIFACTS_DIR: z.string().default("apps/worker/artifacts"),

  ENABLE_MOCK_PROVIDERS: z.string().default("true"),
  ENABLE_COST_TRACKING: z.string().default("true"),
});

export type VoxEnv = z.infer<typeof EnvSchema>;

function load(): VoxEnv {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Environment validation failed: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  return parsed.data;
}

export const env: VoxEnv = load();

export function providerSummary(): Record<string, string> {
  return {
    runtimeMode: env.VOX_RUNTIME_MODE,
    nvidiaText: env.NVIDIA_GLM_API_KEY ? `configured (${secretMask(env.NVIDIA_GLM_API_KEY)})` : "missing",
    nvidiaMuse: env.NVIDIA_MUSE_API_KEY ? `configured (${secretMask(env.NVIDIA_MUSE_API_KEY)})` : "missing",
    nvidiaQwen: env.NVIDIA_QWEN_API_KEY ? `configured (${secretMask(env.NVIDIA_QWEN_API_KEY)})` : "missing",
    elevenlabs: env.ELEVENLABS_API_KEY ? `configured (${secretMask(env.ELEVENLABS_API_KEY)})` : "missing",
    replicate: env.REPLICATE_API_TOKEN ? "configured" : "missing",
    storageDriver: env.STORAGE_DRIVER,
  };
}

export function hasSecret(v: string | undefined): boolean {
  return !!v && v.trim().length > 0;
}

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export function resolveRepo(...parts: string[]): string {
  return resolve(repoRoot(), ...parts);
}

export function redact(input: string): string {
  return input
    .replace(/nvapi-[A-Za-z0-9_-]+/g, "nvapi-***")
    .replace(/sk_[A-Za-z0-9]+/g, "sk-***")
    .replace(/(Bearer\s+)\S+/gi, "$1***")
    .replace(/(xi-api-key:\s*)\S+/gi, "$1***")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***");
}
