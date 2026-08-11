"use client";

import Link from "next/link";
import {
  Bell,
  Search,
  Zap,
  ChevronDown,
  Play,
} from "lucide-react";

interface TopBarProps {
  episodeTitle?: string;
  projectName?: string;
  status?: string;
  mentorScore?: number;
}

const statusColors: Record<string, string> = {
  DRAFT: "status-draft",
  GENERATING: "status-generating",
  MENTOR_REVIEW: "status-mentor-review",
  READY_TO_RENDER: "status-ready",
  EXPORTED: "status-exported",
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PLANNING: "تخطيط",
  STORYBOARDING: "لوحة القصة",
  GENERATING: "يولّد...",
  VALIDATING: "يتحقق",
  MENTOR_REVIEW: "مراجعة المنتور",
  REVISING: "مراجعة",
  READY_TO_RENDER: "جاهز للتصيير",
  RENDERING: "يصير...",
  EXPORTED: "مُصدَّر",
};

export function TopBar({ episodeTitle, projectName, status, mentorScore }: TopBarProps) {
  const scoreColor =
    mentorScore !== undefined
      ? mentorScore >= 80
        ? "mentor-score-high"
        : mentorScore >= 60
        ? "mentor-score-medium"
        : "mentor-score-low"
      : "";

  return (
    <header
      className="flex items-center justify-between px-4 h-12 border-b flex-shrink-0"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "var(--vixor-red)" }}
          >
            <Zap size={12} className="text-paper" />
          </div>
          <span
            className="vox-display text-sm tracking-widest hidden sm:block"
            style={{ color: "var(--paper)" }}
          >
            VOX
          </span>
        </Link>

        {projectName && (
          <>
            <span style={{ color: "var(--border-accent)" }}>/</span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {projectName}
            </span>
          </>
        )}

        {episodeTitle && (
          <>
            <span style={{ color: "var(--border-accent)" }}>/</span>
            <button
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {episodeTitle}
              <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
            </button>
          </>
        )}
      </div>

      {/* Center: Status */}
      {status && (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status] ?? "status-draft"}`}
          >
            {statusLabels[status] ?? status}
          </span>
        </div>
      )}

      {/* Right: Mentor Score + Actions */}
      <div className="flex items-center gap-3">
        {mentorScore !== undefined && (
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
              <circle
                cx="7"
                cy="7"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray={`${(mentorScore / 100) * 37.7} 37.7`}
                strokeLinecap="round"
                transform="rotate(-90 7 7)"
                className={scoreColor}
              />
            </svg>
            <span className={`text-xs font-semibold tabular-nums ${scoreColor}`}>
              {mentorScore}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              جودة
            </span>
          </div>
        )}

        <button className="btn-ghost p-1.5" aria-label="Search">
          <Search size={14} />
        </button>

        <button className="btn-ghost p-1.5 relative" aria-label="Notifications">
          <Bell size={14} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--vixor-red)" }}
          />
        </button>

        <button className="btn-primary text-xs py-1.5 px-3 gap-1.5">
          <Play size={11} />
          تصيير
        </button>
      </div>
    </header>
  );
}
