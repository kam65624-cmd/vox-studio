/**
 * AssetDownloader Unit Tests (P0-N Track N9)
 */

import { describe, it, expect, vi } from "vitest";
import { AssetDownloader } from "./asset-downloader";
import { LocalStorageAdapter } from "./index";
import path from "path";
import fs from "fs/promises";

describe("AssetDownloader (P0-N Track N4 & N9)", () => {
  const tmpDir = path.resolve(process.cwd(), "artifacts", "test-downloader");
  const storage = new LocalStorageAdapter(tmpDir);
  const downloader = new AssetDownloader(storage);

  it("1. ingests raw Buffer and computes SHA-256 checksum", async () => {
    const rawData = Buffer.from("test-binary-data-stream");
    const result = await downloader.downloadAndIngest({
      episodeId: "ep-dl-01",
      productionNodeId: "node-shot-01",
      source: rawData,
      defaultMimeType: "image/png",
    });

    expect(result.sizeBytes).toBe(rawData.length);
    expect(result.mimeType).toBe("image/png");
    expect(result.checksum).toHaveLength(64); // sha256 hex length
    expect(result.storageKey).toBeTruthy();
  });

  it("2. ingests base64 data URI", async () => {
    const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const result = await downloader.downloadAndIngest({
      episodeId: "ep-dl-02",
      productionNodeId: "node-shot-02",
      source: base64Data,
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it("3. downloads asset from remote HTTP URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "video/mp4" }),
      arrayBuffer: async () => Buffer.from("mock-remote-mp4-data").buffer,
    } as unknown as Response);

    const result = await downloader.downloadAndIngest({
      episodeId: "ep-dl-03",
      productionNodeId: "node-shot-03",
      source: "https://cdn.example.com/generated-video.mp4",
      fetchFn: mockFetch as any,
    });

    expect(result.mimeType).toBe("video/mp4");
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it("4. throws error when remote HTTP URL returns 404", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(
      downloader.downloadAndIngest({
        episodeId: "ep-dl-04",
        productionNodeId: "node-shot-04",
        source: "https://cdn.example.com/not-found.mp4",
        fetchFn: mockFetch as any,
      }),
    ).rejects.toThrow("Remote URL returned HTTP 404");
  });

  it("5. throws error when downloaded buffer is 0 bytes", async () => {
    await expect(
      downloader.downloadAndIngest({
        episodeId: "ep-dl-05",
        productionNodeId: "node-shot-05",
        source: Buffer.alloc(0),
      }),
    ).rejects.toThrow("Downloaded asset is empty (0 bytes)");
  });
});
