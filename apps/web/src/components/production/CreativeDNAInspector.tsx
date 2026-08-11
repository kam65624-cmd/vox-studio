"use client";

import { useState } from "react";
import { Dna, Lock, Palette, Camera, Activity, Sliders, Check } from "lucide-react";

export function CreativeDNAInspector({ projectId }: { projectId: string }) {
  const [activeStyle, setActiveStyle] = useState("VOX Mixed Media Editorial");
  const [accentColor, setAccentColor] = useState("#FF3B30");
  const [locked, setLocked] = useState(true);

  const styleSkills = [
    {
      id: "vox-mixed-media",
      name: "VOX Mixed Media Editorial",
      accent: "#FF3B30",
      bg: "#F4F1EA",
      desc: "ورق ممزق، halftone، ماركر أحمر، قطع صحفية فوتوغرافية.",
    },
    {
      id: "vox-paper-diorama",
      name: "VOX Cinematic Paper Diorama",
      accent: "#E65100",
      bg: "#2C241B",
      desc: "ديوراما ثلاثية الأبعاد بأسلوب الجرائد التاريخية المعتقة وشريط حجب سوداوي.",
    },
  ];

  return (
    <div
      className="p-4 rounded-xl border space-y-4"
      style={{ background: "var(--surface-1)", borderColor: "var(--border-accent)" }}
    >
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <Dna size={16} className="text-rose-400" />
          <h2 className="text-xs font-bold text-primary">الحمض النووي الإبداعي للمشروع (Creative DNA & Style Lock)</h2>
        </div>
        <button
          onClick={() => setLocked(!locked)}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            locked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          }`}
        >
          <Lock size={12} />
          {locked ? "مغلق ومحمي (Style Locked)" : "قابل للتعديل (Unlocked)"}
        </button>
      </div>

      {/* Style Skills Picker */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
          <Palette size={12} />
          نمط الحركة المعتمد (Active Style Skill)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {styleSkills.map((sk) => (
            <div
              key={sk.id}
              onClick={() => {
                if (!locked) {
                  setActiveStyle(sk.name);
                  setAccentColor(sk.accent);
                }
              }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                activeStyle === sk.name ? "border-amber-400 bg-surface-2" : "border-subtle hover:border-muted"
              }`}
              style={{ background: "var(--surface-2)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white">{sk.name}</span>
                {activeStyle === sk.name && <Check size={14} className="text-amber-400" />}
              </div>
              <p className="text-[10px] text-muted leading-relaxed">{sk.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DNA Color & Specs Breakdown */}
      <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="p-2.5 rounded border space-y-1" style={{ background: "var(--ink-navy)", borderColor: "var(--border-subtle)" }}>
          <span className="text-[10px] text-muted flex items-center gap-1">
            <Palette size={10} /> لون التأكيد (Accent Color)
          </span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: accentColor }} />
            <span className="font-mono font-semibold text-white">{accentColor}</span>
          </div>
        </div>
        <div className="p-2.5 rounded border space-y-1" style={{ background: "var(--ink-navy)", borderColor: "var(--border-subtle)" }}>
          <span className="text-[10px] text-muted flex items-center gap-1">
            <Camera size={10} /> لغة الكاميرا
          </span>
          <span className="font-semibold text-white text-[11px]">Snappy FPV & Focal Push-Ins</span>
        </div>
        <div className="p-2.5 rounded border space-y-1" style={{ background: "var(--ink-navy)", borderColor: "var(--border-subtle)" }}>
          <span className="text-[10px] text-muted flex items-center gap-1">
            <Activity size={10} /> إيقاع الحركة (Motion)
          </span>
          <span className="font-semibold text-white text-[11px]">12fps Paper Stop-Motion</span>
        </div>
      </div>
    </div>
  );
}
