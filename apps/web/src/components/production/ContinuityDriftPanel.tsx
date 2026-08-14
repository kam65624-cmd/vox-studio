"use client";

import React, { useState } from "react";
import { ContinuityReport, DriftViolation } from "@vox/contracts";
import { ShieldCheck, AlertTriangle, CheckCircle2, Wrench, RefreshCw } from "lucide-react";

interface ContinuityDriftPanelProps {
  report?: ContinuityReport;
  onRunCheck?: () => void;
}

const sampleReport: ContinuityReport = {
  id: "cont-sample-001",
  episodeId: "1",
  overallContinuityScore: 92,
  violations: [
    {
      id: "drift-cam-001",
      driftType: "CAMERA_JUMP",
      severity: "WARNING",
      sceneAId: "s1",
      sceneBId: "s2",
      description: "قفزة كاميرا متتالية (Jump Cut) بين مشهدين قريبين (CLOSE) بدون تداخل ورقي.",
      fixRecommendation: "إضافة انتقال ورقي (Paper Tear) أو تغيير زاوية المشهد الثاني إلى WIDE.",
    },
  ],
  cleanSceneIds: ["s1", "s3", "s4", "s5"],
  checkedAt: new Date().toISOString(),
};

export function ContinuityDriftPanel({
  report = sampleReport,
  onRunCheck,
}: ContinuityDriftPanelProps) {
  const [activeTab, setActiveTab] = useState<"all" | "violations" | "clean">("all");

  const score = report.overallContinuityScore;
  const violations = report.violations || [];
  const cleanCount = report.cleanSceneIds?.length || 0;

  const scoreColorClass =
    score >= 90
      ? "text-emerald-400 border-emerald-800 bg-emerald-950/40"
      : score >= 70
      ? "text-amber-400 border-amber-800 bg-amber-950/40"
      : "text-rose-400 border-rose-800 bg-rose-950/40";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              كاشف الاتساق ومنع الانحراف (Continuity & Drift)
            </h3>
            <p className="text-[11px] text-zinc-400">
              P0-F Visual Continuity & Style Drift Detection Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-lg border text-xs font-bold font-mono ${scoreColorClass}`}>
            درجة الاتساق: {score}/100
          </div>
          {onRunCheck && (
            <button
              onClick={onRunCheck}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="إعادة الفحص"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-2 border-b border-zinc-800 flex items-center gap-4 bg-zinc-900/20 text-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 border-b-2 font-medium transition-colors ${
            activeTab === "all"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          النظرة العامة
        </button>
        <button
          onClick={() => setActiveTab("violations")}
          className={`pb-2 border-b-2 font-medium transition-colors ${
            activeTab === "violations"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          الانحرافات المكتشفة ({violations.length})
        </button>
        <button
          onClick={() => setActiveTab("clean")}
          className={`pb-2 border-b-2 font-medium transition-colors ${
            activeTab === "clean"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          المشاهد المتسقة ({cleanCount})
        </button>
      </div>

      {/* Body */}
      <div className="p-4 max-h-72 overflow-y-auto space-y-3">
        {activeTab === "all" && (
          <div className="space-y-3">
            {violations.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-center">
                <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-1" />
                <p className="text-xs font-semibold text-emerald-300">
                  اتساق كامل بنسبة 100% بين جميع المشاهد!
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  لم يتم العثور على أي انحرافات في زوايا الكاميرا أو الألوان أو قواعد الأسلوب.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-300">
                  الانحرافات التي تحتاجا لمراجعة ({violations.length}):
                </div>
                {violations.map((v: DriftViolation) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-lg border border-amber-900/40 bg-amber-950/20 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <AlertTriangle size={13} className="text-amber-400" />
                        {v.driftType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                        {v.severity}
                      </span>
                    </div>
                    <p className="text-zinc-300">{v.description}</p>
                    <div className="pt-1 flex items-center justify-between border-t border-amber-900/30 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Wrench size={11} className="text-emerald-400" />
                        التوصية: {v.fixRecommendation}
                      </span>
                      <button className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold text-[10px] transition-colors">
                        إصلاح تلقائي
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "violations" && (
          <div className="space-y-2">
            {violations.map((v: DriftViolation) => (
              <div
                key={v.id}
                className="p-3 rounded-lg border border-amber-900/40 bg-amber-950/20 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-semibold">{v.driftType}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 font-mono">
                    {v.severity}
                  </span>
                </div>
                <p className="text-zinc-300">{v.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "clean" && (
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 text-xs space-y-1">
            <p className="text-zinc-300 font-medium">المشاهد المتسقة والمحققة للقواعد:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {report.cleanSceneIds?.map((scId) => (
                <span
                  key={scId}
                  className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-[10px] font-mono"
                >
                  {scId} ✓
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
