import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import Episode from "./pages/Episode";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="h-12 shrink-0 border-b border-white/10 bg-charcoal/80 flex items-center px-4 gap-4">
        <Link to="/" className="font-display tracking-widest text-xl text-paper">
          VOX<span className="text-vixor"> STUDIO</span>
        </Link>
        <span className="text-xs text-paper/40 hidden sm:inline">Editorial Video Production OS</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded border border-teal text-teal bg-teal/10">REAL MODE</span>
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects/:projectId" element={<Project />} />
          <Route path="/episodes/:episodeId" element={<Episode />} />
        </Routes>
      </main>
    </div>
  );
}
