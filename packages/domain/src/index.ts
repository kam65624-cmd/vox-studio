import type {
  DialogueLine,
  Episode,
  MentorIssue,
  MentorReport,
  ProductionConfig,
  ProductionRun,
  QaReport,
  QaCheck,
  Scene,
  Shot,
  ScriptDocument,
} from "@vox/contracts";

// ─── Id / time helpers ───────────────────────────────────────────────────────

export function newId(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function isoNow(): string {
  return new Date().toISOString();
}

// ─── Production stage order ──────────────────────────────────────────────────

export const STAGE_ORDER = [
  "script",
  "plan",
  "assets",
  "download",
  "timeline",
  "captions",
  "mentor",
  "humanization",
  "render",
  "qa",
  "finalize",
  "done",
] as const;

// ─── Script helpers ──────────────────────────────────────────────────────────

export function estimateSpeechDurationSec(text: string, language: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  // Arabic is read slower per word on average; both map reasonably to ~2.6 words/sec
  const wps = language === "ar" ? 2.6 : 2.9;
  return Math.max(1, Math.round((words / wps) * 10) / 10);
}

export function dialogueLinesText(lines: DialogueLine[]): string {
  return lines.map((l) => `${l.speaker}: ${l.text}`).join("\n");
}

// ─── Continuity / Mentor (rule-based, deterministic) ─────────────────────────

export function runContinuityChecks(script: ScriptDocument, scenes: Scene[]): MentorIssue[] {
  const issues: MentorIssue[] = [];
  const speakers = new Set(script.lines.map((l) => l.speaker));
  if (speakers.size < 1) issues.push(blocker("continuity", "No speakers defined", "script.lines"));
  if (scenes.length === 0) issues.push(blocker("continuity", "No scenes planned", "plan.scenes"));
  const durations = scenes.map((s) => s.durationSec ?? 0);
  if (durations.some((d) => d <= 0)) issues.push(blocker("continuity", "A scene has non-positive duration", "plan.scenes"));
  return issues;
}

export function runHumanizationChecks(script: ScriptDocument): MentorIssue[] {
  const issues: MentorIssue[] = [];
  const texts = script.lines.map((l) => l.text);
  const repeated = texts.filter((t, i) => texts.indexOf(t) !== i);
  if (repeated.length > 0) issues.push(warning("humanization", "Duplicate dialogue lines detected", "script.lines"));
  const speakerGaps = script.lines.filter((l) => !l.speaker.trim());
  if (speakerGaps.length > 0) issues.push(warning("humanization", "Lines missing speaker", "script.lines"));
  return issues;
}

export function computeQualityScore(issues: MentorIssue[]): number {
  const blockers = issues.filter((i) => i.severity === "blocker").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  let score = 100;
  score -= blockers * 25;
  score -= warnings * 3;
  return Math.max(0, Math.min(100, score));
}

export function buildMentorReport(
  episodeId: string,
  script: ScriptDocument,
  scenes: Scene[],
  extra: { continuity?: unknown; humanization?: unknown } = {},
): MentorReport {
  const issues: MentorIssue[] = [...runContinuityChecks(script, scenes), ...runHumanizationChecks(script)];
  const qualityScore = computeQualityScore(issues);
  return {
    episodeId,
    qualityScore,
    issues,
    continuity: extra.continuity ?? {},
    humanization: extra.humanization ?? {},
    approved: issues.every((i) => i.severity !== "blocker"),
    generatedAt: isoNow(),
  };
}

function blocker(domain: string, title: string, evidence: string): MentorIssue {
  return { id: newId("iss"), severity: "blocker", domain, title, evidence, fix: "Resolve before export." };
}
function warning(domain: string, title: string, evidence: string): MentorIssue {
  return { id: newId("iss"), severity: "warning", domain, title, evidence, fix: "Review manually." };
}

// ─── QA rules (deterministic gate for final media) ───────────────────────────

export function buildQaReport(
  episodeId: string,
  probe: Record<string, any>,
  fileSizeBytes: number,
): QaReport {
  const checks = [
    fileSizeGate(fileSizeBytes),
    containerGate(probe),
    videoStreamGate(probe),
    audioStreamGate(probe),
    durationGate(probe),
    resolutionGate(probe),
  ];
  const passed = checks.every((c) => c.status !== "fail");
  return { episodeId, passed, checks, ffprobe: probe, generatedAt: isoNow() };
}

function fileSizeGate(size: number): QaCheck {
  const status = size > 50_000 ? "pass" : "fail";
  return { name: "file-size-meaningful", status, detail: `final.mp4 size=${size} bytes` };
}
function containerGate(p: Record<string, any>): QaCheck {
  const fmt = p.format?.format_name ?? "";
  const status = /mp4/i.test(fmt) ? "pass" : "fail";
  return { name: "container-mp4", status, detail: `format=${fmt}` };
}
function videoStreamGate(p: Record<string, any>): QaCheck {
  const vs = (p.streams ?? []).find((s: any) => s.codec_type === "video");
  const ok = !!vs && /h264|avc1|hevc|vp9/i.test(vs.codec_name ?? "");
  return { name: "video-stream", status: ok ? "pass" : "fail", detail: `codec=${vs?.codec_name ?? "none"}` };
}
function audioStreamGate(p: Record<string, any>): QaCheck {
  const as = (p.streams ?? []).find((s: any) => s.codec_type === "audio");
  const ok = !!as && /aac|mp3|opus|vorbis/i.test(as.codec_name ?? "");
  return { name: "audio-stream", status: ok ? "pass" : "fail", detail: `codec=${as?.codec_name ?? "none"}` };
}
function durationGate(p: Record<string, any>): QaCheck {
  const d = Number(p.format?.duration ?? 0);
  return { name: "duration-positive", status: d > 0 ? "pass" : "fail", detail: `duration=${d}s` };
}
function resolutionGate(p: Record<string, any>): QaCheck {
  const vs = (p.streams ?? []).find((s: any) => s.codec_type === "video");
  const w = Number(vs?.width ?? 0);
  const h = Number(vs?.height ?? 0);
  return { name: "resolution-positive", status: w > 0 && h > 0 ? "pass" : "fail", detail: `${w}x${h}` };
}

// ─── Production run state helpers ────────────────────────────────────────────

export function withStage(run: ProductionRun, stage: ProductionRun["stage"], message: string): ProductionRun {
  const idx = STAGE_ORDER.indexOf(stage);
  const progress = Math.min(99, Math.round(((idx + 1) / STAGE_ORDER.length) * 100));
  return {
    ...run,
    stage,
    currentStageMessage: message,
    stageIndex: idx,
    progress,
    status: mapStageToStatus(stage),
    updatedAt: isoNow(),
  };
}

function mapStageToStatus(stage: ProductionRun["stage"]): ProductionRun["status"] {
  switch (stage) {
    case "script":
    case "plan":
      return "PLANNING";
    case "assets":
    case "download":
      return "GENERATING";
    case "timeline":
    case "captions":
      return "VALIDATING";
    case "mentor":
    case "humanization":
      return "MENTOR_REVIEW";
    case "render":
      return "RENDERING";
    case "qa":
      return "QA";
    case "finalize":
    case "done":
      return "EXPORTED";
    default:
      return "DRAFT";
  }
}

export function validateConfigForProduction(config: ProductionConfig): string[] {
  const errors: string[] = [];
  if (!config.topic || config.topic.trim().length === 0) errors.push("topic is required");
  if (!config.language) errors.push("language is required");
  if (config.durationTargetSec <= 0) errors.push("durationTargetSec must be positive");
  if (config.speakerCount <= 0) errors.push("speakerCount must be positive");
  return errors;
}

export type { Episode };
