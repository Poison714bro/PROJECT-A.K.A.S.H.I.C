"use client";

import { useState } from "react";
import type { ViewType } from "@/app/page";
import {
  LayoutDashboard,
  Map,
  GitBranch,
  Search,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Sliders,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { navItems, drugCategories, sourceStreams } from "@/lib/constants";

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  const filters = useAppStore((s) => s.filters);
  const toggleDrugCategory = useAppStore((s) => s.toggleDrugCategory);
  const toggleSourceStream = useAppStore((s) => s.toggleSourceStream);

  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const userClearance = currentUser?.clearanceLevel || 3;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-backdrop bg-black/75 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`z-[80] md:z-sidebar absolute inset-y-0 left-0 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col border-r border-[rgba(0,229,255,0.15)] bg-[#070B0E] select-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[60px] w-[260px]" : "w-[260px]"}`}
      >
        {/* Top Header Controls / Collapse Toggle */}
        <div className="flex h-12 items-center justify-between border-b border-[rgba(0,229,255,0.12)] px-3">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="h-2 w-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#00E5FF] uppercase truncate">
                INTEL OPERATIONS
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-6 w-6 items-center justify-center rounded border border-[rgba(0,229,255,0.2)] bg-[#111C24] text-[#6B9DA8] transition-colors hover:border-[#00E5FF] hover:text-[#00E5FF] focus:outline-none"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>

        {/* Navigation & Filters Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4 custom-scrollbar">
          {/* Tactical Navigation Nav Items */}
          <nav className="space-y-0.5" role="navigation" aria-label="Tactical Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setSidebarOpen(false);
                  }}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-xs font-mono transition-all duration-150 ${
                    isActive
                      ? "bg-[#16232D] border border-[#00E5FF] text-[#E6F8FF] shadow-[0_0_12px_rgba(0,229,255,0.25)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-[#00E5FF] before:shadow-[0_0_6px_#00E5FF]"
                      : "text-[#6B9DA8] hover:bg-[#111C24] hover:text-[#E6F8FF] border border-transparent hover:border-[rgba(0,229,255,0.12)]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      isActive ? "text-[#00E5FF]" : "text-[#6B9DA8] group-hover:text-[#E6F8FF]"
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate tracking-wide text-[11px] font-medium">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Section: Target Classifications (Drug / Contraband Categories) */}
          {!collapsed && (
            <div className="pt-2 border-t border-[rgba(0,229,255,0.1)]">
              <div className="px-2 pb-1.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#6B9DA8]/80">
                  TARGET CLASSIFICATIONS
                </span>
              </div>
              <div className="space-y-1">
                {drugCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isFilterActive = filters.drugCategories.has(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleDrugCategory(cat.name)}
                      className={`flex w-full items-center justify-between rounded px-2 py-1 text-[11px] font-mono transition-colors border ${
                        isFilterActive
                          ? "bg-[#111C24] border-[rgba(0,229,255,0.25)] text-[#E6F8FF]"
                          : "border-transparent text-[#6B9DA8]/60 hover:text-[#6B9DA8] hover:bg-[#0B1218]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: isFilterActive ? cat.color : "#475569",
                            boxShadow: isFilterActive ? `0 0 6px ${cat.color}` : "none",
                          }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <Icon className="h-3 w-3 shrink-0 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Source Streams */}
          {!collapsed && (
            <div className="pt-2 border-t border-[rgba(0,229,255,0.1)]">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex w-full items-center justify-between px-2 pb-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#6B9DA8]/80 hover:text-[#00E5FF] transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="h-2.5 w-2.5 text-[#00E5FF]" />
                  SOURCE STREAMS
                </span>
                <ChevronDown className={`h-2.5 w-2.5 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
              </button>

              {filtersOpen && (
                <div className="space-y-1">
                  {sourceStreams.map((stream) => {
                    const Icon = stream.icon;
                    const isStreamActive = filters.sourceStreams.has(stream.name);
                    return (
                      <button
                        key={stream.name}
                        onClick={() => toggleSourceStream(stream.name)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-[10.5px] font-mono transition-colors border ${
                          isStreamActive
                            ? "bg-[#111C24] border-[rgba(0,229,255,0.2)] text-[#E6F8FF]"
                            : "border-transparent text-[#6B9DA8]/50 hover:text-[#6B9DA8] hover:bg-[#0B1218]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <Icon className={`h-3 w-3 shrink-0 ${isStreamActive ? "text-emerald-400" : "text-[#6B9DA8]/40"}`} />
                          <span className="truncate">{stream.name}</span>
                        </div>
                        <span
                          className={`text-[8.5px] shrink-0 font-mono font-bold flex items-center gap-1 ${
                            isStreamActive ? "text-emerald-400" : "text-[#6B9DA8]/50"
                          }`}
                        >
                          {isStreamActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {isStreamActive ? "ACTIVE" : "MUTED"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Quick Controls */}
        <div className="mt-auto border-t border-[rgba(0,229,255,0.12)] p-2 space-y-1">
          <button
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-xs font-mono text-[#6B9DA8] transition-colors hover:bg-[#111C24] hover:text-[#E6F8FF] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            {!collapsed && <span className="text-[11px]">Settings</span>}
          </button>

          <button
            onClick={() => logout()}
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-xs font-mono text-[#FF1744]/80 transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && <span className="text-[11px]">Secure Logout</span>}
          </button>

          {/* Clearance Footer Badge */}
          {!collapsed && (
            <div className="mt-1 rounded border border-[rgba(0,229,255,0.25)] bg-[#111C24] px-2.5 py-1.5 flex items-center gap-2 shadow-[0_0_8px_rgba(0,229,255,0.1)]">
              <Shield className="h-3.5 w-3.5 text-[#00E5FF]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-[#E6F8FF]">
                  Level {userClearance} Clearance
                </span>
                <span className="text-[9px] font-mono text-[#6B9DA8]">
                  {currentUser?.role || "Admin"} Access
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
