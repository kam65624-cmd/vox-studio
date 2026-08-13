import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, type EpisodeSummary } from "../api";

const DEFAULT_TOPIC = "لماذا ينجح بعض الأشخاص في بناء العادات بينما يفشل الآخرون؟";

export default function Project() {
  const { projectId = "" } = useParams();
  const nav = useNavigate();
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [language, setLanguage] = useState("ar");
  const [duration, setDuration] = useState(45);
  const [speakers, setSpeakers] = useState(2);
  const [scenes, setScenes] = useState(2);
  const [shots, setShots] = useState(4);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.listEpisodes(projectId).then(setEpisodes).catch(console.error);
  }, [projectId]);

  async function create() {
    setCreating(true);
    try {
      const ep = await api.createEpisode(projectId, {
        title: topic.slice(0, 60),
        config: { topic, language, durationTargetSec: duration, speakerCount: speakers, sceneCount: scenes, shotCount: shots, style: "Premium cinematic podcast" },
      });
      nav(`/episodes/${ep.id}`);
    } catch (e) {
      console.error(e);
      alert(String((e as Error).message));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link to="/" className="text-xs text-paper/50 hover:text-paper">← Projects</Link>
      <h1 className="text-3xl mt-2 mb-6">New Episode</h1>

      <div className="bg-charcoal border border-white/10 rounded-lg p-6 mb-8">
        <label className="block text-xs uppercase tracking-wider text-paper/50 mb-2">Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full bg-ink border border-white/15 rounded px-3 py-2 text-sm mb-4 outline-none focus:border-mustard"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-paper/50 mb-1">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-ink border border-white/15 rounded px-2 py-2 text-sm">
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Duration (sec)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-ink border border-white/15 rounded px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Speakers</label>
            <input type="number" value={speakers} min={1} onChange={(e) => setSpeakers(Number(e.target.value))} className="w-full bg-ink border border-white/15 rounded px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-paper/50 mb-1">Scenes</label>
            <input type="number" value={scenes} min={1} onChange={(e) => setScenes(Number(e.target.value))} className="w-full bg-ink border border-white/15 rounded px-2 py-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-xs">
          <div>
            <label className="block text-xs text-paper/50 mb-1">Shots / scene</label>
            <input type="number" value={shots} min={1} onChange={(e) => setShots(Number(e.target.value))} className="w-full bg-ink border border-white/15 rounded px-2 py-2 text-sm" />
          </div>
        </div>
        <button onClick={create} disabled={creating || !topic.trim()} className="bg-vixor text-white px-5 py-2 rounded text-sm font-semibold disabled:opacity-40 hover:bg-vixor/90">
          {creating ? "Creating…" : "Create Episode"}
        </button>
      </div>

      <h2 className="text-xl mb-4">Episodes</h2>
      {episodes.length === 0 ? (
        <div className="text-paper/40 text-sm">No episodes yet in this project.</div>
      ) : (
        <div className="grid gap-3">
          {episodes.map((e) => (
            <button key={e.id} onClick={() => nav(`/episodes/${e.id}`)} className="text-left bg-charcoal border border-white/10 hover:border-mustard/60 rounded-lg p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{e.title}</div>
                <div className="text-xs text-paper/40 truncate">{e.topic}</div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded ${statusColor(e.status)}`}>{e.status}</span>
            </button>
          ))}
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
