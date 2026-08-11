import { describe, it, expect } from "vitest";
import { EpisodeProductionWorkflow } from "./workflow";

describe("K12 E2E Mock Production Test", () => {
  it("should execute the full 18-step production workflow successfully in mock mode", async () => {
    // 1. Initialize the workflow engine in mock mode
    const workflow = new EpisodeProductionWorkflow({
      episodeId: "ep-e2e-test",
      runtimeMode: "mock",
      outputDir: "./artifacts/test-output",
    });

    // 2. Execute the workflow
    const result = await workflow.run();

    // 3. Verify workflow completed successfully
    expect(result.success).toBe(true);
    expect(result.finalState).toBe("COMPLETED");
    expect(result.errors).toHaveLength(0);

    // 4. Verify all 18 activities were executed
    expect(result.activities.length).toBe(18);
    expect(result.activities[0]?.activity).toBe("01_LOAD_EPISODE");
    expect(result.activities[17]?.activity).toBe("18_RECORD_COMPLETION");

    // 5. Verify all activities succeeded
    for (const act of result.activities) {
      expect(act.success).toBe(true);
    }

    // 6. Verify outputs were captured
    expect(result.outputMp4).toBeDefined();
    expect(result.outputMp4).toContain("episode-ep-e2e-test.mp4");
    expect(result.qualityScore).toBeGreaterThan(0);
    expect(result.totalDurationMs).toBeGreaterThan(0);
  });
});
