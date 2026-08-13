import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Project as ProjectType } from "../api";

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api.listProjects().then(setProjects).catch(console.error);
  }, []);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const p = await api.createProject(name.trim());
      setName("");
      await api.listProjects().then(setProjects);
      nav(`/projects/${p.id}`);
    } catch (e) {
      console.error(e);
      alert(String((e as Error).message));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl mb-2">Projects</h1>
      <p className="text-paper/50 mb-8">Start a podcast project, then produce a real episode through the full pipeline.</p>

      <div className="flex gap-3 mb-10">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Project name (e.g. Markets & Habits)"
          className="flex-1 max-w-md bg-charcoal border border-white/15 rounded px-3 py-2 text-sm outline-none focus:border-mustard"
        />
        <button
          onClick={create}
          disabled={creating || !name.trim()}
          className="bg-vixor text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-40 hover:bg-vixor/90"
        >
          {creating ? "Creating…" : "Create Project"}
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border border-dashed border-white/20 rounded-lg p-10 text-center text-paper/40">
          No projects yet. Create one above — it only takes a second.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => nav(`/projects/${p.id}`)}
              className="text-left bg-charcoal border border-white/10 hover:border-mustard/60 rounded-lg p-4 transition-colors"
            >
              <div className="font-semibold text-lg">{p.name}</div>
              <div className="text-xs text-paper/40 mt-1">{p.episodeCount ?? 0} episodes · {new Date(p.createdAt).toLocaleDateString()}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
