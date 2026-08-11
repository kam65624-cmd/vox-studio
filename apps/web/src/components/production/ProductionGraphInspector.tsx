"use client";

import React, { useState } from "react";
import { ProductionGraph, ProductionNode, ShotNode } from "@vox/contracts";

interface ProductionGraphInspectorProps {
  productionGraph?: ProductionGraph;
  onRefresh?: () => void;
}

export function ProductionGraphInspector({
  productionGraph,
  onRefresh,
}: ProductionGraphInspectorProps) {
  const [activeTab, setActiveTab] = useState<"shots" | "nodes" | "dependencies">("shots");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  if (!productionGraph) {
    return (
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/80 text-zinc-400 text-center">
        <p className="text-sm font-medium">مخطط الإنتاج وتبعية اللقطات غير متوفر حالياً.</p>
        <p className="text-xs text-zinc-500 mt-1">قم بتحليل السكربت لتوليد مخطط الإنتاج الشامل (Production Graph).</p>
      </div>
    );
  }

  const { shots = [], nodes = [], estimatedGenerationCostUsd = 0, totalDurationSeconds = 0 } = productionGraph;

  const readyNodesCount = nodes.filter((n) => n.status === "READY").length;
  const pendingNodesCount = nodes.filter((n) => n.status === "PENDING").length;

  const filteredNodes = nodes.filter((n) => {
    if (statusFilter === "ALL") return true;
    return n.status === statusFilter;
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="p-5 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-base font-semibold text-zinc-100">
              مخطط التبعية والتوليد الإنتاجي (P0-E Graph)
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Production Dependency & Shot Pipeline Graph — VOX Studio Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
            <span className="text-zinc-500">التكلفة التقديرية:</span>
            <span className="font-semibold text-emerald-400">${estimatedGenerationCostUsd.toFixed(2)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
            <span className="text-zinc-500">المدة الكلية:</span>
            <span className="font-semibold text-amber-400">{totalDurationSeconds}ث</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              تحديث المخطط
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-x-reverse divide-zinc-800 border-b border-zinc-800 bg-zinc-900/30 text-center">
        <div className="p-3">
          <div className="text-xs text-zinc-500">إجمالي اللقطات (Shots)</div>
          <div className="text-lg font-bold text-zinc-100">{shots.length}</div>
        </div>
        <div className="p-3">
          <div className="text-xs text-zinc-500">عقد الإنتاج (Nodes)</div>
          <div className="text-lg font-bold text-zinc-100">{nodes.length}</div>
        </div>
        <div className="p-3">
          <div className="text-xs text-zinc-500">جاهزة للتنفيذ</div>
          <div className="text-lg font-bold text-emerald-400">{readyNodesCount}</div>
        </div>
        <div className="p-3">
          <div className="text-xs text-zinc-500">قيد الانتظار</div>
          <div className="text-lg font-bold text-amber-400">{pendingNodesCount}</div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="px-5 pt-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("shots")}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "shots"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            شجرة اللقطات ({shots.length})
          </button>
          <button
            onClick={() => setActiveTab("nodes")}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "nodes"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            عقد الإنتاج والمهام ({nodes.length})
          </button>
          <button
            onClick={() => setActiveTab("dependencies")}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "dependencies"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            متطلبات الاستوديو والأسلوب
          </button>
        </div>

        {activeTab === "nodes" && (
          <div className="pb-2 flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500">تصفية:</span>
            {["ALL", "READY", "PENDING", "FAILED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  statusFilter === st
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-5 max-h-96 overflow-y-auto space-y-3">
        {activeTab === "shots" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shots.map((shot: ShotNode) => (
              <div
                key={shot.id}
                className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                      لقطة #{shot.sequenceIndex} • {shot.shotType}
                    </span>
                    <span className="text-[11px] text-amber-400 font-medium">
                      {shot.durationSeconds} ثواني
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 mb-1">
                    {shot.subject}
                  </div>
                  <div className="text-[11px] text-zinc-400 space-y-0.5">
                    <div><span className="text-zinc-500">التأطير:</span> {shot.framing}</div>
                    <div><span className="text-zinc-500">حركة الكاميرا:</span> {shot.cameraMovement}</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-zinc-500">التبعيات:</span>
                  {shot.dependencies.map((depId) => (
                    <span
                      key={depId}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px] font-mono"
                    >
                      {depId}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "nodes" && (
          <div className="space-y-2">
            {filteredNodes.map((node: ProductionNode) => (
              <div
                key={node.id}
                className="p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/40 flex items-center justify-between gap-3 hover:bg-zinc-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold font-mono ${
                      node.status === "READY"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                        : node.status === "FAILED"
                        ? "bg-rose-950/80 text-rose-400 border border-rose-800"
                        : "bg-amber-950/80 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {node.status}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-zinc-200">{node.label}</div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      ID: {node.id} • Type: {node.type}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-400">
                    ${node.costEstimateUsd.toFixed(2)}
                  </div>
                  {node.dependencies.length > 0 && (
                    <div className="text-[10px] text-zinc-500">
                      {node.dependencies.length} تبعية
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "dependencies" && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-300">مقبض الشخصية (Character Rig)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-[10px]">READY</span>
              </div>
              <p className="text-xs text-zinc-400">
                Prof. Tradeo Puppet & Wardrobe Setup — تم التحقق من مطابقة الزي وتوفر الحركات الجسدية.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-300">بيئة الاستوديو (Studio Environment)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-[10px]">READY</span>
              </div>
              <p className="text-xs text-zinc-400">
                Tradeo Editorial Study — الإضاءة الدافئة وخلفية الجريدة والمكتب المعتمد في VOX.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-300">مهارة الأسلوب (Style Skill)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-[10px]">READY</span>
              </div>
              <p className="text-xs text-zinc-400">
                VOX Mixed Media Editorial Preset — أسلوب القص واللصق الورقي وخطوط Anton والتعليقات بالماركر الأحمر.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
