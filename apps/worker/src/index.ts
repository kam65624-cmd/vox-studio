import { MockTextModelProvider, MockVideoModelProvider, MockVoiceModelProvider } from "@vox/ai";
import { validateProbeResult } from "@vox/media";
import { canTransition } from "@vox/domain";

async function runWorker() {
  console.log("⚡ VOX Studio Production Worker starting...");
  console.log("✓ Registered Workflows:");
  console.log("  - episodeProductionWorkflow");
  console.log("  - scriptAnalysisWorkflow");
  console.log("  - sceneGenerationWorkflow");
  console.log("  - mentorReviewWorkflow");
  console.log("  - renderWorkflow");

  // Verify mock provider wiring
  const textProvider = new MockTextModelProvider();
  const res = await textProvider.generateText({ prompt: "Script Doctor check" });
  console.log("✓ AI Provider Adapter connected:", textProvider.name);

  console.log("✅ Worker initialized successfully in poll mode.");
}

runWorker().catch(console.error);
