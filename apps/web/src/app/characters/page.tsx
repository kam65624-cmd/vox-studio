"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  UserCheck,
  Sparkles,
  Shirt,
  Mic,
  Palette,
  CheckCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

export default function CharactersPage() {
  const [selectedTab, setSelectedTab] = useState<"visual" | "expressions" | "wardrobe" | "compatibility">("visual");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink-navy)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar projectName="Asset Universe" episodeTitle="الشخصيات (Characters)" status="DRAFT" />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">عالم الشخصيات (Characters)</h1>
              <p className="text-sm text-muted mt-1">الهوية البصرية والسلوكية الأساسية لمقدمي برامج VOX</p>
            </div>
            <button className="btn-primary">
              <Plus size={16} />
              إنشاء شخصية جديدة
            </button>
          </div>

          {/* Main Character Detail View: Prof. Tradeo */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border-accent)" }}
          >
            {/* Canonical Banner */}
            <div
              className="px-6 py-3 flex items-center justify-between"
              style={{ background: "rgba(246,139,30,0.1)", borderBottom: "1px solid rgba(246,139,30,0.2)" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "var(--char-orange)" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--char-orange)" }}>
                  الشخصية القانونية الرسمية (Canonical Seeded Character)
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(14,91,86,0.3)", color: "#3DD6C8" }}>
                الإصدار 1.0 (نشط)
              </span>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 p-6 gap-6">
              {/* Left Column: Visual Preview */}
              <div className="lg:col-span-4 space-y-4">
                <div
                  className="rounded-lg overflow-hidden relative group aspect-square flex items-center justify-center p-4 text-center"
                  style={{ background: "var(--charcoal)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="space-y-3">
                    <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold border-2" style={{ borderColor: "var(--char-orange)", background: "var(--surface-2)", color: "var(--paper)" }}>
                      PT
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">Prof. Tradeo</div>
                      <div className="text-xs text-muted">محلل وأستاذ أسواق المال</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted font-semibold uppercase tracking-wider">الهوية اللونية</div>
                  <div className="flex gap-2">
                    {[
                      { name: "Teal", hex: "#0E5B56" },
                      { name: "Mustard", hex: "#D8AA45" },
                      { name: "Red", hex: "#D94B3D" },
                      { name: "Paper", hex: "#F2EDE2" },
                    ].map((c) => (
                      <div key={c.name} className="flex-1 h-8 rounded border flex items-center justify-center text-xs font-mono" style={{ background: c.hex, borderColor: "var(--border-subtle)", color: c.hex === "#F2EDE2" ? "#111820" : "#F2EDE2" }}>
                        {c.hex}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Identity & DNA */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
                    <div>
                      <h2 className="text-xl font-bold text-primary">بروفيسور تراديو (Prof. Tradeo)</h2>
                      <p className="text-sm text-secondary mt-1">مُقدم برامج تحليل التحولات الاقتصادية والأسواق المالية بأسلوب صحفي ساخر وذكي.</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs">تعيين كـ Canonical</button>
                      <button className="btn-primary text-xs">استخدام في حلقة جديدة</button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b mt-4 gap-6 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
                    {[
                      { id: "visual", label: "البصري والسلوكي" },
                      { id: "expressions", label: "التعبيرات والتعليمات" },
                      { id: "wardrobe", label: "الملابس والملحقات" },
                      { id: "compatibility", label: "الاتساق والتوافق" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTab(t.id as any)}
                        className={`pb-2 transition-all font-medium ${selectedTab === t.id ? "border-b-2 text-primary" : "text-muted hover:text-secondary"}`}
                        style={{ borderColor: selectedTab === t.id ? "var(--vixor-red)" : "transparent" }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="py-4 space-y-4">
                    {selectedTab === "visual" && (
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-muted font-semibold">الوصف البصري: </span>
                          <span className="text-secondary">دمية صحفية (Felt/Puppet) بشعر أبيض ثائر، حواجب كثيفة، شارب أبيض، عيون دائرية معبرة، وأنف برتقالي داكن.</span>
                        </div>
                        <div>
                          <span className="text-muted font-semibold">الشخصية والنبرة: </span>
                          <span className="text-secondary">عمق تعليمي مع سخرية ذكية. الضحك على الموقف وليس على المعلومة. السرد مستند على البيانات.</span>
                        </div>
                      </div>
                    )}

                    {selectedTab === "expressions" && (
                      <div className="grid grid-cols-4 gap-2">
                        {["سعيدة (Happy)", "مندهشة (Surprised)", "تفكر (Thinking)", "ساخرة (Sarcastic)", "غاضبة (Angry)", "مصدومة (Shocked)", "مترددة (Hesitant)", "واثقة (Confident)"].map((exp) => (
                          <div key={exp} className="p-2.5 rounded text-xs border text-center font-medium" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                            {exp}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedTab === "wardrobe" && (
                      <div className="p-4 rounded border space-y-2" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                        <div className="text-xs font-bold text-primary flex items-center gap-2">
                          <Shirt size={14} style={{ color: "var(--char-orange)" }} />
                          بدلة تراديو الكلاسيكية (Classic Tradeo Suit)
                        </div>
                        <p className="text-xs text-secondary">سترة زرقاء مخضرة (Teal) + صدرية كراميل/خردلية + قميص أبيض + بابيون أحمر + منديل جيب + سلسلة ساعة جيب.</p>
                      </div>
                    )}

                    {selectedTab === "compatibility" && (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded" style={{ background: "rgba(14,91,86,0.15)", color: "#3DD6C8" }}>
                          <span className="flex items-center gap-2"><CheckCircle size={14} /> الاستوديو المعتمد: Tradeo Editorial Study</span>
                          <span>متوافق 100%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded" style={{ background: "rgba(14,91,86,0.15)", color: "#3DD6C8" }}>
                          <span className="flex items-center gap-2"><CheckCircle size={14} /> النمط البصري: VOX Editorial Style</span>
                          <span>متوافق 100%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
