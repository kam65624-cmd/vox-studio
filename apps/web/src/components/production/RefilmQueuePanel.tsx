"use client";

import React, { useState } from "react";
import type {
  RefilmTask,
  RefilmStatus,
  RefilmAction,
  RegenerationImpact,
  PartialRegenerationPlan,
  RepairExecutionResult,
  RecheckResult,
} from "@vox/contracts";

// ─── Local helpers ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<RefilmStatus, string> = {
  OPEN: "#F5A623",
  PLANNED: "#4A90D9",
  RUNNING: "#9B59B6",
  RECHECKING: "#1ABC9C",
  PASSED: "#2ECC71",
  FAILED: "#E74C3C",
  IGNORED: "#95A5A6",
  OVERRIDDEN: "#7F8C8D",
};

const SEVERITY_COLOR: Record<string, string> = {
  BLOCKER: "#E74C3C",
  MAJOR: "#F5A623",
  MINOR: "#3498DB",
  ADVISORY: "#95A5A6",
};

// ─── Mock data builder ─────────────────────────────────────────────────────

function mockTask(episodeId: string, sceneId: string, idx: number): RefilmTask {
  return {
    id: `rtask-${idx}`,
    episodeId,
    sceneId,
    shotId: `shot-s${idx}-a`,
    severity: idx === 0 ? "BLOCKER" : "MAJOR",
    issueType: idx === 0 ? "CONTINUITY_DRIFT" : "VISUAL_QUALITY",
    description: idx === 0
      ? "اللون في المشهد لا يطابق الـ Creative DNA المحدد — انحراف #FF0000 بدلاً من #FF3B30"
      : "مستوى جودة الصورة أقل من 80% — تظهر بكسلة في حواف الشخصية",
    rootCause: idx === 0
      ? "تعارض في متغيرات اللون عند تطبيق نمط VOX Mixed Media Editorial"
      : "دقة التوليد منخفضة بسبب ضغط البيانات في المرحلة السابقة",
    suggestedFix: idx === 0
      ? "إعادة تطبيق Style Lock مع تثبيت متغير الألوان من CreativeDNA"
      : "رفع دقة التوليد إلى 4K واستخدام upscaler للحفاظ على حواف المشهد",
    affectedNodes: [`shot-s${idx}-a`, `shot-s${idx}-b`],
    dependencyImpact: `${idx === 0 ? 3 : 2} عقدة متأثرة في رسم الإنتاج`,
    action: "REPAIR",
    status: idx === 0 ? "OPEN" : "PLANNED",
    repairAttempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Component ─────────────────────────────────────────────────────────────

interface RefilmQueuePanelProps {
  episodeId: string;
  sceneIds?: string[];
}

export default function RefilmQueuePanel({
  episodeId,
  sceneIds = [],
}: RefilmQueuePanelProps) {
  const [tasks, setTasks] = useState<RefilmTask[]>(
    sceneIds.slice(0, 2).map((sid, i) => mockTask(episodeId, sid, i))
  );
  const [selectedTask, setSelectedTask] = useState<RefilmTask | null>(null);
  const [impactReport, setImpactReport] = useState<RegenerationImpact | null>(null);
  const [regenPlan, setRegenPlan] = useState<PartialRegenerationPlan | null>(null);
  const [repairResult, setRepairResult] = useState<{
    repairResult: RepairExecutionResult;
    recheckResult: RecheckResult;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "impact" | "plan" | "result">("queue");

  // Simulate impact analysis
  const handleImpactAnalysis = (task: RefilmTask) => {
    setSelectedTask(task);
    const mockImpact: RegenerationImpact = {
      targetNodeId: task.shotId || task.sceneId,
      directlyAffectedNodes: task.affectedNodes,
      downstreamAffectedNodes: [`voice-s${task.sceneId}`, `motion-s${task.sceneId}`],
      reusableNodes: ["char-rig-tradeo", "studio-tradeo-editorial"],
      mustNotRegenerateNodes: [
        "char-rig-tradeo",
        "studio-tradeo-editorial",
        "style-skill-vox-editorial",
      ],
      estimatedScope: `Surgical scope: ${task.affectedNodes.length} direct, 2 downstream. Preserving 3 unrelated nodes.`,
      estimatedCostUsd: 1.25,
      estimatedDurationSeconds: 35,
    };
    setImpactReport(mockImpact);
    setActiveTab("impact");
  };

  // Simulate regeneration plan
  const handleCreatePlan = () => {
    if (!impactReport || !selectedTask) return;
    const plan: PartialRegenerationPlan = {
      id: `regen-plan-${Date.now().toString(36)}`,
      episodeId,
      reason: `Surgical regeneration for failed node: ${selectedTask.issueType}`,
      rootNodeId: impactReport.targetNodeId,
      affectedNodeIds: [
        ...impactReport.directlyAffectedNodes,
        ...impactReport.downstreamAffectedNodes,
      ],
      preservedNodeIds: impactReport.mustNotRegenerateNodes,
      regenerationOrder: [
        ...impactReport.directlyAffectedNodes,
        ...impactReport.downstreamAffectedNodes,
      ],
      requiredAssets: ["Prof. Tradeo Character Rig", "Tradeo Editorial Study Studio"],
      creativeDnaRequirements: ["VOX Mixed Media Editorial", "Primary: #0A0A0A", "Accent: #FF3B30"],
      styleSkillRequirements: ["VOX Mixed Media Editorial", "Snappy 12fps paper stop-motion"],
      continuityConstraints: [
        "الحفاظ على استمرارية ملابس الشخصية",
        "عدم تعديل الصوت أو المؤثرات الصوتية",
        "عدم إعادة توليد مشاهد غير متأثرة",
      ],
      expectedOutput: `إعادة توليد ${impactReport.directlyAffectedNodes.length + impactReport.downstreamAffectedNodes.length} عقدة مع الحفاظ على ${impactReport.mustNotRegenerateNodes.length} عقدة.`,
      validationGates: ["فحص انجراف الاستمرارية", "مراجعة Mentor QA"],
      createdAt: new Date().toISOString(),
    };
    setRegenPlan(plan);
    setActiveTab("plan");
  };

  // Simulate repair lifecycle
  const handleRepair = (task: RefilmTask) => {
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: "RUNNING" as RefilmStatus, repairAttempts: (t.repairAttempts || 0) + 1 } : t
    );
    setTasks(updatedTasks);

    setTimeout(() => {
      const passed = task.repairAttempts < 2;
      const finalTasks = updatedTasks.map((t) =>
        t.id === task.id
          ? { ...t, status: (passed ? "PASSED" : "FAILED") as RefilmStatus, updatedAt: new Date().toISOString() }
          : t
      );
      setTasks(finalTasks);
      setRepairResult({
        repairResult: {
          taskId: task.id,
          success: passed,
          repairedSceneIds: [task.sceneId],
          executionNotes: passed
            ? `الإصلاح نجح في المحاولة ${task.repairAttempts + 1}: ${task.suggestedFix}`
            : `تجاوز الحد الأقصى للمحاولات. يرجى مراجعة يدوية.`,
          timestamp: new Date().toISOString(),
        },
        recheckResult: {
          taskId: task.id,
          passed,
          newQualityScore: passed ? 88 : 52,
          remainingBlockersCount: passed ? 0 : 1,
          decision: passed ? "APPROVE" : "ESCALATE",
          recheckedAt: new Date().toISOString(),
        },
      });
      setActiveTab("result");
    }, 800);
  };

  const handleActionChange = (taskId: string, action: RefilmAction) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, action } : t))
    );
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,20,50,0.95) 100%)",
      border: "1px solid rgba(255,59,48,0.25)",
      borderRadius: 16,
      padding: 24,
      fontFamily: "'Cairo', 'Inter', sans-serif",
      direction: "rtl",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, #FF3B30, #9B59B6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>🎬</div>
        <div>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>
            قائمة إعادة التصوير P0-H
          </h3>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            {tasks.length} مهمة · تحليل جراحي · حلقة الإصلاح التلقائي
          </p>
        </div>
        <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
          <span style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11,
            background: "rgba(231,76,60,0.2)", color: "#E74C3C", fontWeight: 600,
          }}>
            {tasks.filter((t) => t.status === "OPEN" || t.status === "FAILED").length} معلق
          </span>
          <span style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11,
            background: "rgba(46,204,113,0.15)", color: "#2ECC71", fontWeight: 600,
          }}>
            {tasks.filter((t) => t.status === "PASSED").length} اجتاز
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
        {(["queue", "impact", "plan", "result"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: activeTab === tab ? "rgba(255,59,48,0.3)" : "transparent",
              color: activeTab === tab ? "#FF3B30" : "rgba(255,255,255,0.5)",
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 12, transition: "all 0.2s",
            }}
          >
            {tab === "queue" ? "📋 القائمة" : tab === "impact" ? "🔍 التأثير" : tab === "plan" ? "📐 الخطة" : "✅ النتيجة"}
          </button>
        ))}
      </div>

      {/* Queue Tab */}
      {activeTab === "queue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tasks.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 24 }}>
              لا توجد مهام إعادة تصوير حالياً
            </p>
          )}
          {tasks.map((task) => (
            <div key={task.id} style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${STATUS_COLOR[task.status]}33`,
              borderRadius: 12, padding: 16,
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{
                  padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: `${SEVERITY_COLOR[task.severity]}22`,
                  color: SEVERITY_COLOR[task.severity],
                  border: `1px solid ${SEVERITY_COLOR[task.severity]}44`,
                  whiteSpace: "nowrap",
                }}>
                  {task.severity}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px 0", color: "#fff", fontWeight: 600, fontSize: 13 }}>
                    {task.issueType}
                  </p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                    {task.description}
                  </p>
                </div>
                <div style={{
                  padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: `${STATUS_COLOR[task.status]}22`,
                  color: STATUS_COLOR[task.status],
                  border: `1px solid ${STATUS_COLOR[task.status]}44`,
                  whiteSpace: "nowrap",
                }}>
                  {task.status}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {task.affectedNodes.map((n) => (
                  <span key={n} style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 10,
                    background: "rgba(155,89,182,0.2)", color: "#C39BD3",
                  }}>{n}</span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  value={task.action}
                  onChange={(e) => handleActionChange(task.id, e.target.value as RefilmAction)}
                  style={{
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6, color: "#fff", fontSize: 11, padding: "4px 8px", cursor: "pointer",
                  }}
                >
                  {(["REPAIR", "REGENERATE", "IGNORE", "OVERRIDE", "COMPARE"] as RefilmAction[]).map((a) => (
                    <option key={a} value={a} style={{ background: "#1a1a2e" }}>{a}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleImpactAnalysis(task)}
                  style={{
                    padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(74,144,217,0.4)",
                    background: "rgba(74,144,217,0.15)", color: "#4A90D9",
                    fontSize: 11, cursor: "pointer", fontWeight: 600,
                  }}
                >
                  🔍 تحليل التأثير
                </button>

                <button
                  onClick={() => handleRepair(task)}
                  disabled={task.status === "RUNNING" || task.status === "PASSED"}
                  style={{
                    padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,59,48,0.4)",
                    background: task.status === "RUNNING" ? "rgba(155,89,182,0.3)" : "rgba(255,59,48,0.2)",
                    color: task.status === "PASSED" ? "#2ECC71" : "#FF3B30",
                    fontSize: 11, cursor: task.status === "RUNNING" || task.status === "PASSED" ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {task.status === "RUNNING" ? "⏳ جاري..." : task.status === "PASSED" ? "✓ اجتاز" : "🔧 إصلاح"}
                </button>

                {task.repairAttempts > 0 && (
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                    محاولة {task.repairAttempts}/3
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Impact Tab */}
      {activeTab === "impact" && impactReport && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{
            background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.2)",
            borderRadius: 10, padding: 14,
          }}>
            <p style={{ margin: "0 0 8px 0", color: "#E74C3C", fontWeight: 700, fontSize: 13 }}>
              🎯 العقدة المستهدفة
            </p>
            <code style={{ color: "#F39C12", fontSize: 12 }}>{impactReport.targetNodeId}</code>
            <p style={{ margin: "8px 0 0 0", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
              {impactReport.estimatedScope}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "متأثرة مباشرة", nodes: impactReport.directlyAffectedNodes, color: "#E74C3C" },
              { label: "متأثرة لاحقاً", nodes: impactReport.downstreamAffectedNodes, color: "#F5A623" },
              { label: "قابلة للإعادة الاستخدام", nodes: impactReport.reusableNodes, color: "#2ECC71" },
              { label: "محمية — لا تُعاد التوليد", nodes: impactReport.mustNotRegenerateNodes, color: "#9B59B6" },
            ].map(({ label, nodes, color }) => (
              <div key={label} style={{
                background: `${color}11`, border: `1px solid ${color}33`,
                borderRadius: 8, padding: 10,
              }}>
                <p style={{ margin: "0 0 6px 0", color, fontWeight: 700, fontSize: 11 }}>{label}</p>
                {nodes.map((n) => (
                  <div key={n} style={{
                    padding: "2px 6px", borderRadius: 4, fontSize: 10,
                    color: "rgba(255,255,255,0.7)", marginBottom: 3,
                    background: "rgba(255,255,255,0.05)",
                  }}>{n}</div>
                ))}
              </div>
            ))}
          </div>

          <div style={{
            display: "flex", gap: 12,
            background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 12,
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 10 }}>التكلفة المقدرة</p>
              <p style={{ margin: 0, color: "#F5A623", fontSize: 16, fontWeight: 700 }}>
                ${impactReport.estimatedCostUsd}
              </p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 10 }}>الوقت المقدر</p>
              <p style={{ margin: 0, color: "#4A90D9", fontSize: 16, fontWeight: 700 }}>
                {impactReport.estimatedDurationSeconds}ث
              </p>
            </div>
          </div>

          <button
            onClick={handleCreatePlan}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #FF3B30, #9B59B6)",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            📐 إنشاء خطة إعادة التوليد الجراحية
          </button>
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === "plan" && regenPlan && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)",
            borderRadius: 10, padding: 14,
          }}>
            <p style={{ margin: "0 0 4px 0", color: "#2ECC71", fontWeight: 700, fontSize: 13 }}>
              📐 خطة إعادة التوليد الجراحية
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{regenPlan.reason}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "ترتيب التوليد", items: regenPlan.regenerationOrder, icon: "⚡" },
              { label: "محظورات التوليد", items: regenPlan.preservedNodeIds, icon: "🔒" },
              { label: "متطلبات Creative DNA", items: regenPlan.creativeDnaRequirements, icon: "🎨" },
              { label: "قيود الاستمرارية", items: regenPlan.continuityConstraints, icon: "🔗" },
              { label: "بوابات التحقق", items: regenPlan.validationGates, icon: "✅" },
            ].map(({ label, items, icon }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10,
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <p style={{ margin: "0 0 6px 0", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 11 }}>
                  {icon} {label}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {items.map((item, i) => (
                    <span key={i} style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: 10,
                      background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)",
                    }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Tab */}
      {activeTab === "result" && repairResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            background: repairResult.repairResult.success ? "rgba(46,204,113,0.1)" : "rgba(231,76,60,0.1)",
            border: `1px solid ${repairResult.repairResult.success ? "rgba(46,204,113,0.3)" : "rgba(231,76,60,0.3)"}`,
            borderRadius: 12, padding: 16,
          }}>
            <p style={{
              margin: "0 0 8px 0",
              color: repairResult.repairResult.success ? "#2ECC71" : "#E74C3C",
              fontWeight: 700, fontSize: 14,
            }}>
              {repairResult.repairResult.success ? "✅ تم الإصلاح بنجاح" : "❌ فشل الإصلاح — تصعيد للمحرر"}
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              {repairResult.repairResult.executionNotes}
            </p>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10,
          }}>
            {[
              { label: "نقاط الجودة", value: `${repairResult.recheckResult.newQualityScore}%`, color: "#4A90D9" },
              { label: "الحواجز المتبقية", value: String(repairResult.recheckResult.remainingBlockersCount), color: "#F5A623" },
              { label: "القرار", value: repairResult.recheckResult.decision, color: repairResult.recheckResult.passed ? "#2ECC71" : "#E74C3C" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 10, textAlign: "center",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <p style={{ margin: "0 0 4px 0", color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{label}</p>
                <p style={{ margin: 0, color, fontWeight: 700, fontSize: 16 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
