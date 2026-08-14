/**
 * Temporal Activity Definitions (P0-M.2 Track M1 & M2)
 *
 * Wraps EpisodeProductionWorkflow's 18 activities as standalone async functions
 * that Temporal can register, retry, heartbeat, and track individually.
 *
 * Each activity:
 *  1. Creates a fresh WorkflowContext
 *  2. Instantiates EpisodeProductionWorkflow
 *  3. Calls the corresponding activity method (which handles state persistence & idempotency)
 *  4. Returns a serializable WorkflowActivityResult
 */

import { EpisodeProductionWorkflow, type WorkflowContext, type WorkflowActivityResult } from "../workflow";
import path from "node:path";

// ─── Context factory ──────────────────────────────────────────────────────────

function makeContext(episodeId: string): WorkflowContext {
  return {
    episodeId,
    runtimeMode: (process.env["VOX_RUNTIME_MODE"] === "real" ? "real" : "mock") as "mock" | "real",
    outputDir: path.resolve(process.cwd(), "artifacts", "productions", episodeId),
  };
}

// ─── Helper: run a single named activity via EpisodeProductionWorkflow ────────

async function runSingleActivity(
  episodeId: string,
  activityName: string,
): Promise<WorkflowActivityResult> {
  const wf = new EpisodeProductionWorkflow(makeContext(episodeId));
  const activityMap: Record<string, (w: EpisodeProductionWorkflow) => Promise<any>> = {
    "01_LOAD_EPISODE":        (w) => w.activity01LoadEpisode(),
    "02_BUILD_EXECUTION_PLAN":  (w) => w.activity02BuildExecutionPlan(),
    "03_GENERATE_ASSETS":     (w) => w.activity03GenerateAssets(),
    "04_VALIDATE_ASSETS":     (w) => w.activity04ValidateAssets(),
    "05_REGISTER_ASSETS":     (w) => w.activity05RegisterAssets(),
    "06_ASSEMBLE_SHOTS":      (w) => w.activity06AssembleShots(),
    "07_ASSEMBLE_SCENES":     (w) => w.activity07AssembleScenes(),
    "08_ASSEMBLE_EPISODE":    (w) => w.activity08AssembleEpisode(),
    "09_GENERATE_AUDIO":      (w) => w.activity09GenerateAudio(),
    "10_GENERATE_CAPTIONS":   (w) => w.activity10GenerateCaptions(),
    "11_MENTOR_QA_REVIEW":    (w) => w.activity11MentorQAReview(),
    "12_CONTINUITY_CHECK":    (w) => w.activity12ContinuityCheck(),
    "13_HUMANIZATION_PASS":   (w) => w.activity13HumanizationPass(),
    "14_REPAIR_LOOP":         (w) => w.activity14RepairLoop(),
    "15_FINAL_RENDER":        (w) => w.activity15FinalRender(),
    "16_GENERATE_THUMBNAILS": (w) => w.activity16GenerateThumbnails(),
    "17_FINAL_QA":            (w) => w.activity17FinalQA(),
    "18_RECORD_COMPLETION":   (w) => w.activity18RecordCompletion(),
  };

  const fn = activityMap[activityName];
  if (!fn) throw new Error(`Unknown activity: ${activityName}`);

  const data = await fn(wf);
  return {
    activity: activityName,
    success: true,
    durationMs: 0,
    data,
  };
}

// ─── 18 Temporal Activity Functions ──────────────────────────────────────────

export async function activity01LoadEpisode(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "01_LOAD_EPISODE");
}

export async function activity02BuildExecutionPlan(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "02_BUILD_EXECUTION_PLAN");
}

export async function activity03GenerateAssets(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "03_GENERATE_ASSETS");
}

export async function activity04ValidateAssets(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "04_VALIDATE_ASSETS");
}

export async function activity05RegisterAssets(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "05_REGISTER_ASSETS");
}

export async function activity06AssembleShots(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "06_ASSEMBLE_SHOTS");
}

export async function activity07AssembleScenes(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "07_ASSEMBLE_SCENES");
}

export async function activity08AssembleEpisode(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "08_ASSEMBLE_EPISODE");
}

export async function activity09GenerateAudio(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "09_GENERATE_AUDIO");
}

export async function activity10GenerateCaptions(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "10_GENERATE_CAPTIONS");
}

export async function activity11MentorQAReview(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "11_MENTOR_QA_REVIEW");
}

export async function activity12ContinuityCheck(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "12_CONTINUITY_CHECK");
}

export async function activity13HumanizationPass(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "13_HUMANIZATION_PASS");
}

export async function activity14RepairLoop(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "14_REPAIR_LOOP");
}

export async function activity15FinalRender(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "15_FINAL_RENDER");
}

export async function activity16GenerateThumbnails(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "16_GENERATE_THUMBNAILS");
}

export async function activity17FinalQA(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "17_FINAL_QA");
}

export async function activity18RecordCompletion(episodeId: string): Promise<WorkflowActivityResult> {
  return runSingleActivity(episodeId, "18_RECORD_COMPLETION");
}

// ─── Activity Bundle (for Worker registration) ────────────────────────────────

export const activities = {
  activity01LoadEpisode,
  activity02BuildExecutionPlan,
  activity03GenerateAssets,
  activity04ValidateAssets,
  activity05RegisterAssets,
  activity06AssembleShots,
  activity07AssembleScenes,
  activity08AssembleEpisode,
  activity09GenerateAudio,
  activity10GenerateCaptions,
  activity11MentorQAReview,
  activity12ContinuityCheck,
  activity13HumanizationPass,
  activity14RepairLoop,
  activity15FinalRender,
  activity16GenerateThumbnails,
  activity17FinalQA,
  activity18RecordCompletion,
} as const;

export const ACTIVITY_NAMES = Object.keys(activities) as (keyof typeof activities)[];
export const ACTIVITY_COUNT = ACTIVITY_NAMES.length; // must be 18
