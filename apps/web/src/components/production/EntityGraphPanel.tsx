"use client";

import { useState } from "react";
import { Database, ShieldCheck, Tag, FileText, ChevronRight, ChevronDown } from "lucide-react";

export function EntityGraphPanel() {
  const [isOpen, setIsOpen] = useState(true);

  // Sample rendered entity graph state (matched to backend extractEntities)
  const canonicalEntities = [
    {
      id: "ent-fed",
      name: "Federal Reserve / الفيدرالي الأمريكي",
      type: "ORGANIZATION",
      description: "البنك المركزي الأمريكي المسؤول عن القرارات النقدية وأسعار الفائدة.",
      aliases: ["Federal Reserve", "Fed", "الفيدرالي"],
      affectedSceneIds: ["scene-1", "scene-2"],
    },
    {
      id: "ent-oil",
      name: "Crude Oil Market / سوق النفط",
      type: "FINANCIAL_INSTRUMENT",
      description: "أسواق النفط العالمية وتأثير تغير الأسعار على الأسواق الناشئة.",
      aliases: ["Oil", "Crude", "النفط"],
      affectedSceneIds: ["scene-2"],
    },
  ];

  const claims = [
    {
      id: "claim-1",
      claim: "تراجع الأسهم بنسبة 4% عند ارتفاع أسعار الفائدة.",
      source: "بيانات التداول الرسمية",
      verified: true,
      sceneIds: ["scene-1", "scene-2"],
    },
  ];

  return (
    <div
      className="border rounded-lg overflow-hidden my-3"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium border-b"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--paper)",
          background: "var(--surface-2)",
        }}
      >
        <div className="flex items-center gap-2">
          <Database size={14} className="text-amber-400" />
          <span>شبكة الكيانات وسجل الادعاءات (Entity Graph & Claims Ledger)</span>
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 text-xs">
          {/* Canonical Entities */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 font-medium" style={{ color: "var(--text-muted)" }}>
              <Tag size={12} />
              <span>الكيانات المعتمدة في الحلقة ({canonicalEntities.length})</span>
            </div>
            <div className="space-y-2">
              {canonicalEntities.map((ent) => (
                <div
                  key={ent.id}
                  className="p-2 rounded border"
                  style={{
                    background: "var(--ink-navy)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{ent.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">
                      {ent.type}
                    </span>
                  </div>
                  <p className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>
                    {ent.description}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      المشاهد المتأثرة:
                    </span>
                    {ent.affectedSceneIds.map((sid) => (
                      <span
                        key={sid}
                        className="px-1 py-0.2 text-[9px] rounded bg-blue-500/20 text-blue-300"
                      >
                        {sid}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claims Ledger */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 font-medium" style={{ color: "var(--text-muted)" }}>
              <FileText size={12} />
              <span>سجل الادعاءات الموثقة (Claims Ledger)</span>
            </div>
            <div className="space-y-1.5">
              {claims.map((c) => (
                <div
                  key={c.id}
                  className="p-2 rounded border flex items-start gap-2"
                  style={{
                    background: "var(--ink-navy)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <ShieldCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[11px] text-white font-medium">{c.claim}</p>
                    <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                      <span>المصدر: {c.source}</span>
                      <span className="text-emerald-400">مُتحقق منه ✅</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
