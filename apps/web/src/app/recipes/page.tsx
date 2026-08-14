"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Sliders, Plus, CheckCircle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default function RecipesPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink-navy)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar projectName="Asset Universe" episodeTitle="وصفات الإنتاج (Production Recipes)" status="DRAFT" />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">وصفات الإنتاج (Production Recipes)</h1>
              <p className="text-sm text-muted mt-1">تجميع العناصر البصرية والصوتية في طقم إنتاجي كامل بضغطة واحدة</p>
            </div>
            <Link href="/recipes/builder" className="btn-primary">
              <Plus size={16} />
              بناء وصفة جديدة (Recipe Builder)
            </Link>
          </div>

          {/* Canonical Recipe Stack */}
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-accent)" }}>
            <div className="px-6 py-3 flex items-center justify-between" style={{ background: "rgba(14,91,86,0.15)", borderBottom: "1px solid rgba(14,91,86,0.3)" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "#3DD6C8" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3DD6C8" }}>
                  الوصفة الرسمية المعتمدة (Canonical Recipe)
                </span>
              </div>
              <span className="text-xs text-muted">حالة الاتساق: متوافق 100%</span>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
                <div>
                  <h2 className="text-xl font-bold text-primary">VOX Financial Podcast</h2>
                  <p className="text-sm text-secondary mt-1">طقم إنتاج البودكاست المالي مع بروفيسور تراديو في استوديو التحليل التحريري.</p>
                </div>
                <button className="btn-primary text-xs">
                  تطبيق الوصفة على حلقة
                </button>
              </div>

              {/* Recipe Stack Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {[
                  { label: "الشخصية", val: "Prof. Tradeo", sub: "النسخة الرسمية 1.0" },
                  { label: "الاستوديو", val: "Tradeo Editorial Study", sub: "مكتبة داكنة خشبية" },
                  { label: "النمط البصري", val: "VOX Editorial Style", sub: "قصاصات ورق وHalftone" },
                  { label: "الصوت", val: "Arabic Prof. Tradeo", sub: "ElevenLabs AR" },
                  { label: "الملابس", val: "Classic Tradeo Suit", sub: "بدلة تيل وصدرية خردل" },
                  { label: "الملحقات (Props)", val: "Microphone, Mug, Books", sub: "3 ملحقات نشطة" },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded border space-y-1" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                    <div className="text-xs text-muted font-bold">{item.label}</div>
                    <div className="text-sm font-semibold text-primary">{item.val}</div>
                    <div className="text-xs text-secondary">{item.sub}</div>
                  </div>
                ))}
              </div>

              {/* Compatibility Verification */}
              <div className="p-3 rounded border flex items-center justify-between" style={{ background: "rgba(14,91,86,0.1)", borderColor: "rgba(14,91,86,0.25)" }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: "#3DD6C8" }}>
                  <ShieldCheck size={16} />
                  <span>محرك الاتساق: جميع المكونات المختارة متوافقة ومجتازة لفحوصات التداخل البصري والصوتي.</span>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: "#3DD6C8" }}>STATUS: VALID</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
