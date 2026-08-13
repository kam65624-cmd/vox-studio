export interface Project {
  id: string;
  name: string;
  createdAt: string;
  episodeCount?: number;
}

export interface EpisodeSummary {
  id: string;
  title: string;
  topic: string;
  language: string;
  status: string;
  stage: string | null;
  stageMessage: string | null;
  durationTargetSec: number;
  createdAt: string;
}

export interface EpisodeDetail extends EpisodeSummary {
  projectId: string;
  config: {
    topic: string;
    language: string;
    format: string;
    durationTargetSec: number;
    speakerCount: number;
    sceneCount: number;
    shotCount: number;
    style: string;
    resolution: { width: number; height: number };
    fps: number;
  };
  production: {
    id: string;
    status: string;
    stage: string;
    message: string;
    progress: number;
    runtimeMode: string;
    error: string | null;
    updatedAt: string;
  } | null;
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async listProjects(): Promise<Project[]> {
    return j(await fetch("/api/projects"));
  },
  async createProject(name: string): Promise<Project> {
    return j(
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }),
    );
  },
  async listEpisodes(projectId: string): Promise<EpisodeSummary[]> {
    return j(await fetch(`/api/projects/${projectId}/episodes`));
  },
  async createEpisode(
    projectId: string,
    input: { title: string; config: { topic: string; language: string; durationTargetSec: number; speakerCount: number; sceneCount: number; shotCount: number; style: string } },
  ): Promise<EpisodeSummary> {
    return j(
      await fetch(`/api/projects/${projectId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  },
  async episode(id: string): Promise<EpisodeDetail> {
    return j(await fetch(`/api/episodes/${id}`));
  },
  async startProduction(id: string, runtimeMode = "real"): Promise<{ id: string; status: string; runtimeMode: string }> {
    return j(
      await fetch(`/api/episodes/${id}/produce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runtimeMode }),
      }),
    );
  },
  async productionStatus(id: string) {
    return j(await fetch(`/api/episodes/${id}/production`));
  },
  async episodeState(id: string) {
    return j(await fetch(`/api/episodes/${id}/state`));
  },
  async media(id: string) {
    return j(
      await fetch(`/api/episodes/${id}/media`),
    ) as Promise<{ hasVideo: boolean; hasThumbnail: boolean; videoUrl: string | null; thumbnailUrl: string | null; captionsUrl: string | null; artifacts: unknown }>;
  },
};
