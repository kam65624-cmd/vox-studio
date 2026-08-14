/**
 * VOX Studio — Deterministic Temporal Workflow Definition (P0-M.2 Track M1)
 *
 * Strictly follows Temporal Workflow Rules:
 *   - 100% Deterministic execution
 *   - NO direct HTTP requests
 *   - NO direct filesystem access
 *   - NO database operations
 *   - NO secrets or process.env reads
 *   - ALL side-effects executed via Activity Proxies
 *
 * Orchestrates the 18-step VOX Production Lifecycle.
 */

import { proxyActivities, ApplicationFailure } from "@temporalio/workflow";
import type { activities } from "./activities";

// ─── Activity Proxy Configurations ───────────────────────────────────────────

/** Fast Read / Small Compute (01_LOAD_EPISODE, 02_BUILD_PLAN, 04_VALIDATE, 06..08_ASSEMBLE, 10..14, 18) */
const standardActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
  heartbeatTimeout: "30 seconds",
  retry: {
    initialInterval: "1 second",
    backoffCoefficient: 2.0,
    maximumInterval: "30 seconds",
    maximumAttempts: 5,
    nonRetryableErrorTypes: [
      "AUTH_ERROR",
      "INVALID_REQUEST",
      "CONTENT_POLICY",
      "PERMANENT",
    ],
  },
});

/** AI Generation (03_GENERATE_ASSETS, 09_GENERATE_AUDIO) */
const aiActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  heartbeatTimeout: "30 seconds",
  retry: {
    initialInterval: "2 seconds",
    backoffCoefficient: 2.0,
    maximumInterval: "1 minute",
    maximumAttempts: 5,
    nonRetryableErrorTypes: [
      "AUTH_ERROR",
      "INVALID_REQUEST",
      "CONTENT_POLICY",
      "PERMANENT",
    ],
  },
});

/** Heavy Media Operations (15_FINAL_RENDER, 16_THUMBNAILS, 17_FINAL_QA) */
const renderActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 minutes",
  heartbeatTimeout: "1 minute",
  retry: {
    initialInterval: "3 seconds",
    backoffCoefficient: 2.0,
    maximumInterval: "2 minutes",
    maximumAttempts: 3,
    nonRetryableErrorTypes: [
      "AUTH_ERROR",
      "INVALID_REQUEST",
      "PERMANENT",
    ],
  },
});

// ─── Main Workflow Function ───────────────────────────────────────────────────

export interface EpisodeProductionWorkflowInput {
  episodeId: string;
  projectId?: string;
  runtimeMode?: "mock" | "real";
}

export interface EpisodeProductionWorkflowOutput {
  episodeId: string;
  success: boolean;
  finalState: string;
  outputMp4?: string;
  qualityScore?: number;
  completedActivities: string[];
}

