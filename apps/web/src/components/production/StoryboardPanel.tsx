"use client";

import { useState } from "react";
import {
  ChevronDown,
  RefreshCw,
  Eye,
  Lock,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Film,
} from "lucide-react";

type SceneType =
  | "HOST"
  | "EXPLAINER"
  | "MINI_HOST"
  | "REACTION"
  | "DATA"
  | "METAPHOR"
  | "ARCHIVE"
  | "GRAPHIC"
  | "TRANSITION"
  | "OUTRO";

type SceneStatus = "DRAFT" | "GENERATING" | "DONE" | "ERROR" | "LOCKED";

interface Scene {
  id: string;
  index: number;
  type: SceneType;
  purpose: string;
  durationSeconds: number;
  status: SceneStatus;
  mentorScore?: number;
  previewUrl?: string;
}

const sceneTypeColors: Record<SceneType, string> = {
  HOST: "var(--char-orange)",
  EXPLAINER: "var(--mustard)",
  MINI_HOST: "var(--char-orange)",
  REACTION: "var(--vixor-red)",
  DATA: "#3DD6C8",
  METAPHOR: "var(--mustard)",
  ARCHIVE: "var(--warm-brown)",
  GRAPHIC: "var(--deep-teal)",
  TRANSITION: "var(--border-accent)",
  OUTRO: "var(--text-muted)",
};

const sceneTypeLabels: Record<SceneType, string> = {
  HOST: "استضافة",
  EXPLAINER: "شرح VOX",
  MINI_HOST: "مصغّر",
  REACTION: "ردة فعل",
  DATA: "بيانات",
  METAPHOR: "استعارة",
  ARCHIVE: "أرشيف",
  GRAPHIC: "رسوم",
  TRANSITION: "انتقال",
  OUTRO: "خاتمة",
};

const mockScenes: Scene[] = [
  {
    id: "s1",
    index: 1,
    type: "HOST",
    purpose: "الافتتاح وطرح السؤال: ماذا يحدث لأسواق المال؟",
    durationSeconds: 12,
    status: "DONE",
    mentorScore: 91,
  },
  {
    id: "s2",
    index: 2,
    type: "TRANSITION",
    purpose: "انتقال ورقي من الاستديو إلى عالم VOX",
    durationSeconds: 3,
    status: "DONE",
    mentorScore: 95,
  },
  {
    id: "s3",
    index: 3,
    type: "EXPLAINER",
    purpose: "شرح آلية رفع الفائدة وتأثيرها على الأسواق",
    durationSeconds: 18,
    status: "DONE",
    mentorScore: 84,
  },
  {
    id: "s4",
    index: 4,
    type: "DATA",
    purpose: "رسم بياني لأداء المؤشرات خلال 12 شهراً",
    durationSeconds: 10,
    status: "GENERATING",
  },
  {
    id: "s5",
    index: 5,
    type: "MINI_HOST",
    purpose: "Prof. Tradeo يعلّق ساخراً على قرار الفيدرالي",
    durationSeconds: 8,
    status: "DRAFT",
  },
  {
    id: "s6",
    index: 6,
    type: "REACTION",
    purpose: "ردة فعل Prof. Tradeo المندهشة",
    durationSeconds: 5,
    status: "DRAFT",
  },
  {
    id: "s7",
    index: 7,
    type: "HOST",
    purpose: "الخلاصة والتوقعات المستقبلية",
    durationSeconds: 14,
    status: "DRAFT",
  },
  {
    id: "s8",
    index: 8,
    type: "OUTRO",
    purpose: "خاتمة VOX مع الشعار",
    durationSeconds: 5,
    status: "DRAFT",
  },
];

function SceneStatusIcon({ status }: { status: SceneStatus }) {
  switch (status) {
    case "DONE":
      return <CheckCircle size={12} style={{ color: "#3DD6C8" }} />;
    case "GENERATING":
      return <Loader2 size={12} className="animate-spin" style={{ color: "var(--mustard)" }} />;
    case "ERROR":
      return <AlertTriangle size={12} style={{ color: "var(--vixor-red)" }} />;
    case "LOCKED":
      return <Lock size={12} style={{ color: "var(--text-muted)" }} />;
    default:
      return <div className="w-2 h-2 rounded-full" style={{ background: "var(--border-accent)" }} />;
  }
}

import { EntityGraphPanel } from "./EntityGraphPanel";
import { ProductionGraphInspector } from "./ProductionGraphInspector";
import { ContinuityDriftPanel } from "./ContinuityDriftPanel";

