import { proxyActivities, defineSignal, setHandler, ApplicationFailure } from "@temporalio/workflow";
import type * as activities from "../activities/index.js";
import type { WorkflowInput, WorkflowResult } from "../types.js";

const cancelSignal = defineSignal<[string]>("cancel-production");

const { act00InitProduction, act01GenerateScript, act02GeneratePlan, act03GenerateAssets, act05BuildTimeline, act06GenerateCaptions, act07MentorReview, act08Humanization, act15FinalRender, act16FinalQa } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: "60 minutes",
    heartbeatTimeout: "5 minutes",
    retry: {
      initialInterval: "2s",
      maximumInterval: "60s",
      backoffCoefficient: 2,
      maximumAttempts: 3,
    },
  });

export async function episodeProductionWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  let cancelled = false;
  setHandler(cancelSignal, () => {
    cancelled = true;
  });

  try {
    await act00InitProduction(input);
    await act01GenerateScript(input.episodeId);
    if (cancelled) throw ApplicationFailure.nonRetryable("Production cancelled", "CANCELLED");
    await act02GeneratePlan(input.episodeId);
    await act03GenerateAssets(input.episodeId);
    if (cancelled) throw ApplicationFailure.nonRetryable("Production cancelled", "CANCELLED");
    await act05BuildTimeline(input.episodeId);
    await act06GenerateCaptions(input.episodeId);
    await act07MentorReview(input.episodeId);
    await act08Humanization(input.episodeId);
    await act15FinalRender(input.episodeId);
    await act16FinalQa(input.episodeId);

    return {
      episodeId: input.episodeId,
      status: "EXPORTED",
      stage: "done",
      finalPath: `${input.episodeId}/assets/final.mp4`,
      thumbnailPath: `${input.episodeId}/assets/thumbnail.jpg`,
      providerSummary: {},
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      episodeId: input.episodeId,
      status: "FAILED",
      stage: "done",
      finalPath: null,
      thumbnailPath: null,
      providerSummary: {},
      error: msg.slice(0, 2000),
    };
  }
}