export async function EpisodeProductionTemporalWorkflow(
  input: EpisodeProductionWorkflowInput,
): Promise<EpisodeProductionWorkflowOutput> {
  const { episodeId } = input;
  const completedActivities: string[] = [];

  // Step 01: Load Episode
  const act01 = await standardActivities.activity01LoadEpisode(episodeId);
  if (!act01.success) {
    throw ApplicationFailure.create({ message: `Activity 01 failed: ${act01.error}` });
  }
  completedActivities.push(act01.activity);

  // Step 02: Build Execution Plan
  const act02 = await standardActivities.activity02BuildExecutionPlan(episodeId);
  if (!act02.success) {
    throw ApplicationFailure.create({ message: `Activity 02 failed: ${act02.error}` });
  }
  completedActivities.push(act02.activity);

  // Step 03: Generate Assets (AI Generation)
  const act03 = await aiActivities.activity03GenerateAssets(episodeId);
  if (!act03.success) {
    throw ApplicationFailure.create({ message: `Activity 03 failed: ${act03.error}` });
  }
  completedActivities.push(act03.activity);

  // Step 04: Validate Assets
  const act04 = await standardActivities.activity04ValidateAssets(episodeId);
  if (!act04.success) {
    throw ApplicationFailure.create({ message: `Activity 04 failed: ${act04.error}` });
  }
  completedActivities.push(act04.activity);

  // Step 05: Register Assets
  const act05 = await standardActivities.activity05RegisterAssets(episodeId);
  if (!act05.success) {
    throw ApplicationFailure.create({ message: `Activity 05 failed: ${act05.error}` });
  }
  completedActivities.push(act05.activity);

  // Step 06: Assemble Shots
  const act06 = await standardActivities.activity06AssembleShots(episodeId);
  if (!act06.success) {
    throw ApplicationFailure.create({ message: `Activity 06 failed: ${act06.error}` });
  }
  completedActivities.push(act06.activity);

  // Step 07: Assemble Scenes
  const act07 = await standardActivities.activity07AssembleScenes(episodeId);
  if (!act07.success) {
    throw ApplicationFailure.create({ message: `Activity 07 failed: ${act07.error}` });
  }
  completedActivities.push(act07.activity);

  // Step 08: Assemble Episode
  const act08 = await standardActivities.activity08AssembleEpisode(episodeId);
  if (!act08.success) {
    throw ApplicationFailure.create({ message: `Activity 08 failed: ${act08.error}` });
  }
  completedActivities.push(act08.activity);

  // Step 09: Generate Audio / Voice (AI Voice)
  const act09 = await aiActivities.activity09GenerateAudio(episodeId);
  if (!act09.success) {
    throw ApplicationFailure.create({ message: `Activity 09 failed: ${act09.error}` });
  }
  completedActivities.push(act09.activity);

  // Step 10: Generate Captions
  const act10 = await standardActivities.activity10GenerateCaptions(episodeId);
  if (!act10.success) {
    throw ApplicationFailure.create({ message: `Activity 10 failed: ${act10.error}` });
  }
  completedActivities.push(act10.activity);

  // Step 11: Mentor QA Review
  const act11 = await standardActivities.activity11MentorQAReview(episodeId);
  if (!act11.success) {
    throw ApplicationFailure.create({ message: `Activity 11 failed: ${act11.error}` });
  }
  completedActivities.push(act11.activity);

  // Step 12: Continuity Check
  const act12 = await standardActivities.activity12ContinuityCheck(episodeId);
  if (!act12.success) {
    throw ApplicationFailure.create({ message: `Activity 12 failed: ${act12.error}` });
  }
  completedActivities.push(act12.activity);

  // Step 13: Humanization Pass
  const act13 = await standardActivities.activity13HumanizationPass(episodeId);
  if (!act13.success) {
    throw ApplicationFailure.create({ message: `Activity 13 failed: ${act13.error}` });
  }
  completedActivities.push(act13.activity);

  // Step 14: Repair Loop
  const act14 = await standardActivities.activity14RepairLoop(episodeId);
  if (!act14.success) {
    throw ApplicationFailure.create({ message: `Activity 14 failed: ${act14.error}` });
  }
  completedActivities.push(act14.activity);

  // Step 15: Final Render (FFmpeg)
  const act15 = await renderActivities.activity15FinalRender(episodeId);
  if (!act15.success) {
    throw ApplicationFailure.create({ message: `Activity 15 failed: ${act15.error}` });
  }
  completedActivities.push(act15.activity);

  // Step 16: Generate Thumbnails
  const act16 = await renderActivities.activity16GenerateThumbnails(episodeId);
  if (!act16.success) {
    throw ApplicationFailure.create({ message: `Activity 16 failed: ${act16.error}` });
  }
  completedActivities.push(act16.activity);

  // Step 17: Final QA
  const act17 = await renderActivities.activity17FinalQA(episodeId);
  if (!act17.success) {
    throw ApplicationFailure.create({ message: `Activity 17 failed: ${act17.error}` });
  }
  completedActivities.push(act17.activity);

  // Step 18: Record Completion
  const act18 = await standardActivities.activity18RecordCompletion(episodeId);
  if (!act18.success) {
    throw ApplicationFailure.create({ message: `Activity 18 failed: ${act18.error}` });
  }
  completedActivities.push(act18.activity);

  const outputMp4 = (act15.data as any)?.outputPath;
  const qualityScore = (act11.data as any)?.qualityScore;

  return {
    episodeId,
    success: true,
    finalState: "COMPLETED",
    ...(outputMp4 ? { outputMp4 } : {}),
    ...(qualityScore ? { qualityScore } : {}),
    completedActivities,
  };
}
