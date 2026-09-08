"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import { ShieldAlert, ArrowLeft, KeyRound, Shield } from "lucide-react";

interface UnauthorizedViewProps {
  requiredClearance?: number;
}

export default function UnauthorizedView({ requiredClearance = 2 }: UnauthorizedViewProps) {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const currentUser = useAppStore((s) => s.currentUser);
  const updateUserClearance = useAppStore((s) => s.updateUserClearance);

  const userClearance = currentUser?.clearanceLevel || 1;

  const getClearanceName = (lvl: number) => {
    switch (lvl) {
      case 3: return "Level 3 (System Administrator // Top Secret)";
      case 2: return "Level 2 (Senior Field Investigator)";
      default: return "Level 1 (Intelligence Analyst)";
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0e17] text-foreground p-6">
      <div className="max-w-lg rounded-2xl border border-red-500/30 bg-[#0d131f]/95 p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] backdrop-blur-md">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="h-8 w-8" />
        </div>
        
        <div className="inline-block rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-400 mb-3">
          SECURITY BOUNDARY ENFORCED
        </div>

        <h1 className="text-2xl font-black text-white tracking-wide mb-2">Access Denied</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Zero-trust access policy prevented entry. Your clearance level is insufficient to access this compartmentalized module.
        </p>

        {/* Clearance Comparison Card */}
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left font-mono text-xs">
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Required Clearance</span>
            <span className="mt-1 block font-bold text-red-400">
              Level {requiredClearance}
            </span>
            <span className="text-[10px] text-slate-400">{getClearanceName(requiredClearance).split("(")[1]?.replace(")", "")}</span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Your Current Level</span>
            <span className="mt-1 block font-bold text-amber-400">
              Level {userClearance}
            </span>
            <span className="text-[10px] text-slate-400">{currentUser?.role || "Analyst"}</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={() => setActiveView("dashboard")}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
