/**
 * Storage Factory (P0-M Track M4)
 *
 * Creates the correct StoragePort implementation based on STORAGE_TYPE env var.
 * This keeps VOX storage-agnostic — swap backends without touching business logic.
 *
 * Supported targets:
 *   local  → LocalStorageAdapter  (default, dev)
 *   minio  → MinIOStorageAdapter  (local dev with MinIO docker)
 *   s3     → MinIOStorageAdapter  (AWS S3)
 *   r2     → MinIOStorageAdapter  (Cloudflare R2 — S3-compatible)
 */

import { LocalStorageAdapter, type StoragePort } from "./index";
import { MinIOStorageAdapter, getS3ConfigFromEnv, type S3StorageConfig } from "./storage-s3";
import path from "path";

export type StorageBackend = "local" | "minio" | "s3" | "r2";

export interface StorageFactoryConfig {
  type?: StorageBackend;
  localBasePath?: string;
  s3Config?: Partial<S3StorageConfig>;
}

/**
 * Creates a StoragePort instance for the specified backend.
 *
 * Uses STORAGE_TYPE env var if type not specified.
 * Falls back to "local" if nothing is configured.
 */
export function createStorageAdapter(config?: StorageFactoryConfig): StoragePort {
  const backend = (
    config?.type ??
    (process.env["STORAGE_TYPE"] as StorageBackend | undefined) ??
    "local"
  );

  switch (backend) {
    case "minio":
    case "s3":
    case "r2": {
      const baseConfig = getS3ConfigFromEnv();
      // R2 needs forcePathStyle=false (virtual-hosted) + its own endpoint
      const r2Override: Partial<S3StorageConfig> =
        backend === "r2" ? { forcePathStyle: false } : {};

      return new MinIOStorageAdapter({
        ...baseConfig,
        ...r2Override,
        ...config?.s3Config,
      });
    }

    case "local":
    default: {
      const basePath =
        config?.localBasePath ??
        process.env["LOCAL_STORAGE_PATH"] ??
        path.resolve(process.cwd(), "artifacts", "storage");

      return new LocalStorageAdapter(basePath);
    }
  }
}

/**
 * Returns the default storage adapter for the current environment.
 * Singleton-friendly: call once at app startup.
 */
export function getDefaultStorageAdapter(): StoragePort {
  return createStorageAdapter();
}

export { MinIOStorageAdapter, getS3ConfigFromEnv };
export type { S3StorageConfig };
