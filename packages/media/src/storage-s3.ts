/**
 * MinIO / S3-Compatible Storage Adapter (P0-M Track M4)
 *
 * Implements StoragePort using @aws-sdk/client-s3 so it works with:
 *  - MinIO (local dev)         STORAGE_TYPE=minio
 *  - AWS S3 (production)       STORAGE_TYPE=s3
 *  - Cloudflare R2             STORAGE_TYPE=r2
 *
 * All credentials come from environment variables — never hardcoded.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "crypto";
import { Readable } from "stream";
import type { StoragePort, StoragePutResult } from "./index";

// ─── Config ──────────────────────────────────────────────────────────────────

export interface S3StorageConfig {
  endpoint: string;   // e.g. "http://localhost:9000" for MinIO, "https://s3.amazonaws.com" for AWS
  region: string;     // e.g. "us-east-1"
  bucket: string;     // e.g. "vox-studio"
  accessKey: string;
  secretKey: string;
  forcePathStyle?: boolean; // true for MinIO, false for AWS S3
  defaultSignedUrlExpirySeconds?: number;
}

export function getS3ConfigFromEnv(): S3StorageConfig {
  return {
    endpoint:       process.env["S3_ENDPOINT"]    ?? "http://localhost:9000",
    region:         process.env["S3_REGION"]      ?? "us-east-1",
    bucket:         process.env["S3_BUCKET"]      ?? "vox-studio",
    accessKey:      process.env["S3_ACCESS_KEY"]  ?? "",
    secretKey:      process.env["S3_SECRET_KEY"]  ?? "",
    // MinIO requires forcePathStyle; AWS S3 and R2 use virtual-hosted style
    forcePathStyle: (process.env["S3_FORCE_PATH_STYLE"] ?? "true") === "true",
    defaultSignedUrlExpirySeconds: parseInt(
      process.env["S3_SIGNED_URL_EXPIRY_SECONDS"] ?? "900",
      10,
    ),
  };
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class MinIOStorageAdapter implements StoragePort {
  private client: S3Client;
  private bucket: string;
  private expirySeconds: number;

  constructor(config?: S3StorageConfig) {
    const cfg = config ?? getS3ConfigFromEnv();
    this.bucket = cfg.bucket;
    this.expirySeconds = cfg.defaultSignedUrlExpirySeconds ?? 900;

    this.client = new S3Client({
      endpoint:        cfg.endpoint,
      region:          cfg.region,
      forcePathStyle:  cfg.forcePathStyle ?? true,
      credentials: {
        accessKeyId:     cfg.accessKey,
        secretAccessKey: cfg.secretKey,
      },
    });
  }

  // ── put ──────────────────────────────────────────────────────────────────

  async put(
    key: string,
    data: Buffer | string,
    mimeType = "application/octet-stream",
  ): Promise<StoragePutResult> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const checksum = createHash("sha256").update(buffer).digest("hex");

    await this.client.send(
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         key,
        Body:        buffer,
        ContentType: mimeType,
        Metadata:    { "x-vox-checksum": checksum },
      }),
    );

    return {
      key,
      uri:       `s3://${this.bucket}/${key}`,
      checksum,
      sizeBytes: buffer.length,
    };
  }

  // ── get ──────────────────────────────────────────────────────────────────

  async get(key: string): Promise<Buffer> {
    const resp = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!resp.Body) {
      throw new Error(`[S3Storage] Empty body for key: ${key}`);
    }

    // resp.Body is a ReadableStream (Web) or Readable (Node) depending on environment
    const stream = resp.Body as Readable;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end",  () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  // ── delete ───────────────────────────────────────────────────────────────

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  // ── exists ───────────────────────────────────────────────────────────────

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  // ── getSignedUrl ─────────────────────────────────────────────────────────

  async getSignedUrl(key: string, expiresSeconds?: number): Promise<string> {
    const expiry = expiresSeconds ?? this.expirySeconds;
    return awsGetSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiry },
    );
  }

  // ── checksum ─────────────────────────────────────────────────────────────

  async checksum(key: string): Promise<string> {
    const buf = await this.get(key);
    return createHash("sha256").update(buf).digest("hex");
  }

  // ── list (bonus — not in StoragePort interface but useful) ───────────────

  async list(prefix: string): Promise<string[]> {
    const resp = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      }),
    );
    return (resp.Contents ?? []).map((obj) => obj.Key ?? "").filter(Boolean);
  }

  /** Returns the underlying S3Client for advanced use. */
  getClient(): S3Client {
    return this.client;
  }

  getBucket(): string {
    return this.bucket;
  }
}
