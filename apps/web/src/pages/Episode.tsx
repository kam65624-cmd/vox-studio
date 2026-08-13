import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type EpisodeDetail } from "../api";

const STAGES = ["script", "plan", "assets", "timeline", "captions", "mentor", "humanization", "render", "qa", "done"] as const;
const STAGE_LABEL: Record<string, string> = {
  script: "Writing script",
  plan: "Planning scenes",
  assets: "Generating assets",
  timeline: "Assembling timeline",
  captions: "Writing captions",
  mentor: "Mentor review",
  humanization: "Humanization",
  render: "Rendering video",
  qa: "Final QA",
  done: "Exported",
};

export default function Episode() {
  const { episodeId = "" } = useParams();
  const [ep, setEp] = useState<EpisodeDetail | null>(null);
  const [state, setState] = useState<any>(null);
  const [media, setMedia] = useState<{ videoUrl: string | null; thumbnailUrl: string | null; captionsUrl: string | null } | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    try {
      const [e, s, m] = await Promise.all([api.episode(episodeId), api.episodeState(episodeId).catch(() => null), api.media(episodeId).catch(() => null)]);
      setEp(e);
      setState(s);
      setMedia(m as never);
    } catch (err) {
      setError(String((err as Error).message));
    }
  };

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, 2500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  async function start() {
    setStarting(true);
    setError(null);
    try {
      await api.startProduction(episodeId, "real");
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setStarting(false);
    }
  }

  const status = ep?.status ?? "DRAFT";
  const stage = (ep?.stage ?? (state?.stage ?? "script")) as string;
  const active = !["DRAFT", "EXPORTED", "FAILED"].includes(status);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link to={`/projects/${ep?.projectId ?? ""}`} className="text-xs text-paper/50 hover:text-paper">← Project</Link>

      <div className="flex flex-wrap items-start gap-4 mt-2 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{ep?.title ?? "Episode"}</h1>
          <p className="text-paper/50 text-sm mt-1">{ep?.topic ?? ""}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded ${statusColor(status)}`}>{status}</span>
      </div>

      {error && <div className="bg-vixor/15 border border-vixor/40 text-vixor rounded px-4 py-2 text-sm mb-4">{error}</div>}

      {status === "DRAFT" && (
        <div className="bg-charcoal border border-white/10 rounded-lg p-6 mb-8">
          <p className="text-sm text-paper/60 mb-4">Configured: {ep?.config.language === "ar" ? "Arabic" : "English"} · {ep?.config.durationTargetSec}s target · {ep?.config.speakerCount} speakers · {ep?.config.sceneCount} scenes · {ep?.config.shotCount} shots/scene</p>
          <button onClick={start} disabled={starting} className="bg-vixor text-white px-6 py-3 rounded-md font-semibold disabled:opacity-40 hover:bg-vixor/90">
            {starting ? "Starting…" : "▶ Start Production"}
          </button>
        </div>
      )}

      {active && (
        <div className="bg-charcoal border border-white/10 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">{STAGE_LABEL[stage] ?? stage}</div>
            <div className="text-xs text-paper/50">{ep?.production?.message ?? state?.message ?? ""}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => {
              const idx = STAGES.indexOf(s as never);
              const cur = STAGES.indexOf(stage as never);
              const done = idx < cur || status === "EXPORTED" || (idx <= cur && status !== "DRAFT" && status !== "FAILED");
              const current = idx === cur && status !== "EXPORTED";
              return (
                <span key={s} className={`text-[10px] px-2 py-1 rounded border ${current ? "border-mustard text-mustard bg-mustard/10 animate-pulse" : done ? "border-teal text-teal bg-teal/10" : "border-white/10 text-paper/30"}`}>
                  {done ? "✓ " : ""}{STAGE_LABEL[s]}
                </span>
              );
            })}
          </div>
          {status === "FAILED" && ep?.production?.error && <div className="mt-4 text-xs text-vixor">{ep.production.error}</div>}
        </div>
      )}

      {(status === "EXPORTED" || media?.videoUrl) && (
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <div className="bg-charcoal border border-white/10 rounded-lg p-4">
            <div className="text-sm font-semibold mb-3">Final video</div>
            {media?.videoUrl ? (
              <video controls className="w-full rounded bg-black aspect-video" src={media.videoUrl} playsInline />
            ) : (
              <div className="aspect-video rounded bg-black flex items-center justify-center text-paper/40 text-sm">Rendering…</div>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <a className="text-mustard hover:underline" href={media?.videoUrl ?? "#"} download>Download MP4</a>
              {media?.captionsUrl && <a className="text-mustard hover:underline" href={`/api/episodes/${episodeId}/captions.srt`} download>Captions SRT</a>}
              {media?.captionsUrl && <a className="text-mustard hover:underline" href={media.captionsUrl} target="_blank" rel="noreferrer">Captions VTT</a>}
            </div>
          </div>
          <div className="bg-charcoal border border-white/10 rounded-lg p-4">
            <div className="text-sm font-semibold mb-3">Thumbnail</div>
            {media?.thumbnailUrl ? <img src={media.thumbnailUrl} alt="thumbnail" className="rounded aspect-video object-cover w-full" /> : <div className="aspect-video rounded bg-black flex items-center justify-center text-paper/40 text-sm">—</div>}
          </div>
        </div>
      )}

      {state && (
        <div className="bg-charcoal border border-white/10 rounded-lg p-6">
          <div className="text-sm font-semibold mb-4">Generated assets</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-paper/50 mb-2">Voice lines ({Object.values(state.voiceArtifacts ?? {}).length})</div>
              <div className="flex flex-col gap-2">
                {Object.entries(state.voiceArtifacts ?? {}).map(([k, a]: [string, any]) => (
                  <div key={k} className="flex items-center gap-2 text-xs border border-white/10 rounded px-2 py-1.5">
                    <audio controls className="h-8 w-40" src={`/api/artifacts/${encodeURIComponent((a as any).storageKey)}`} />
                    <span className="text-paper/50 truncate">{(a as any).provider} · {(a as any).model}</span>
                    <span className="ml-auto text-teal">{(a as any).sizeBytes} B</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-paper/50 mb-2">Shot images ({Object.values(state.imageArtifacts ?? {}).length})</div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(state.imageArtifacts ?? {}).map(([k, a]: [string, any]) => (
                  <div key={k} className="border border-white/10 rounded overflow-hidden">
                    <img src={`/api/artifacts/${encodeURIComponent((a as any).storageKey)}`} alt={k} className="aspect-video object-cover w-full" />
                    <div className="text-[9px] text-paper/40 px-1 py-0.5 truncate">{(a as any).provider} · {(a as any).model}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusColor(s: string): string {
  switch (s) {
    case "EXPORTED":
      return "bg-teal/20 text-teal";
    case "FAILED":
      return "bg-vixor/20 text-vixor";
    case "DRAFT":
      return "bg-white/10 text-paper/60";
    default:
      return "bg-mustard/20 text-mustard";
  }
}
