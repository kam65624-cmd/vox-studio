"use client";

import { useState } from "react";
import { StoryboardPanel } from "@/components/production/StoryboardPanel";
import { MentorPanel } from "@/components/production/MentorPanel";
import RefilmQueuePanel from "@/components/production/RefilmQueuePanel";
import HumanizationInspector from "@/components/production/HumanizationInspector";
import { ProductionPipelinePanel } from "@/components/production/ProductionPipelinePanel";
import { QualityGatesPanel } from "@/components/production/QualityGatesPanel";
import { TopBar } from "@/components/layout/TopBar";
import {
  Play,
  Maximize2,
  LayoutPanelLeft,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

const MOCK_SCENE_IDS = ["scene-1", "scene-2", "scene-3"];

type ActivePanel = "storyboard" | "mentor" | "both";

export default function ProductionWorkspacePage() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("both");
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--ink-navy)" }}>
      {/* Top bar with episode context */}
      <TopBar
        projectName="تقارير أسواق المال"
        episodeTitle="ماذا يحدث لأسواق المال؟"
        status="MENTOR_REVIEW"
        mentorScore={87}
      />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden gap-px" style={{ background: "var(--border-subtle)" }}>
        {/* Left: Storyboard (conditionally shown) */}
        {(activePanel === "storyboard" || activePanel === "both") && (
          <div
            className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
            style={{ background: "var(--ink-navy)" }}
          >
            <StoryboardPanel />
          </div>
        )}

        {/* Center: Canvas / Preview */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: "var(--ink-navy)" }}
        >
          {/* Canvas toolbar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
            style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center gap-2">
              <button
                className={`btn-ghost p-1.5 ${activePanel === "both" || activePanel === "storyboard" ? "text-primary" : ""}`}
                onClick={() =>
                  setActivePanel(activePanel === "storyboard" ? "mentor" : "both")
                }
                title="لوحة المشاهد"
              >
                <LayoutPanelLeft size={14} />
              </button>
              <button
                className={`btn-ghost p-1.5 ${activePanel === "both" || activePanel === "mentor" ? "text-primary" : ""}`}
                onClick={() =>
                  setActivePanel(activePanel === "mentor" ? "storyboard" : "both")
                }
                title="مراجعة المنتور"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                معاينة | المشهد 1
              </span>
              <button className="btn-ghost p-1.5" title="تكبير">
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {/* Background gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(31,33,38,0.8) 0%, var(--ink-navy) 70%)",
              }}
            />

            {/* Video preview placeholder */}
            <div
              className="relative rounded-lg overflow-hidden shadow-2xl"
              style={{
                width: "min(100%, 640px)",
                aspectRatio: "16/9",
                background: "var(--charcoal)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* VOX Studio scene mockup */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "var(--charcoal)" }}
              >
                {/* Simulated scene content */}
                <div className="text-center space-y-3">
                  <div
                    className="vox-display text-4xl"
                    style={{ color: "var(--paper)", opacity: 0.15 }}
                  >
                    HOST SCENE
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    معاينة المشهد 1 — استضافة
                  </div>
                </div>

                {/* Simulated paper texture overlay */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 80%, var(--char-orange) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--mustard) 0%, transparent 40%)",
                  }}
                />

                {/* Play button overlay */}
                <button
                  className="absolute inset-0 flex items-center justify-center group"
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label="تشغيل المعاينة"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: isPlaying
                        ? "rgba(217,75,61,0.9)"
                        : "rgba(242,237,226,0.1)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(242,237,226,0.2)",
                    }}
                  >
                    {isPlaying ? (
                      <Loader2
                        size={20}
                        className="animate-spin"
                        style={{ color: "var(--paper)" }}
                      />
                    ) : (
                      <Play
                        size={20}
                        style={{ color: "var(--paper)", marginInlineStart: "3px" }}
                      />
                    )}
                  </div>
                </button>
              </div>

              {/* Scene info overlay */}
              <div
                className="absolute bottom-0 inset-x-0 px-3 py-2 flex items-center justify-between"
                style={{ background: "rgba(17,24,32,0.8)", backdropFilter: "blur(4px)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--char-orange)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--paper)" }}>
                    المشهد 1 — استضافة
                  </span>
                </div>
                <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                  0:00 / 0:12
                </span>
              </div>
            </div>
          </div>

          {/* Timeline strip */}
          <div
            className="h-16 border-t flex-shrink-0 flex items-center gap-1 px-4 overflow-x-auto"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-1)",
            }}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="flex-shrink-0 h-10 rounded flex items-center justify-center text-xs cursor-pointer transition-all duration-150 hover:opacity-90"
                style={{
                  width: `${[48, 12, 72, 40, 32, 20, 56, 20][i]!}px`,
                  background: i === 0 ? "var(--char-orange)" :
                               i === 1 ? "var(--border-subtle)" :
                               i === 3 ? "var(--deep-teal)" :
                               "var(--surface-2)",
                  border: i === 0 ? "none" : "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  fontSize: "9px",
                }}
              >
                {i + 1}
              </div>
            ))}
            <div className="flex-1" />
            <span
              className="text-xs tabular-nums flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              المجموع: 1:15
            </span>
          </div>
        </div>

        {/* Right: Mentor + Refilm + Humanization panels */}
        {(activePanel === "mentor" || activePanel === "both") && (
          <div
            className="w-[22rem] flex-shrink-0 overflow-y-auto flex flex-col gap-0"
            style={{ background: "var(--ink-navy)" }}
          >
            <MentorPanel />
            
            <div style={{ padding: "12px 12px 0", flexShrink: 0 }}>
              <div className="h-64 mb-3">
                <ProductionPipelinePanel episodeId="1" />
              </div>
              <div className="h-64 mb-3">
                <QualityGatesPanel episodeId="1" />
              </div>
              <RefilmQueuePanel
                episodeId="1"
                sceneIds={MOCK_SCENE_IDS}
              />
            </div>
            <div style={{ padding: "12px", flexShrink: 0 }}>
              <HumanizationInspector episodeId="1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
