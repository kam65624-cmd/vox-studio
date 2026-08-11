"use client";

import Link from "next/link";
import {
  Film,
  Plus,
  Clock,
  CheckCircle2,
  Cpu,
  TrendingUp,
  Zap,
  Users,
  Palette,
  ArrowLeft,
} from "lucide-react";

const recentProjects = [
  {
    id: "1",
    title: "تقرير: ماذا يحدث لأسواق المال؟",
    status: "MENTOR_REVIEW",
    mentorScore: 87,
    lastUpdated: "منذ ساعتين",
    scenes: 8,
    language: "ar",
  },
  {
    id: "2",
    title: "شرح: أزمة الديون الأمريكية",
    status: "GENERATING",
    mentorScore: null,
    lastUpdated: "منذ 4 ساعات",
    scenes: 6,
    language: "ar",
  },
  {
    id: "3",
    title: "The Fed Rate Decision",
    status: "EXPORTED",
    mentorScore: 92,
    lastUpdated: "أمس",
    scenes: 10,
    language: "en",
  },
];

const stats = [
  { icon: Film, label: "الحلقات المُصدَّرة", value: "12", delta: "+3 هذا الشهر" },
  { icon: Cpu, label: "الكلفة هذا الشهر", value: "$24.80", delta: "-12% عن الشهر الماضي" },
  { icon: TrendingUp, label: "متوسط درجة المنتور", value: "89", delta: "أعلى 5 نقاط" },
  { icon: CheckCircle2, label: "المشاكل المحلولة تلقائياً", value: "34", delta: "من أصل 38" },
];

const statusColors: Record<string, string> = {
  DRAFT: "status-draft",
  GENERATING: "status-generating",
  MENTOR_REVIEW: "status-mentor-review",
  READY_TO_RENDER: "status-ready",
  EXPORTED: "status-exported",
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  GENERATING: "يولّد...",
  MENTOR_REVIEW: "مراجعة المنتور",
  READY_TO_RENDER: "جاهز للتصيير",
  EXPORTED: "مُصدَّر",
};

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            مرحباً بك في VOX Studio
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            منصة إنتاج الفيديو التحريري بالذكاء الاصطناعي
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus size={15} />
          مشروع جديد
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="vox-surface rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-border-accent"
          >
            <div className="flex items-center justify-between">
              <stat.icon size={16} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--deep-teal)" }}>
                {stat.delta}
              </span>
            </div>
            <div>
              <div
                className="text-2xl font-bold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {stat.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Episodes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            الحلقات الأخيرة
          </h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            عرض الكل
            <ArrowLeft size={12} />
          </Link>
        </div>

        <div className="space-y-2">
          {recentProjects.map((ep) => (
            <Link
              key={ep.id}
              href={`/episodes/${ep.id}`}
              className="card-scene flex items-center gap-4 group relative"
            >
              {/* Type indicator */}
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{
                  background:
                    ep.status === "EXPORTED"
                      ? "var(--deep-teal)"
                      : ep.status === "MENTOR_REVIEW"
                      ? "var(--vixor-red)"
                      : ep.status === "GENERATING"
                      ? "var(--mustard)"
                      : "var(--border-subtle)",
                }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {ep.title}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {ep.language === "ar" ? "عربي" : "English"}
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 mt-1 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {ep.lastUpdated}
                  </span>
                  <span>{ep.scenes} مشاهد</span>
                </div>
              </div>

              {/* Status + Score */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {ep.mentorScore !== null && (
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      ep.mentorScore >= 80
                        ? "mentor-score-high"
                        : ep.mentorScore >= 60
                        ? "mentor-score-medium"
                        : "mentor-score-low"
                    }`}
                  >
                    {ep.mentorScore}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${statusColors[ep.status] ?? "status-draft"}`}
                >
                  {statusLabels[ep.status] ?? ep.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick access */}
      <div>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          وصول سريع
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              href: "/characters",
              icon: Users,
              label: "الشخصيات",
              description: "Prof. Tradeo والمزيد",
              accent: "var(--char-orange)",
            },
            {
              href: "/styles",
              icon: Palette,
              label: "الأنماط البصرية",
              description: "VOX editorial style",
              accent: "var(--mustard)",
            },
            {
              href: "/production",
              icon: Zap,
              label: "وصفات الإنتاج",
              description: "Tradeo × VOX",
              accent: "var(--deep-teal)",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="vox-surface rounded-xl p-4 transition-all duration-200 hover:border-border-accent group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${item.accent}20` }}
              >
                <item.icon size={16} style={{ color: item.accent }} />
              </div>
              <div
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {item.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {item.description}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Prof. Tradeo canonical banner */}
      <div
        className="rounded-xl p-5 flex items-center justify-between relative overflow-hidden"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}
      >
        <div
          className="absolute inset-0 opacity-5 paper-texture"
          aria-hidden
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: "var(--char-orange)" }}
            >
              <span className="text-xs font-bold text-paper">P</span>
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--char-orange)" }}
            >
              أصل قانوني
            </span>
          </div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Prof. Tradeo جاهز
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            الشخصية الرئيسية لـ VIXOR — محلل الأسواق الساخر والذكي
          </p>
        </div>
        <Link href="/characters/prof-tradeo" className="btn-secondary text-xs relative z-10">
          عرض الشخصية
        </Link>
      </div>
    </div>
  );
}
