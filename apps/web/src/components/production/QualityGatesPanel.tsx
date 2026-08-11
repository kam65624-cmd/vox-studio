"use client";

import { CheckCircle2, AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export function QualityGatesPanel({ episodeId }: { episodeId: string }) {
  // Mock K9 Quality Gates Results
  const gates = [
    { id: "G01", name: "Script Integrity", status: "PASS", score: 95 },
    { id: "G02", name: "Story Coherence", status: "PASS", score: 90 },
    { id: "G03", name: "Entity Consistency", status: "PASS", score: 100 },
    { id: "G04", name: "Scene Continuity", status: "WARNING", score: 75, hint: "Drift in shot 2" },
    { id: "G05", name: "Style Consistency", status: "PASS", score: 88 },
    { id: "G06", name: "Visual Quality", status: "REPAIRABLE", score: 60, hint: "Regenerate scene 3" },
    { id: "G07", name: "Audio Quality", status: "PASS", score: 92 },
    { id: "G08", name: "Caption Quality", status: "PASS", score: 98 },
    { id: "G09", name: "Humanization", status: "PASS", score: 85 },
    { id: "G10", name: "Media Integrity", status: "BLOCKED", score: 0, hint: "Final render missing" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS": return "text-emerald-400";
      case "WARNING": return "text-amber-400";
      case "REPAIRABLE": return "text-orange-500";
      case "BLOCKED": return "text-red-500";
      default: return "text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS": return <CheckCircle2 size={16} />;
      case "WARNING": return <AlertTriangle size={16} />;
      case "REPAIRABLE": return <AlertCircle size={16} />;
      case "BLOCKED": return <AlertCircle size={16} />;
      default: return <ShieldCheck size={16} />;
    }
  };

  return (
    <div
      className="rounded-lg border overflow-hidden flex flex-col h-full shadow-lg"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div
        className="p-3 border-b flex items-center justify-between"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-2)",
        }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-purple-400" />
          <h3 className="font-semibold text-sm" style={{ color: "var(--paper)" }}>
            بوابات الجودة (Quality Gates)
          </h3>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-900/30 text-red-400">
          BLOCKED
        </span>
      </div>

      <div className="p-3 overflow-y-auto space-y-2 text-xs">
        {gates.map((gate) => (
          <div
            key={gate.id}
            className="p-2 border rounded-md"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-2)",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={getStatusColor(gate.status)}>
                  {getStatusIcon(gate.status)}
                </span>
                <span className="font-medium text-slate-200">
                  {gate.id}: {gate.name}
                </span>
              </div>
              <span className={`font-mono font-bold ${getStatusColor(gate.status)}`}>
                {gate.score}%
              </span>
            </div>
            {gate.hint && (
              <div className="text-slate-400 mt-1 pr-6 flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" />
                <span>{gate.hint}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
