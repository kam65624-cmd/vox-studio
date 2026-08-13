import { describe, expect, it } from "vitest";
import { detectContainer, hasMagicBytes, looksLikeHtml, looksLikeJson, validateBinary } from "./validate.js";

describe("hasMagicBytes", () => {
  it("detects a prefix signature", () => {
    expect(hasMagicBytes(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
    expect(hasMagicBytes(Buffer.from([0x00, 0x01]), Buffer.from([0xff, 0xd8]))).toBe(false);
  });
});

describe("detectContainer", () => {
  it("recognizes PNG, JPEG, MP4, WebM and MP3 by magic bytes", () => {
    expect(detectContainer(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe("image/png");
    expect(detectContainer(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectContainer(Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]))).toBe("video/mp4");
    expect(detectContainer(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01]))).toBe("video/webm");
  });

  it("detects an HTML error page", () => {
    expect(detectContainer(Buffer.from("<!doctype html><html><body>error</body></html>"))).toBe("text/html");
    expect(detectContainer(Buffer.from("<html><head><title>Bad Gateway</title></head></html>"))).toBe("text/html");
  });

  it("detects a JSON error payload", () => {
    expect(detectContainer(Buffer.from('{"error":"unauthorized"}'))).toBe("application/json");
  });
});

describe("looksLikeHtml / looksLikeJson", () => {
  it("classifies hostile payloads", () => {
    expect(looksLikeHtml(Buffer.from("<html>oops</html>"))).toBe(true);
    expect(looksLikeJson(Buffer.from('{"ok":false}'))).toBe(true);
    expect(looksLikeJson(Buffer.from("not json"))).toBe(false);
  });
});

describe("validateBinary", () => {
  it("rejects an HTML error page instead of pretending it is media", async () => {
    const res = await validateBinary(Buffer.from("<html>502 Bad Gateway</html>"), "image");
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("HTML"))).toBe(true);
  });

  it("rejects a JSON error payload", async () => {
    const res = await validateBinary(Buffer.from('{"detail":"forbidden"}'), "image");
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("JSON"))).toBe(true);
  });

  it("rejects an empty buffer", async () => {
    const res = await validateBinary(Buffer.alloc(0), "audio");
    expect(res.ok).toBe(false);
    expect(res.errors).toContain("empty buffer");
  });

  it("rejects a real PNG when audio is expected", async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(5000, 0)]);
    const res = await validateBinary(png, "audio");
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("mismatch"))).toBe(true);
  });
});
