import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { env, resolveRepo } from "@vox/config";
import type { ArtifactRecord, MediaType } from "@vox/contracts";

export interface StoragePort {
  put(key: string, data: Buffer, opts?: { mimeType?: string }): Promise<{ key: string; sizeBytes: number; sha256: string }>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  pathFor(key: string): string;
  delete(key: string): Promise<void>;
}

export function sha256Hex(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function detectMediaType(mime: string | undefined, fileName: string): MediaType {
  const f = fileName.toLowerCase();
  const m = (mime ?? "").toLowerCase();
  if (/image\//.test(m) || /\.(png|jpe?g|webp|gif|bmp)$/.test(f)) return "image";
  if (/audio\//.test(m) || /\.(mp3|wav|m4a|aac|ogg|flac)$/.test(f)) return "audio";
  if (/video\//.test(m) || /\.(mp4|mov|webm|mkv)$/.test(f)) return "video";
  if (/\.(srt|vtt)$/.test(f)) return "captions";
  if (/\.json$/.test(f)) return "json";
  return "other";
}

export class LocalStorage implements StoragePort {
  constructor(private readonly root = resolveRepo(env.STORAGE_ROOT)) {}

  private fullPath(key: string): string {
    return resolve(this.root, key);
  }

  async put(key: string, data: Buffer, opts?: { mimeType?: string }): Promise<{ key: string; sizeBytes: number; sha256: string }> {
    const fp = this.fullPath(key);
    await mkdir(dirname(fp), { recursive: true });
    await writeFile(fp, data);
    return { key, sizeBytes: data.length, sha256: sha256Hex(data) };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.fullPath(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.fullPath(key));
      return true;
    } catch {
      return false;
    }
  }

  pathFor(key: string): string {
    return this.fullPath(key);
  }

  async delete(key: string): Promise<void> {
    // Move to a .trash marker instead of hard deletion (non-destructive principle)
    const fp = this.fullPath(key);
    const trash = `${fp}.trashed`;
    try {
      await rename(fp, trash);
    } catch {
      // ignore missing
    }
  }

  async list(): Promise<string[]> {
    const out: string[] = [];
    await this.walk(this.root, out);
    return out;
  }

  private async walk(dir: string, acc: string[]): Promise<void> {
    let entries: string[] = [];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      const fp = join(dir, e);
      const s = await stat(fp).catch(() => null);
      if (!s) continue;
      if (s.isDirectory()) await this.walk(fp, acc);
      else acc.push(fp);
    }
  }
}

export const storage: StoragePort = new LocalStorage();

// ─── Artifact Registry ───────────────────────────────────────────────────────

export class ArtifactRegistry {
  private records: ArtifactRecord[] = [];

  constructor(private readonly file: string) {}

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.file, "utf8");
      this.records = JSON.parse(raw) as ArtifactRecord[];
    } catch {
      this.records = [];
    }
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(this.records, null, 2), "utf8");
  }

  async register(record: ArtifactRecord): Promise<ArtifactRecord> {
    this.records.push(record);
    await this.save();
    return record;
  }

  list(): ArtifactRecord[] {
    return [...this.records];
  }

  get(id: string): ArtifactRecord | undefined {
    return this.records.find((r) => r.id === id);
  }
}

export const artifactRegistry = new ArtifactRegistry(
  resolveRepo(env.ARTIFACTS_DIR, "artifact-registry.json"),
);
