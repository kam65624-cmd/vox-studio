export interface MediaProbeResult {
  filePath: string;
  formatName: string;
  durationSeconds: number;
  sizeBytes: number;
  bitrateBps: number;
  videoStream?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
    aspectRatio: string;
  };
  audioStream?: {
    codec: string;
    sampleRate: number;
    channels: number;
    loudnessLufs?: number;
  };
}

export interface RenderProfile {
  name: "16:9" | "9:16" | "1:1" | "4:5";
  width: number;
  height: number;
  fps: number;
  videoBitrate: string;
  audioBitrate: string;
}

export const PROFILES: Record<string, RenderProfile> = {
  "16:9": {
    name: "16:9",
    width: 1920,
    height: 1080,
    fps: 30,
    videoBitrate: "10M",
    audioBitrate: "192k",
  },
  "9:16": {
    name: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    videoBitrate: "8M",
    audioBitrate: "192k",
  },
  "1:1": {
    name: "1:1",
    width: 1080,
    height: 1080,
    fps: 30,
    videoBitrate: "6M",
    audioBitrate: "192k",
  },
  "4:5": {
    name: "4:5",
    width: 1080,
    height: 1350,
    fps: 30,
    videoBitrate: "7M",
    audioBitrate: "192k",
  },
};

export function validateProbeResult(probe: MediaProbeResult): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (probe.durationSeconds <= 0) {
    errors.push("Duration must be greater than 0");
  }
  if (!probe.videoStream) {
    errors.push("Missing video stream");
  } else {
    if (probe.videoStream.width <= 0 || probe.videoStream.height <= 0) {
      errors.push("Invalid video dimensions");
    }
  }
  if (!probe.audioStream) {
    errors.push("Missing audio stream");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── P0-K Storage Layer & Artifact Integrity ────────────────────────────────

import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { ProductionAsset, GenerationProvenance } from "@vox/contracts";

export interface StoragePutResult {
  key: string;
  uri: string;
  checksum: string;
  sizeBytes: number;
}

export interface StoragePort {
  put(key: string, data: Buffer | string, mimeType?: string): Promise<StoragePutResult>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresSeconds?: number): Promise<string>;
  checksum(key: string): Promise<string>;
}

export class LocalStorageAdapter implements StoragePort {
  constructor(private baseDir: string = path.resolve(process.cwd(), "artifacts", "storage")) {}

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, "_");
    return path.join(this.baseDir, safeKey);
  }

  async put(key: string, data: Buffer | string, mimeType = "application/octet-stream"): Promise<StoragePutResult> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const filePath = this.getFilePath(key);
    await fs.writeFile(filePath, buffer);
    const checksum = createHash("sha256").update(buffer).digest("hex");

    return {
      key,
      uri: `file:///${filePath.replace(/\\/g, "/")}`,
      checksum,
      sizeBytes: buffer.length,
    };
  }

  async get(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return await fs.readFile(filePath);
  }

  async delete(key: string): Promise<boolean> {
    try {
      await fs.unlink(this.getFilePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.getFilePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    const filePath = this.getFilePath(key);
    return `file:///${filePath.replace(/\\/g, "/")}`;
  }

  async checksum(key: string): Promise<string> {
    const buf = await this.get(key);
    return createHash("sha256").update(buf).digest("hex");
  }
}

export class S3CompatibleAdapter implements StoragePort {
  constructor(
    private endpoint: string = "http://localhost:9000",
    private bucket: string = "vox-studio",
    private fallbackLocal: StoragePort = new LocalStorageAdapter()
  ) {}

  async put(key: string, data: Buffer | string, mimeType?: string): Promise<StoragePutResult> {
    return this.fallbackLocal.put(key, data, mimeType);
  }

  async get(key: string): Promise<Buffer> {
    return this.fallbackLocal.get(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.fallbackLocal.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.fallbackLocal.exists(key);
  }

  async getSignedUrl(key: string): Promise<string> {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async checksum(key: string): Promise<string> {
    return this.fallbackLocal.checksum(key);
  }
}

export class ArtifactRegistry {
  private assets = new Map<string, ProductionAsset>();

  constructor(private storage: StoragePort = new LocalStorageAdapter()) {}

  async registerArtifact(input: {
    episodeId: string;
    productionNodeId: string;
    assetType: ProductionAsset["assetType"];
    data: Buffer | string;
    mimeType: string;
    sceneId?: string;
    shotId?: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
    fps?: number;
    codec?: string;
    generationJobId?: string;
    modelId?: string;
    providerId?: string;
    provenance?: GenerationProvenance;
  }): Promise<ProductionAsset> {
    const key = `asset-${input.episodeId}-${input.productionNodeId}-${Date.now().toString(36)}`;
    const putRes = await this.storage.put(key, input.data, input.mimeType);

    const assetInput: any = {
      id: `passet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      episodeId: input.episodeId,
      productionNodeId: input.productionNodeId,
      assetType: input.assetType,
      status: "VALID" as const,
      uri: putRes.uri,
      storageKey: putRes.key,
      mimeType: input.mimeType,
      checksum: putRes.checksum,
      sizeBytes: putRes.sizeBytes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (input.sceneId !== undefined) assetInput.sceneId = input.sceneId;
    if (input.shotId !== undefined) assetInput.shotId = input.shotId;
    if (input.width !== undefined) assetInput.width = input.width;
    if (input.height !== undefined) assetInput.height = input.height;
    if (input.durationSeconds !== undefined) assetInput.durationSeconds = input.durationSeconds;
    if (input.fps !== undefined) assetInput.fps = input.fps;
    if (input.codec !== undefined) assetInput.codec = input.codec;
    if (input.generationJobId !== undefined) assetInput.generationJobId = input.generationJobId;
    if (input.modelId !== undefined) assetInput.modelId = input.modelId;
    if (input.providerId !== undefined) assetInput.providerId = input.providerId;
    if (input.provenance?.id !== undefined) assetInput.provenanceId = input.provenance.id;
    if (input.provenance?.creativeDnaVersion !== undefined) assetInput.creativeDnaVersion = input.provenance.creativeDnaVersion;
    if (input.provenance?.styleSkillVersion !== undefined) assetInput.styleSkillVersion = input.provenance.styleSkillVersion;

    const asset = assetInput as ProductionAsset;
    this.assets.set(asset.id, asset);
    return asset;
  }

  getAsset(id: string): ProductionAsset | undefined {
    return this.assets.get(id);
  }

  listAssetsByEpisode(episodeId: string): ProductionAsset[] {
    return Array.from(this.assets.values()).filter((a) => a.episodeId === episodeId);
  }
}
