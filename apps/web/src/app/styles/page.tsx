"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Palette, Sparkles, AlertTriangle, CheckCircle, Plus } from "lucide-react";

export default function StylesPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink-navy)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar projectName="Asset Universe" episodeTitle="الأنماط البصرية (Styles)" status="DRAFT" />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">الأنماط البصرية (Style DNA)</h1>
              <p className="text-sm text-muted mt-1">تحديد الهوية الفنية واللونية لمنظومة تحريك VOX</p>
            </div>
            <button className="btn-primary">
              <Plus size={16} />
              رفع نمط جديد (Upload Style DNA)
            </button>
          </div>

          {/* Canonical Style Card */}
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-accent)" }}>
            <div className="px-6 py-3 flex items-center justify-between" style={{ background: "rgba(14,91,86,0.15)", borderBottom: "1px solid rgba(14,91,86,0.3)" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "#3DD6C8" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3DD6C8" }}>
                  النمط المعياري المعتمد (Canonical Style)
                </span>
              </div>
              <span className="text-xs text-muted">VOX Editorial Engine v1.0</span>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary">VOX Editorial Style</h2>
                  <p className="text-sm text-secondary mt-1">عالم تحرير ورقي (Paper/Collage) بأنسجة الورق المقصوص، النقاط النصفية (Halftone)، والخطوط التحريرية البارزة.</p>
                </div>
              </div>

              {/* Palette */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-muted uppercase tracking-wider">لوحة الألوان المعتمدة (Strict Palette)</div>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { name: "PAPER", hex: "#F2EDE2" },
                    { name: "INK NAVY", hex: "#111820" },
                    { name: "VIXOR RED", hex: "#D94B3D" },
                    { name: "MUSTARD", hex: "#D8AA45" },
                    { name: "DEEP TEAL", hex: "#0E5B56" },
                    { name: "WARM BROWN", hex: "#5B3A28" },
                  ].map((item) => (
                    <div key={item.name} className="p-3 rounded border space-y-1 text-center" style={{ background: item.hex, borderColor: "var(--border-subtle)", color: item.hex === "#F2EDE2" ? "#111820" : "#F2EDE2" }}>
                      <div className="text-xs font-bold">{item.name}</div>
                      <div className="text-xs font-mono opacity-80">{item.hex}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Style DNA details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded border space-y-1" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                  <span className="font-bold text-primary">النسيج والملمس (Texture):</span>
                  <p className="text-secondary">Paper grain, halftone, ink edges, tape/stickers, rough tears, paper folds</p>
                </div>
                <div className="p-3 rounded border space-y-1" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
                  <span className="font-bold text-primary">لغة الانتقالات (Transitions):</span>
                  <p className="text-secondary">Page Flip, Chart Line, Marker Circle, Paper Tear, Match Cut, Push In/Out</p>
                </div>
              </div>

              {/* Negative rules */}
              <div className="p-4 rounded border space-y-2" style={{ background: "rgba(217,75,61,0.08)", borderColor: "rgba(217,75,61,0.2)" }}>
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--vixor-red)" }}>
                  <AlertTriangle size={14} />
                  قواعد الحظر البصري (Negative Rules):
                </div>
                <ul className="text-xs space-y-1 text-secondary list-disc list-inside">
                  <li>يُمنع استخدام الرسوم المتحركة التجارية النمطية (Generic Motion Graphics).</li>
                  <li>يُمنع استخدام التوهج المفرط (Excessive Glows) أو الألوان القزحية.</li>
                  <li>يُمنع تغيير خلفية المشاهد بألوان عشوائية غير معتمدة في البالتة الرسمية.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
