import type {
  ArtifactRecord,
  MentorReport,
  PlanDocument,
  ProductionConfig,
  ProductionStage,
  ProductionStatus,
  ProviderRun,
  QaReport,
  RuntimeMode,
  ScriptDocument,
  TimelineData,
} from "@vox/contracts";

export interface ProductionState {
  episodeId: string;
  projectId: string;
  title: string;
  topic: string;
  config: ProductionConfig;
  runtimeMode: RuntimeMode;
  status: ProductionStatus;
  stage: ProductionStage;
  message: string;
  progress: number;
  startedAt: string;
  script?: ScriptDocument;
  plan?: PlanDocument;
  timeline?: TimelineData;
  captions?: { srt: string; vtt: string; path: string };
  voiceArtifacts: Record<string, ArtifactRecord>;
  imageArtifacts: Record<string, ArtifactRecord>;
  videoArtifacts: ArtifactRecord[];
  lineDurations: Record<string, number>;
  providerRuns: ProviderRun[];
  videoProviderRuns: ProviderRun[];
  mentor?: MentorReport;
  qa?: QaReport;
  final?: { videoPath: string; thumbnailPath: string; sizeBytes: number; sha256: string; durationSec: number };
  error?: string;
}

export interface WorkflowInput {
  episodeId: string;
  projectId: string;
  title: string;
  topic: string;
  config: ProductionConfig;
  runtimeMode: RuntimeMode;
}

export interface WorkflowResult {
  episodeId: string;
  status: ProductionStatus;
  stage: ProductionStage;
  finalPath: string | null;
  thumbnailPath: string | null;
  providerSummary: Record<string, string[]>;
  error?: string;
}
