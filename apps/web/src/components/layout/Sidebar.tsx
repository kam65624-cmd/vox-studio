"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Film,
  Users,
  Palette,
  Mic,
  Cpu,
  Settings,
  ChevronDown,
  Zap,
  Sliders,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard", labelAr: "الرئيسية" },
  { href: "/characters", icon: Users, label: "Characters", labelAr: "الشخصيات" },
  { href: "/styles", icon: Palette, label: "Styles", labelAr: "الأنماط" },
  { href: "/recipes", icon: Sliders, label: "Recipes", labelAr: "وصفات الإنتاج" },
  { href: "/episodes/1", icon: Film, label: "Production", labelAr: "محرر التجهيز" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col h-full bg-surface-1 border-e border-border-subtle transition-all duration-300 ${
        collapsed ? "w-14" : "w-52"
      }`}
      style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--vixor-red)" }}>
          <Zap size={14} className="text-paper" />
        </div>
        {!collapsed && (
          <span className="vox-display text-base tracking-widest" style={{ color: "var(--paper)" }}>
            VOX STUDIO
          </span>
        )}
      </div>

      {/* Workspace pill */}
      {!collapsed && (
        <div className="px-3 py-3">
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors hover:bg-surface-2"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            <span className="truncate font-medium">VIXOR Studio</span>
            <ChevronDown size={12} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 mt-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link group"
              data-active={active}
              style={active ? {
                color: "var(--text-primary)",
                background: "var(--surface-2)",
                borderInlineStart: "2px solid var(--vixor-red)",
              } : {}}
            >
              <item.icon size={16} className="flex-shrink-0" />
              {!collapsed && (
                <span>{item.labelAr}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 space-y-0.5 border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
        <Link href="/settings" className="sidebar-link">
          <Settings size={16} className="flex-shrink-0" />
          {!collapsed && <span>الإعدادات</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full text-start"
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {collapsed
              ? <path d="M6 3l5 5-5 5V3z"/>
              : <path d="M10 3L5 8l5 5V3z"/>
            }
          </svg>
          {!collapsed && <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>طي القائمة</span>}
        </button>
      </div>
    </aside>
  );
}
