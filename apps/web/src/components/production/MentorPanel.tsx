"use client";

import {
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Wrench,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface MentorIssue {
  id: string;
  mentorType: string;
  severity: "BLOCKER" | "MAJOR" | "MINOR" | "SUGGESTION";
  title: string;
  evidence: string;
  impact: string;
  fixSuggestion: string;
  autoFixable: boolean;
  resolved: boolean;
}

interface MentorPanelProps {
  qualityScore?: number;
  issues?: MentorIssue[];
}

const mentorTypeLabels: Record<string, string> = {
  STORY: "السرد",
  SCENE: "المشهد",
  CONTINUITY: "الاتساق",
  VISUAL: "البصري",
  LANGUAGE: "اللغة",
  AUDIO: "الصوت",
  PACING: "الإيقاع",
  HUMANIZATION: "الإنسانية",
};

const mentorTypeStatus: Record<string, "pass" | "warn" | "fail"> = {
  STORY: "pass",
  SCENE: "pass",
  CONTINUITY: "pass",
  VISUAL: "pass",
  LANGUAGE: "pass",
  AUDIO: "pass",
  PACING: "warn",
  HUMANIZATION: "pass",
};

const mockIssues: MentorIssue[] = [
  {
    id: "i1",
    mentorType: "PACING",
    severity: "MINOR",
    title: "المشهد الثالث طويل نسبياً",
    evidence: "المشهد 3 يستغرق 18 ثانية دون نقطة توقف بصرية.",
    impact: "احتمال فقدان انتباه المشاهد في المنتصف.",
    fixSuggestion: "أضف إطار بيانات أو انتقال بصري في الثانية 10.",
    autoFixable: true,
    resolved: false,
  },
  {
    id: "i2",
    mentorType: "HUMANIZATION",
    severity: "SUGGESTION",
    title: "استخدام متكرر لنفس الزاوية",
    evidence: "المشاهد 1، 5، 7 تستخدم نفس إطار الكاميرا المتوسط.",
    impact: "يبدو التسلسل آلياً.",
    fixSuggestion: "غيّر زاوية المشهد 7 إلى إطار قريب.",
    autoFixable: false,
    resolved: false,
  },
];

const severityConfig = {
  BLOCKER: {
    color: "var(--vixor-red)",
    bg: "rgba(217,75,61,0.1)",
    icon: Shield,
    label: "مانع",
  },
  MAJOR: {
    color: "var(--mustard)",
    bg: "rgba(216,170,69,0.1)",
    icon: AlertTriangle,
    label: "رئيسي",
  },
  MINOR: {
    color: "#3DD6C8",
    bg: "rgba(61,214,200,0.08)",
    icon: Info,
    label: "ثانوي",
  },
  SUGGESTION: {
    color: "var(--text-muted)",
    bg: "rgba(242,237,226,0.05)",
    icon: Lightbulb,
    label: "اقتراح",
  },
};

function MentorIssueCard({ issue }: { issue: MentorIssue }) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[issue.severity];

  return (
    <div
      className="rounded-lg p-3 transition-all duration-200"
      style={{ background: config.bg, border: `1px solid ${config.color}25` }}
    >
      <button
        className="w-full flex items-start gap-2 text-start"
        onClick={() => setExpanded(!expanded)}
      >
        <config.icon size={13} className="flex-shrink-0 mt-0.5" style={{ color: config.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {issue.title}
            </span>
            {issue.autoFixable && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "rgba(14,91,86,0.2)", color: "#3DD6C8" }}
              >
                تلقائي
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: config.color }}>
            {mentorTypeLabels[issue.mentorType]} · {config.label}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={12} style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 text-xs animate-fade-in">
          <div>
            <span style={{ color: "var(--text-muted)" }}>الدليل: </span>
            <span style={{ color: "var(--text-secondary)" }}>{issue.evidence}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>التأثير: </span>
            <span style={{ color: "var(--text-secondary)" }}>{issue.impact}</span>
          </div>
          <div
            className="rounded p-2"
            style={{ background: "rgba(242,237,226,0.04)" }}
          >
            <span style={{ color: "var(--text-muted)" }}>الاقتراح: </span>
            <span style={{ color: "var(--text-secondary)" }}>{issue.fixSuggestion}</span>
          </div>
          <div className="flex gap-2 pt-1">
            {issue.autoFixable && (
              <button className="btn-primary text-xs py-1 px-3 flex items-center gap-1">
                <Zap size={10} />
                إصلاح تلقائي
              </button>
            )}
            <button className="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
              <Wrench size={10} />
              إصلاح يدوي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MentorPanel({ qualityScore: initialScore = 87, issues: initialIssues = mockIssues }: MentorPanelProps) {
  const [issuesList, setIssuesList] = useState<MentorIssue[]>(initialIssues);
  const [score, setScore] = useState<number>(initialScore);

  const handleFixAll = () => {
    const fixableCount = issuesList.filter((i) => i.autoFixable && !i.resolved).length;
    if (fixableCount === 0) return;

    const updated = issuesList.map((i) => (i.autoFixable ? { ...i, resolved: true } : i));
    setIssuesList(updated);
    setScore((prev) => Math.min(100, prev + fixableCount * 10));
  };

  const scoreColor =
    score >= 80
      ? "#3DD6C8"
      : score >= 60
      ? "var(--mustard)"
      : "var(--vixor-red)";

  const circumference = 2 * Math.PI * 26;
  const dashOffset = circumference * (1 - score / 100);

  const unresolvedIssues = issuesList.filter((i) => !i.resolved);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--surface-1)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <Shield size={13} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            مراجعة المنتور (P0-G Auto-Repair)
          </span>
        </div>
        <button className="btn-ghost text-xs py-1 px-2">إعادة تقييم</button>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4 px-4 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="relative flex-shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="rgba(242,237,226,0.08)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke={scoreColor}
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tabular-nums" style={{ color: scoreColor }}>
              {score}
            </span>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            جودة الإنتاج
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(mentorTypeStatus).map(([type, status]) => (
              <div key={type} className="flex items-center gap-1.5">
                {status === "pass" ? (
                  <CheckCircle size={10} style={{ color: "#3DD6C8" }} />
                ) : status === "warn" ? (
                  <AlertTriangle size={10} style={{ color: "var(--mustard)" }} />
                ) : (
                  <Shield size={10} style={{ color: "var(--vixor-red)" }} />
                )}
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {mentorTypeLabels[type]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Issues */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {unresolvedIssues.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={24} className="mx-auto mb-2" style={{ color: "#3DD6C8" }} />
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              لا توجد مشاكل معلقة
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              تم إصلاح كافة الملاحظات — الحلقة جاهزة للتصيير
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {unresolvedIssues.length} ملاحظة
              </span>
              {unresolvedIssues.some((i) => i.autoFixable) && (
                <button
                  onClick={handleFixAll}
                  className="text-xs flex items-center gap-1 hover:underline transition-all"
                  style={{ color: "#3DD6C8" }}
                >
                  <Zap size={10} />
                  إصلاح الكل تلقائياً
                </button>
              )}
            </div>
            {unresolvedIssues.map((issue) => (
              <MentorIssueCard key={issue.id} issue={issue} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
