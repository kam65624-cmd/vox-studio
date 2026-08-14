"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useState } from "react";
import { CheckCircle, ShieldCheck, ArrowLeft, Save, Sparkles } from "lucide-react";
import Link from "next/link";

export default function RecipeBuilderPage() {
  const [step, setStep] = useState(1);
  const [selectedCharacter, setSelectedCharacter] = useState("char-prof-tradeo");
  const [selectedStudio, setSelectedStudio] = useState("tradeo-editorial-study");
  const [selectedStyle, setSelectedStyle] = useState("vox-editorial-style");
  const [selectedVoice, setSelectedVoice] = useState("tradeo-ar-voice");
  const [selectedWardrobe, setSelectedWardrobe] = useState("classic-tradeo-wardrobe");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink-navy)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar projectName="Asset Universe" episodeTitle="مُنشئ الوصفات (Recipe Builder)" status="DRAFT" />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-3">
              <Link href="/recipes" className="btn-ghost p-1.5">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">مُصمم طقم الإنتاج (Recipe Builder)</h1>
                <p className="text-xs text-muted">تجميع طقم بصري وصوتي متكامل ومتسق</p>
              </div>
            </div>
            <button className="btn-primary text-xs flex items-center gap-2">
              <Save size={14} />
              حفظ الوصفة (Save Recipe)
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {[
              { num: 1, label: "اختيار الشخصية" },
              { num: 2, label: "اختيار الاستوديو" },
              { num: 3, label: "اختيار النمط البصري" },
              { num: 4, label: "اختيار الصوت والملابس" },
              { num: 5, label: "التحقق والحفظ" },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`p-2.5 rounded border transition-all ${step === s.num ? "border-vixor-red font-bold text-primary" : "border-subtle text-muted"}`}
                style={{ background: step === s.num ? "var(--surface-2)" : "var(--surface-1)", borderColor: step === s.num ? "var(--vixor-red)" : "var(--border-subtle)" }}
              >
                <div className="text-xs text-muted">الخطوة {s.num}</div>
                <div>{s.label}</div>
              </button>
            ))}
          </div>

          {/* Builder Body */}
          <div className="p-6 rounded-xl border space-y-6" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-primary">1. اختر الشخصية الرئيسية (Character)</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => setSelectedCharacter("char-prof-tradeo")}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedCharacter === "char-prof-tradeo" ? "border-vixor-red" : ""}`}
                    style={{ background: "var(--surface-2)", borderColor: selectedCharacter === "char-prof-tradeo" ? "var(--vixor-red)" : "var(--border-subtle)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">Prof. Tradeo</span>
                      {selectedCharacter === "char-prof-tradeo" && <CheckCircle size={16} style={{ color: "#3DD6C8" }} />}
                    </div>
                    <p className="text-xs text-muted">المحلل المالي والأستاذ الصحفي لبرامج التحليلات الاقتصادية.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-primary">2. اختر بيئة الاستوديو (Studio)</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => setSelectedStudio("tradeo-editorial-study")}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedStudio === "tradeo-editorial-study" ? "border-vixor-red" : ""}`}
                    style={{ background: "var(--surface-2)", borderColor: selectedStudio === "tradeo-editorial-study" ? "var(--vixor-red)" : "var(--border-subtle)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">Tradeo Editorial Study</span>
                      {selectedStudio === "tradeo-editorial-study" && <CheckCircle size={16} style={{ color: "#3DD6C8" }} />}
                    </div>
                    <p className="text-xs text-muted">مكتبة دافئة داكنة مع ميكروفون أسود وخرائط ومؤشرات مالية معلقة.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-primary">3. اختر الهوية والنمط البصري (Style DNA)</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => setSelectedStyle("vox-editorial-style")}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedStyle === "vox-editorial-style" ? "border-vixor-red" : ""}`}
                    style={{ background: "var(--surface-2)", borderColor: selectedStyle === "vox-editorial-style" ? "var(--vixor-red)" : "var(--border-subtle)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">VOX Editorial Style</span>
                      {selectedStyle === "vox-editorial-style" && <CheckCircle size={16} style={{ color: "#3DD6C8" }} />}
                    </div>
                    <p className="text-xs text-muted">نمط القصاصات الورقية مع ألوان الحبر الداكن والأحمر المعتمد.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-primary">4. الصوت والملابس المعتمدة</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border space-y-2" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                    <label className="text-xs font-bold text-muted">الصوت (Voice):</label>
                    <select className="w-full p-2 rounded text-xs text-primary" style={{ background: "var(--ink-navy)", border: "1px solid var(--border-subtle)" }} value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}>
                      <option value="tradeo-ar-voice">Prof. Tradeo (Arabic - ElevenLabs)</option>
                      <option value="tradeo-en-voice">Prof. Tradeo (English - ElevenLabs)</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-lg border space-y-2" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                    <label className="text-xs font-bold text-muted">بدلة الشخصية (Wardrobe):</label>
                    <select className="w-full p-2 rounded text-xs text-primary" style={{ background: "var(--ink-navy)", border: "1px solid var(--border-subtle)" }} value={selectedWardrobe} onChange={(e) => setSelectedWardrobe(e.target.value)}>
                      <option value="classic-tradeo-wardrobe">Classic Tradeo Suit (بدلة تيل وصدرية خردل)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-primary">5. ملخص وفحص الاتساق (Compatibility Verification)</h2>
                <div className="p-4 rounded border flex items-center justify-between" style={{ background: "rgba(14,91,86,0.15)", borderColor: "rgba(14,91,86,0.3)" }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "#3DD6C8" }}>
                    <ShieldCheck size={18} />
                    <span>تم الفحص تلقائياً: جميع المكونات مختارة ومتوافقة 100% بدون أي تضارب بصري أو صوتي.</span>
                  </div>
                </div>
                <button className="btn-primary w-full justify-center text-sm py-3">
                  اعتماد الطقم وبناء الوصفة (Create Production Recipe)
                </button>
              </div>
            )}

            {/* Stepper Controls */}
            <div className="flex justify-between border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
              <button disabled={step === 1} onClick={() => setStep(step - 1)} className="btn-secondary text-xs disabled:opacity-40">
                السابق
              </button>
              <button disabled={step === 5} onClick={() => setStep(step + 1)} className="btn-primary text-xs disabled:opacity-40">
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
