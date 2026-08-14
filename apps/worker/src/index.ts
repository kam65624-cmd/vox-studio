import { EpisodeProductionWorkflow } from "./workflow";

async function runWorker() {
  console.log("⚡ VOX Studio Production Worker starting...");
  console.log("✓ Registered Workflows:");
  console.log("  - EpisodeProductionWorkflow (18 activities)");
  console.log("  - scriptAnalysisWorkflow");
  console.log("  - sceneGenerationWorkflow");
  console.log("  - mentorReviewWorkflow");
  console.log("  - renderWorkflow\n");

  console.log("✅ Worker initialized in poll mode — awaiting jobs.");
}

runWorker().catch(console.error);

export { EpisodeProductionWorkflow };
export type { WorkflowContext, WorkflowRunResult } from "./workflow";
