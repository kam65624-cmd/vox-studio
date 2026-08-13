import { describe, expect, it, beforeEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStorage, sha256Hex, detectMediaType, ArtifactRegistry } from "./index.js";

describe("sha256Hex", () => {
  it("matches a known SHA-256 digest", () => {
    expect(sha256Hex(Buffer.from("hello"))).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});

describe("detectMediaType", () => {
  it("detects by mime type", () => {
    expect(detectMediaType("image/png", "x.bin")).toBe("image");
    expect(detectMediaType("audio/mpeg", "x.bin")).toBe("audio");
  });

  it("detects by file extension", () => {
    expect(detectMediaType(undefined, "clip.mp4")).toBe("video");
    expect(detectMediaType(undefined, "subs.srt")).toBe("captions");
    expect(detectMediaType(undefined, "meta.json")).toBe("json");
  });
});

describe("LocalStorage", () => {
  const root = join(tmpdir(), `vox-storage-test-${Date.now()}`);
  const store = new LocalStorage(root);

  beforeEach(() => {
    store.delete("media/a.png");
  });

  it("round-trips put/get with integrity metadata", async () => {
    const data = Buffer.from("payload-bytes-123");
    const put = await store.put("media/a.png", data, { mimeType: "image/png" });
    expect(put.sha256).toBe(sha256Hex(data));
    expect(put.sizeBytes).toBe(data.length);

    const got = await store.get("media/a.png");
    expect(got.toString("utf8")).toBe("payload-bytes-123");

    expect(await store.exists("media/a.png")).toBe(true);
    expect(await store.exists("media/missing.png")).toBe(false);
  });
});

describe("ArtifactRegistry", () => {
  it("persists and loads artifact records", async () => {
    const file = join(tmpdir(), `vox-registry-test-${Date.now()}.json`);
    const reg = new ArtifactRegistry(file);
    const rec = {
      id: "art_1",
      kind: "voice",
      mediaType: "audio",
      provider: "elevenlabs",
      model: "eleven_multilingual_v2",
      capability: "VOICE",
      storageKey: "ep_1/voice_0.mp3",
      fileName: "voice_0.mp3",
      sizeBytes: 1234,
      sha256: "abc",
      mimeType: "audio/mpeg",
      createdAt: new Date().toISOString(),
      metadata: {},
    } as const;
    await reg.register(rec);

    const reg2 = new ArtifactRegistry(file);
    await reg2.load();
    expect(reg2.get("art_1")?.provider).toBe("elevenlabs");
    expect(reg2.list()).toHaveLength(1);
  });
});
