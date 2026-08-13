import { describe, expect, it } from "vitest";
import { secretMask, providerSummary, resolveRepo, repoRoot } from "./index.js";

describe("secretMask", () => {
  it("masks short secrets entirely", () => {
    expect(secretMask("abc")).toBe("***");
  });

  it("keeps only the outer 4 characters for long secrets", () => {
    const masked = secretMask("abcdefghijklmnop");
    expect(masked.startsWith("abcd")).toBe(true);
    expect(masked.endsWith("mnop")).toBe(true);
    expect(masked).not.toContain("efghijkl");
  });

  it("returns empty for undefined", () => {
    expect(secretMask(undefined)).toBe("");
  });
});

describe("providerSummary", () => {
  it("reports a runtime mode without leaking key values", () => {
    const s = providerSummary();
    expect(typeof s.runtimeMode).toBe("string");
    const values = Object.values(s);
    for (const v of values) {
      expect(v).not.toMatch(/nvapi-[A-Za-z0-9]{10,}/);
      expect(v).not.toMatch(/sk_[A-Za-z0-9]{10,}/);
    }
  });
});

describe("resolveRepo", () => {
  it("resolves a nested path against the repo root", () => {
    const p = resolveRepo("apps", "worker", "artifacts");
    expect(p).toBe(`${repoRoot()}/apps/worker/artifacts`);
  });
});
