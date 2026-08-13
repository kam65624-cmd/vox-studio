import { describe, expect, it } from "vitest";
import { prisma } from "./index.js";

describe("prisma client", () => {
  it("exports a configured PrismaClient", () => {
    expect(prisma).toBeDefined();
    expect(prisma.project).toBeDefined();
    expect(prisma.episode).toBeDefined();
    expect(prisma.production).toBeDefined();
  });
});
