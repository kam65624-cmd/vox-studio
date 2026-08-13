import type { ArtifactRecord, DialogueLine, PlanDocument, ProductionConfig, TimelineClip, TimelineData } from "@vox/contracts";

export interface TimelineInputs {
  plan: PlanDocument;
  config: ProductionConfig;
  images: Record<string, ArtifactRecord>; // shotId -> artifact
  audio: Record<string, ArtifactRecord>; // lineId -> artifact
  lineDurations: Record<string, number>; // lineId -> seconds
}

export function buildTimeline(inputs: TimelineInputs): TimelineData {
  const { plan, config, images, audio, lineDurations } = inputs;
  const clips: TimelineClip[] = [];
  let cursor = 0;

  for (const scene of plan.scenes) {
    for (const shot of scene.shots) {
      const img = images[shot.id];
      const duration = shot.durationSec > 0 ? shot.durationSec : 4;
      if (img) {
        clips.push({
          id: `clip_img_${shot.id}`,
          kind: "image",
          source: img.storageKey,
          artifactId: img.id,
          startSec: cursor,
          durationSec: duration,
        });
      }
      const sceneLines = plan.scenes
        .flatMap((s) => s.dialogueLineIndices)
        .length;
      void sceneLines;
      cursor += duration;
    }
  }

  // dialogue audio clips positioned sequentially within scene boundaries (approx)
  let audioCursor = 0;
  for (const scene of plan.scenes) {
    const sceneStart = audioCursor;
    let sceneDur = 0;
    for (const lineIdx of scene.dialogueLineIndices) {
      const art = audio[`line_${lineIdx}`];
      const d = lineDurations[`line_${lineIdx}`] ?? 2;
      if (art) {
        clips.push({
          id: `clip_audio_${lineIdx}`,
          kind: "audio",
          source: art.storageKey,
          artifactId: art.id,
          startSec: sceneStart + sceneDur,
          durationSec: d,
          text: undefined,
        });
      }
      sceneDur += d + 0.4;
    }
    audioCursor += sceneDur;
  }

  return {
    episodeId: plan.episodeId,
    width: config.resolution.width,
    height: config.resolution.height,
    fps: config.fps,
    clips,
    totalDurationSec: Math.max(audioCursor, cursor),
  };
}

export function lineKey(index: number): string {
  return `line_${index}`;
}

export function dialogueAssignments(plan: PlanDocument, lines: DialogueLine[]): Record<string, number[]> {
  const map: Record<string, number[]> = {};
  for (const scene of plan.scenes) map[scene.id] = scene.dialogueLineIndices;
  return map;
}
