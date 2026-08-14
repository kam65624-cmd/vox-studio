"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { use, useState, useEffect } from "react";
import {
  Film,
  Plus,
  Sliders,
  Sparkles,
  User,
  Tv,
  Palette,
  Mic,
  ArrowRight,
  FolderOpen,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { CreativeDNAInspector } from "@/components/production/CreativeDNAInspector";

export default function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/v1/projects/${projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProject(data);
        } else {
          setProject({
            id: projectId,
            name: "بودكاست تحليلات الأسواق",
            description: "تحليل الأحداث المالية والتحولات الاقتصادية مع بروفيسور تراديو",
            language: "ar",
            productionType: "Podcast",
            recipe: {
              name: "VOX Financial Podcast",
              character: "Prof. Tradeo",
              studio: "Tradeo Editorial Study",
              style: "VOX Editorial Style",
              voice: "Arabic Prof. Tradeo",
            },
            episodes: [],
          });
        }
      })
      .catch(() => {
        setProject({
          id: projectId,
          name: "مشروع إنتاجي جديد",
          description: "مشروع إنتاجي مخصص لعالم VOX",
          language: "ar",
          productionType: "Podcast",
          recipe: {
            name: "VOX Financial Podcast",
            character: "Prof. Tradeo",
            studio: "Tradeo Editorial Study",
            style: "VOX Editorial Style",
            voice: "Arabic Prof. Tradeo",
          },
          episodes: [],
        });
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink-navy)" }}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-xs text-muted">
          جاري تحميل مساحة عمل المشروع...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink-navy)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          projectName={project?.name || "المشروع"}
          episodeTitle="مساحة عمل المشروع"
          status="DRAFT"
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="btn-ghost p-1.5">
                <ArrowRight size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-primary">{project?.name}</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(14,91,86,0.3)", color: "#3DD6C8" }}>
                    نشط
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">{project?.description || "لا يوجد وصف"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn-secondary text-xs flex items-center gap-1.5">
                <Settings size={14} />
                تعديل إعدادات الإنتاج (Edit Setup)
              </button>
              <Link href="/episodes/1" className="btn-primary text-xs flex items-center gap-1.5">
                <Plus size={14} />
                إنشاء حلقة جديدة (Create Episode)
              </Link>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border space-y-1" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted font-bold">اللغة المختارة</span>
              <div className="text-sm font-semibold text-primary">
                {project?.language === "ar" ? "العربية (Arabic)" : project?.language === "en" ? "English" : "مزدوج (Bilingual)"}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border space-y-1" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted font-bold">نوع الإنتاج</span>
              <div className="text-sm font-semibold text-primary">{project?.productionType || "Podcast"}</div>
            </div>
            <div className="p-3.5 rounded-xl border space-y-1" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted font-bold">طقم الإنتاج (Recipe)</span>
              <div className="text-sm font-semibold text-primary">{project?.recipe?.name || "تخصيص يدوي"}</div>
            </div>
            <div className="p-3.5 rounded-xl border space-y-1" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
              <span className="text-muted font-bold">عدد الحلقات</span>
              <div className="text-sm font-semibold text-primary">{project?.episodes?.length || 0} حلقات</div>
            </div>
          </div>

          {/* Creative DNA Inspector (P0-D) */}
          <CreativeDNAInspector projectId={projectId} />

          {/* Recipe Stack Summary */}
          {project?.recipe && (
            <div className="p-4 rounded-xl border space-y-3" style={{ background: "var(--surface-1)", borderColor: "var(--border-accent)" }}>
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles size={14} style={{ color: "#3DD6C8" }} />
                  طقم الإنتاج المعتمد للمشروع (Production Recipe Stack)
                </span>
                <span className="text-[10px] text-muted">متوافق 100%</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                  <User size={16} style={{ color: "var(--char-orange)" }} />
                  <div>
                    <div className="text-muted text-[10px]">الشخصية</div>
                    <div className="font-bold text-primary">{project.recipe.character}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                  <Tv size={16} style={{ color: "var(--mustard)" }} />
                  <div>
                    <div className="text-muted text-[10px]">الاستوديو</div>
                    <div className="font-bold text-primary">{project.recipe.studio}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                  <Palette size={16} style={{ color: "var(--vixor-red)" }} />
                  <div>
                    <div className="text-muted text-[10px]">النمط البصري</div>
                    <div className="font-bold text-primary">{project.recipe.style}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded border" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                  <Mic size={16} style={{ color: "#3DD6C8" }} />
                  <div>
                    <div className="text-muted text-[10px]">الصوت المعتمد</div>
                    <div className="font-bold text-primary">{project.recipe.voice}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Episodes List Section — Empty State */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">الحلقات التابعة للمشروع (Episodes)</h2>

            {(!project?.episodes || project.episodes.length === 0) ? (
              <div
                className="p-12 rounded-xl border text-center space-y-4 flex flex-col items-center justify-center"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center border" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                  <FolderOpen size={20} className="text-muted" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-primary">لا توجد حلقات حتى الآن (No episodes yet)</h3>
                  <p className="text-xs text-muted max-w-sm">
                    ابدأ بإنشاء حلقة جديدة داخل هذا المشروع واستيراد السكربت للبدء في توليد المشاهد.
                  </p>
                </div>
                <Link href="/episodes/1" className="btn-primary text-xs flex items-center gap-2">
                  <Plus size={14} />
                  إنشاء حلقة جديدة (Create Episode)
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Reserved for actual episode lists */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
