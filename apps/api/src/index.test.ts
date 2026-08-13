import { describe, expect, it, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = (await import("./index.js")).app;
  await app.ready();
});

describe("HTTP API surface", () => {
  it("serves /api/health with runtime mode", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(["mock", "auto", "real"]).toContain(body.runtimeMode);
  });

  it("rejects a project with an empty name before touching storage", async () => {
    const res = await app.inject({ method: "POST", url: "/api/projects", payload: { name: "   " } });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await app.inject({ method: "GET", url: "/api/does-not-exist" });
    expect(res.statusCode).toBe(404);
  });
});
