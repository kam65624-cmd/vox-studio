import { createHash } from "node:crypto";
import { resolve } from "node:path";
import type { ArtifactRecord, Capability, MediaType } from "@vox/contracts";
import { artifactRegistry, detectMediaType, storage, sha256Hex } from "@vox/storage";
import { validateBinary, type ValidationKind } from "./validate.js";

export interface DownloadInput {
  episodeId: string;
  kind: string;
  capability: Capability;
  provider: string;
  model: string;
  requestId?: string;
  buffer?: Buffer;
  url?: string;
  mimeType?: string;
  fileName?: string;
  metadata?: Record<string, unknown>;
}

export interface DownloadResult {
  artifact: ArtifactRecord;
  validation: { ok: boolean; errors: string[]; detected: string; probe?: Record<string, unknown> };
}

/**
 * Persists a real media buffer:
 * validate binary -> sha256 -> storage.put -> ArtifactRegistry.register
 * Rejects empty / tiny / HTML / JSON / fake-header payloads.
 */
export async function downloadAndStore(input: DownloadInput): Promise<DownloadResult> {
  let buffer = input.buffer;
  if (!buffer && input.url) {
    buffer = await httpGet(input.url);
  }
  if (!buffer) throw new Error(`downloadAndStore: no buffer and no resolvable URL for ${input.provider}`);
  if (input.url && !input.buffer) {
    const head = buffer.subarray(0, 4096).toString("utf8").toLowerCase();
    if (head.includes("<html") || head.includes("<!doctype") || head.trimStart().startsWith("{")) {
      throw new Error(`${input.provider} output URL returned non-media content`);
    }
  }

  const expected: ValidationKind = input.capability === "IMAGE" ? "image" : input.capability === "VOICE" ? "audio" : input.capability === "VIDEO" ? "video" : "auto";
  const validation = await validateBinary(buffer, expected);
  if (!validation.ok) {
    throw new Error(`media validation failed for ${input.provider}/${input.model}: ${validation.errors.join("; ")}`);
  }

  const sha256 = sha256Hex(buffer);
  const ext = extFor(input.mimeType ?? validation.detected, input.fileName);
  const key = `${input.episodeId}/assets/${input.kind}-${sha256.slice(0, 16)}${ext}`;
  const put = await storage.put(key, buffer, { mimeType: input.mimeType ?? validation.detected });
  const mediaType: MediaType = detectMediaType(input.mimeType ?? validation.detected, input.fileName ?? key);

  const artifact: ArtifactRecord = {
    id: `art_${sha256.slice(0, 24)}`,
    kind: input.kind,
    mediaType,
    provider: input.provider,
    model: input.model,
    capability: input.capability,
    requestId: input.requestId,
    sourceUrl: input.url,
    storageKey: key,
    fileName: key.split("/").pop() ?? key,
    sizeBytes: put.sizeBytes,
    sha256,
    mimeType: input.mimeType ?? validation.detected,
    createdAt: new Date().toISOString(),
    metadata: { ...(input.metadata ?? {}), filePath: storage.pathFor(key) },
  };
  await artifactRegistry.register(artifact);
  return { artifact, validation };
}

function extFor(mime: string, fileName?: string): string {
  if (fileName && fileName.includes(".")) return fileName.slice(fileName.lastIndexOf("."));
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  if (mime.includes("wav")) return ".wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return ".mp3";
  if (mime.includes("m4a")) return ".m4a";
  if (mime.includes("mp4")) return ".mp4";
  if (mime.includes("webm")) return ".webm";
  return ".bin";
}

export async function httpGet(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120000), headers: { Accept: "*/*" } });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url.slice(0, 160)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error(`empty body for ${url.slice(0, 160)}`);
  return buf;
}

export function absoluteMediaPath(key: string): string {
  const p = storage.pathFor(key);
  return resolve(p);
}