const sampleProductionGraph = {
  id: "prod-graph-sample",
  episodeId: "1",
  shots: [
    {
      id: "shot-s1-a",
      sceneId: "s1",
      sequenceIndex: 1,
      shotType: "MEDIUM" as const,
      framing: "Eye-level key subject placement",
      cameraMovement: "Slow Push In",
      subject: "Prof. Tradeo",
      durationSeconds: 6,
      dependencies: ["node-char-rig", "node-studio-env", "node-style-skill"],
    },
    {
      id: "shot-s1-b",
      sceneId: "s1",
      sequenceIndex: 2,
      shotType: "CLOSE" as const,
      framing: "Tight focus on expression",
      cameraMovement: "Subtle lateral drift",
      subject: "Prof. Tradeo",
      durationSeconds: 6,
      dependencies: ["shot-s1-a"],
    },
  ],
  nodes: [
    { id: "node-char-rig", type: "CHARACTER_RIG" as const, label: "Prof. Tradeo Puppet & Wardrobe", status: "READY" as const, dependencies: [], costEstimateUsd: 0 },
    { id: "node-studio-env", type: "STUDIO_ENVIRONMENT" as const, label: "Tradeo Editorial Study BG", status: "READY" as const, dependencies: [], costEstimateUsd: 0 },
    { id: "node-style-skill", type: "STYLE_SKILL" as const, label: "VOX Mixed Media Editorial", status: "READY" as const, dependencies: [], costEstimateUsd: 0 },
    { id: "node-gen-s1-a", type: "SHOT_GENERATION" as const, label: "Generate Shot 1 (MEDIUM)", sceneId: "s1", shotId: "shot-s1-a", status: "PENDING" as const, dependencies: ["node-char-rig", "node-studio-env", "node-style-skill"], costEstimateUsd: 0.30 },
    { id: "node-gen-s1-b", type: "SHOT_GENERATION" as const, label: "Generate Shot 2 (CLOSE)", sceneId: "s1", shotId: "shot-s1-b", status: "PENDING" as const, dependencies: ["shot-s1-a"], costEstimateUsd: 0.30 },
  ],
  totalDurationSeconds: 12,
  estimatedGenerationCostUsd: 0.60,
};

export function StoryboardPanel() {
  const [selectedScene, setSelectedScene] = useState<string | null>("s1");
  const [expandedScene, setExpandedScene] = useState<string | null>(null);

  const totalDuration = mockScenes.reduce((s, sc) => s + sc.durationSeconds, 0);
  const doneCount = mockScenes.filter((s) => s.status === "DONE").length;

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--surface-1)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          <Film size={13} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            لوحة المشاهد
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            {mockScenes.length} مشهد
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")} دقيقة
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="text-xs flex items-center gap-1"
            style={{ color: "#3DD6C8" }}
          >
            <CheckCircle size={11} />
            {doneCount}/{mockScenes.length}
          </div>
          <button className="btn-ghost text-xs py-1 px-2">
            إعادة ترتيب
          </button>
        </div>
      </div>

      {/* Scenes list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* P0-C Entity Graph Panel */}
        <EntityGraphPanel />

        {/* P0-E Production Graph Inspector */}
        <ProductionGraphInspector productionGraph={sampleProductionGraph} />

        {/* P0-F Continuity & Drift Detector Panel */}
        <ContinuityDriftPanel />

        {mockScenes.map((scene) => {
          const isSelected = selectedScene === scene.id;
          const isExpanded = expandedScene === scene.id;

          return (
            <div
              key={scene.id}
              className="card-scene cursor-pointer"
              onClick={() => setSelectedScene(scene.id)}
              style={
                isSelected
                  ? {
                      borderColor: "var(--border-accent)",
                      background: "var(--surface-2)",
                    }
                  : {}
              }
            >
              <div className="flex items-start gap-3">
                {/* Scene type color stripe */}
                <div
                  className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: sceneTypeColors[scene.type] }}
                />

                {/* Number */}
                <div
                  className="text-xs tabular-nums flex-shrink-0 w-4 text-center font-mono mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {scene.index}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: sceneTypeColors[scene.type] }}
                    >
                      {sceneTypeLabels[scene.type]}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {scene.durationSeconds}ث
                    </span>
                    {scene.mentorScore !== undefined && (
                      <span
                        className={`text-xs font-semibold ${
                          scene.mentorScore >= 80
                            ? "mentor-score-high"
                            : scene.mentorScore >= 60
                            ? "mentor-score-medium"
                            : "mentor-score-low"
                        }`}
                      >
                        {scene.mentorScore}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-relaxed line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {scene.purpose}
                  </p>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <SceneStatusIcon status={scene.status} />

                  {isSelected && (
                    <div className="flex items-center gap-0.5">
                      <button
                        className="btn-ghost p-1"
                        title="معاينة"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye size={11} />
                      </button>
                      <button
                        className="btn-ghost p-1"
                        title="إعادة توليد"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RefreshCw size={11} />
                      </button>
                      <button
                        className="btn-ghost p-1"
                        title="تكرار"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedScene(isExpanded ? null : scene.id);
                        }}
                        className="btn-ghost p-1"
                      >
                        <ChevronDown
                          size={11}
                          style={{
                            transform: isExpanded ? "rotate(180deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded scene contract preview */}
              {isExpanded && (
                <div
                  className="mt-3 pt-3 border-t text-xs space-y-1.5 animate-fade-in"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
                >
                  <div className="flex justify-between">
                    <span>النوع</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {sceneTypeLabels[scene.type]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المدة</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {scene.durationSeconds} ثانية
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>الحالة</span>
                    <span style={{ color: "var(--text-secondary)" }}>{scene.status}</span>
                  </div>
                  <div className="pt-1.5 flex gap-2">
                    <button className="btn-secondary text-xs py-1 flex-1">
                      فتح المفتّش
                    </button>
                    <button className="btn-ghost text-xs py-1">
                      <Trash2 size={11} style={{ color: "var(--vixor-red)" }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
