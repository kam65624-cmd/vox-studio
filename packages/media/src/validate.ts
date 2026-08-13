import { ffprobeJson } from "./ffprobe.js";

export type ValidationKind = "image" | "audio" | "video" | "auto";

export interface ValidationResult {
  ok: boolean;
  kind: ValidationKind | "auto";
  detected: string;
  sizeBytes: number;
  errors: string[];
  probe?: Record<string, unknown>;
}

export const MIN_SIZE = { image: 4096, audio: 1024, video: 50_000 } as const;

export function hasMagicBytes(buf: Buffer, sig: Buffer): boolean {
  if (buf.length < sig.length) return false;
  return buf.subarray(0, sig.length).equals(sig);
}

export function detectContainer(buf: Buffer): string {
  if (hasMagicBytes(buf, Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return "image/png";
  if (hasMagicBytes(buf, Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (hasMagicBytes(buf, Buffer.from("RIFF")) && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (hasMagicBytes(buf, Buffer.from("GIF8"))) return "image/gif";
  if (hasMagicBytes(buf, Buffer.from("RIFF")) && buf.subarray(8, 12).toString("ascii") === "WAVE") return "audio/wav";
  if (buf.length > 3 && buf.subarray(0, 3).toString("ascii") === "ID3") return "audio/mpeg";
  if (buf.length > 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return "audio/mpeg";
  if (buf.length > 8 && buf.subarray(4, 8).toString("ascii") === "ftyp") return "video/mp4";
  if (hasMagicBytes(buf, Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  const head = buf.subarray(0, 2048).toString("utf8").toLowerCase();
  if (head.includes("<html") || head.includes("<!doctype")) return "text/html";
  if (head.trimStart().startsWith("{") || head.trimStart().startsWith("[")) return "application/json";
  if (head.trimStart().startsWith("error") || head.trimStart().startsWith("failed")) return "text/plain";
  return "unknown";
}

export function looksLikeHtml(buf: Buffer): boolean {
  const head = buf.subarray(0, 4096).toString("utf8").toLowerCase();
  return head.includes("<html") || head.includes("<!doctype");
}

export function looksLikeJson(buf: Buffer): boolean {
  const head = buf.subarray(0, 4096).toString("utf8").trimStart();
  return head.startsWith("{") || head.startsWith("[");
}

export async function validateBinary(buf: Buffer, expected: ValidationKind): Promise<ValidationResult> {
  const errors: string[] = [];
  const detected = detectContainer(buf);
  const result: ValidationResult = {
    ok: true,
    kind: expected,
    detected,
    sizeBytes: buf.length,
    errors,
  };

  if (buf.length === 0) errors.push("empty buffer");
  if (looksLikeHtml(buf)) errors.push("HTML response received instead of media");
  if (looksLikeJson(buf)) errors.push("JSON response received instead of media");

  const minFor = (expected === "auto" ? detected : expected) as keyof typeof MIN_SIZE;
  if (buf.length < MIN_SIZE[minFor] && buf.length < 10_000) {
    errors.push(`binary suspiciously small (${buf.length} bytes)`);
  }

  const kindOf = (mime: string): ValidationKind => (mime.startsWith("image/") ? "image" : mime.startsWith("audio/") ? "audio" : mime.startsWith("video/") ? "video" : "auto");

  if (expected !== "auto" && kindOf(detected) !== expected) {
    errors.push(`container mismatch: expected ${expected}, detected ${detected}`);
  }

  if (errors.length === 0) {
    try {
      const probe = await ffprobeJson(tmpWrite(buf));
      result.probe = probe as unknown as Record<string, unknown>;
      const streamTypes = (probe.streams ?? []).map((s) => s.codec_type);
      if (expected === "image" && !streamTypes.includes("video")) errors.push("not a decodable image");
      if (expected === "audio" && !streamTypes.includes("audio")) errors.push("not a decodable audio");
      if (expected === "video" && !streamTypes.includes("video")) errors.push("not a decodable video");
    } catch (e) {
      errors.push(`ffprobe failed: ${(e as Error).message}`);
    }
  }

  result.ok = errors.length === 0;
  return result;
}

import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function tmpWrite(buf: Buffer): string {
  const p = join(tmpdir(), `vox-validate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.bin`);
  writeFileSync(p, buf);
  return p;
}
