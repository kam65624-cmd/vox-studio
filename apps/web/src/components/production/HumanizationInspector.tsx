"use client";

import React, { useState } from "react";
import type { HumanizationReport, HumanizationIssue, HumanizationPlan } from "@vox/contracts";

// ─── Mock data builder ─────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  TOO_REPETITIVE:  { icon: "🔁", color: "#F5A623", label: "تكرار مفرط" },
  TOO_PREDICTABLE: { icon: "📊", color: "#9B59B6", label: "نمط متوقع جداً" },
  TOO_MECHANICAL:  { icon: "⚙️", color: "#E74C3C", label: "إيقاع آلي" },
  TOO_DENSE:       { icon: "📦", color: "#3498DB", label: "كثافة زائدة" },
  TOO_SLOW:        { icon: "🐢", color: "#95A5A6", label: "إيقاع بطيء" },
  TOO_FAST:        { icon: "⚡", color: "#1ABC9C", label: "إيقاع سريع" },
};

function buildMockReport(episodeId: string): HumanizationReport {
  return {
    id: `hum-report-${episodeId}`,
    episodeId,
    rhythmScore: 62,
    repetitionCount: 3,
    issues: [
      {
        id: "hum-1",
        type: "TOO_MECHANICAL",
        sceneId: "scene-1",
        description: "تكرار مدة المشهد (8ث) لأربع مشاهد متتالية ينشئ إيقاعاً آلياً يفقد المشاهد التشويق.",
        suggestedVariation: "تعديل المشهد الثالث إلى 9ث والرابع إلى 7ث لإيجاد تنوع إيقاعي طبيعي.",
      },
      {
        id: "hum-2",
        type: "TOO_REPETITIVE",
        sceneId: "scene-2",
        description: "تكرار إطار الكاميرا MEDIUM لثلاث مشاهد متتالية يُضعف ديناميكية السرد البصري.",
        suggestedVariation: "تحويل المشهد الثاني إلى OVER_SHOULDER للحفاظ على توتر بصري.",
      },
      {
        id: "hum-3",
        type: "TOO_PREDICTABLE",
        sceneId: "scene-3",
        description: "تسلسل انتقال المشاهد يتبع نمطاً واحداً (Paper Tear دائماً) دون تنويع.",
        suggestedVariation: "استخدام Paper Fold في مشهدين بديلاً لكسر التوقعية مع الحفاظ على Style Skill.",
      },
    ],
    evaluatedAt: new Date().toISOString(),
  };
}

// ─── Score ring ────────────────────────────────────────────────────────────

