import { describe, expect, it } from "vitest";
import { ModelRouter, RouterGateError } from "./router.js";
import { getRegistry } from "./registry.js";

describe("ModelRouter (mock mode)", () => {
  const router = new ModelRouter({ mode: "mock" });

  it("selects only mock providers", () => {
    const text = router.select("TEXT");
    expect(text.length).toBeGreaterThan(0);
    expect(text.every((p) => p.isMock)).toBe(true);
  });

  it("runs deterministic mock text", async () => {
    const { result, runs } = await router.runText("ignored");
    expect(result.text.length).toBeGreaterThan(0);
    expect(runs.at(-1)?.status).toBe("succeeded");
  });

  it("runs a decodable mock voice clip", async () => {
    const { result, runs } = await router.runVoice("hello", "ar");
    expect(result.sizeBytes).toBeGreaterThan(100);
    expect(runs.at(-1)?.status).toBe("succeeded");
  }, 30_000);
});

describe("ModelRouter (real mode)", () => {
  const router = new ModelRouter({ mode: "real" });

  it("never selects mock providers in real mode", () => {
    for (const cap of ["TEXT", "VOICE", "IMAGE", "VIDEO"] as const) {
      expect(router.select(cap).every((p) => !p.isMock)).toBe(true);
    }
  });

  it("reports configured vs blocked providers per capability", () => {
    const summary = router.realProviderSummary();
    for (const cap of ["TEXT", "VOICE", "IMAGE", "VIDEO"] as const) {
      expect(summary[cap].length).toBeGreaterThan(0);
    }
  });
});

describe("ModelRouter (auto mode)", () => {
  it("falls back to real providers when none are configured for VIDEO", async () => {
    const router = new ModelRouter({ mode: "auto" });
    const err = await router.runVideo("a prompt").catch((e) => e);
    expect(err).toBeInstanceOf(RouterGateError);
    const runs = (err as RouterGateError).runs;
    expect(runs.every((r) => r.status === "blocked" || r.status === "failed")).toBe(true);
  });
});

describe("getRegistry", () => {
  it("builds independent mock and real registries", () => {
    const mock = getRegistry("mock");
    const real = getRegistry("real");
    expect(mock.text()).not.toBe(real.text());
  });
});
