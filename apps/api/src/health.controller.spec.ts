import { describe, it, expect } from "vitest";
import { HealthController } from "./modules/health/health.controller";

describe("HealthController", () => {
  it("should return ok status", () => {
    const controller = new HealthController();
    const result = controller.checkHealth();
    expect(result.status).toBe("ok");
    expect(result.service).toBe("vox-studio-api");
  });
});