function RhythmRing({ score }: { score: number }) {
  const size = 80;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 80 ? "#2ECC71" : score >= 55 ? "#F5A623" : "#E74C3C";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x={size / 2} y={size / 2 + 5}
        textAnchor="middle" fill={color} fontSize={17} fontWeight="bold"
        style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%" }}>
        {score}
      </text>
    </svg>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

interface HumanizationInspectorProps {
  episodeId: string;
}

export default function HumanizationInspector({ episodeId }: HumanizationInspectorProps) {
  const [report, setReport] = useState<HumanizationReport | null>(null);
  const [plan, setPlan] = useState<HumanizationPlan | null>(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      setReport(buildMockReport(episodeId));
      setPlan(null);
      setApplied(false);
      setLoading(false);
    }, 600);
  };

  const handleApply = () => {
    if (!report) return;
    const mockPlan: HumanizationPlan = {
      id: `hum-plan-${episodeId}`,
      episodeId,
      issues: report.issues,
      plannedChanges: [
        { sceneId: "scene-1", changeType: "DURATION_VARIATION", fromValue: "8s", toValue: "9s" },
        { sceneId: "scene-2", changeType: "SHOT_FRAMING_VARIATION", fromValue: "MEDIUM", toValue: "OVER_SHOULDER" },
        { sceneId: "scene-3", changeType: "TRANSITION_VARIATION", fromValue: "Paper Tear", toValue: "Paper Fold" },
      ],
      protectedConstraints: [
        "Strict Creative DNA Lock: VOX Mixed Media Editorial",
        "Color Hex Lock: #FF3B30",
        "Character Puppet Continuity",
        "Wardrobe & Prop Continuity",
        "Script & Claim Consistency",
      ],
      createdAt: new Date().toISOString(),
    };
    setPlan(mockPlan);
    setApplied(true);
    setReport((prev) =>
      prev ? { ...prev, rhythmScore: Math.min(100, prev.rhythmScore + 22), repetitionCount: 0, issues: [] } : prev
    );
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(20,35,50,0.95) 100%)",
      border: "1px solid rgba(26,188,156,0.25)",
      borderRadius: 16, padding: 24,
      fontFamily: "'Cairo', 'Inter', sans-serif",
      direction: "rtl",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, #1ABC9C, #3498DB)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>🎵</div>
        <div>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>
            مدير الإنسانية P0-H
          </h3>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            كشف التكرار الإيقاعي دون انتهاك Creative DNA
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            marginRight: "auto", padding: "8px 18px", borderRadius: 8, border: "none",
            background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #1ABC9C, #3498DB)",
            color: "#fff", fontWeight: 700, fontSize: 12, cursor: loading ? "wait" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "⏳ جاري التحليل..." : "🔬 تحليل الإيقاع"}
        </button>
      </div>

      {/* Pre-analyze state */}
      {!report && !loading && (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          background: "rgba(255,255,255,0.02)", borderRadius: 12,
          border: "1px dashed rgba(255,255,255,0.1)",
        }}>
          <p style={{ fontSize: 32, margin: "0 0 8px 0" }}>🎵</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            اضغط «تحليل الإيقاع» لفحص التكرار في الحلقة
          </p>
        </div>
      )}

      {/* Report */}
      {report && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Score header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <RhythmRing score={report.rhythmScore} />
            <div>
              <p style={{ margin: "0 0 4px 0", color: "#fff", fontWeight: 700, fontSize: 15 }}>
                درجة الإيقاع البشري: {report.rhythmScore}/100
              </p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                {report.repetitionCount > 0
                  ? `${report.repetitionCount} مشكلة تكرار مكتشفة`
                  : "✅ الإيقاع طبيعي — لا تكرار"}
              </p>
              {applied && (
                <p style={{ margin: "6px 0 0 0", color: "#1ABC9C", fontWeight: 600, fontSize: 11 }}>
                  ✅ تم تطبيق خطة الإنسانية بنجاح
                </p>
              )}
            </div>
          </div>

          {/* Issues */}
          {report.issues.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 12 }}>
                🔍 المشاكل المكتشفة
              </p>
              {report.issues.map((issue: HumanizationIssue) => {
                const meta = TYPE_META[issue.type] || { icon: "⚠️", color: "#F5A623", label: issue.type };
                return (
                  <div key={issue.id} style={{
                    background: `${meta.color}0D`, border: `1px solid ${meta.color}33`,
                    borderRadius: 10, padding: 14,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{meta.icon}</span>
                      <span style={{ color: meta.color, fontWeight: 700, fontSize: 12 }}>
                        {meta.label}
                      </span>
                      {issue.sceneId && (
                        <span style={{
                          marginRight: "auto", padding: "2px 8px", borderRadius: 4, fontSize: 10,
                          background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
                        }}>{issue.sceneId}</span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 6px 0", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                      {issue.description}
                    </p>
                    <div style={{
                      background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "8px 10px",
                      borderRight: `3px solid ${meta.color}`,
                    }}>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                        💡 <strong style={{ color: "rgba(255,255,255,0.7)" }}>التنويع المقترح: </strong>
                        {issue.suggestedVariation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Apply button */}
          {report.issues.length > 0 && !applied && (
            <button
              onClick={handleApply}
              style={{
                padding: "12px 24px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #1ABC9C, #3498DB)",
                color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              🎵 تطبيق خطة الإنسانية (مع الحفاظ على Creative DNA)
            </button>
          )}

          {/* Plan applied */}
          {plan && applied && (
            <div style={{
              background: "rgba(26,188,156,0.08)", border: "1px solid rgba(26,188,156,0.2)",
              borderRadius: 12, padding: 16,
            }}>
              <p style={{ margin: "0 0 10px 0", color: "#1ABC9C", fontWeight: 700, fontSize: 13 }}>
                ✅ التغييرات المطبقة
              </p>
              {plan.plannedChanges.map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12,
                }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{c.sceneId}</span>
                  <span style={{ color: "#E74C3C" }}>{c.fromValue}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
                  <span style={{ color: "#2ECC71" }}>{c.toValue}</span>
                  <span style={{
                    padding: "1px 6px", borderRadius: 4, fontSize: 10,
                    background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)",
                  }}>{c.changeType}</span>
                </div>
              ))}
              <div style={{
                marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)",
              }}>
                <p style={{ margin: "0 0 6px 0", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700 }}>
                  🔒 قيود محمية
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {plan.protectedConstraints.map((c, i) => (
                    <span key={i} style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: 10,
                      background: "rgba(155,89,182,0.15)", color: "#C39BD3",
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
