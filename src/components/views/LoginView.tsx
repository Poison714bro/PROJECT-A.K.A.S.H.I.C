"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { authenticate } from "@/lib/auth";
import { Shield, Lock, User as UserIcon, Loader2, Cpu, Fingerprint, Activity, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

type FocusedInputType = "identifier" | "password" | null;

export default function LoginView() {
  const login = useAppStore((s) => s.login);
  const demoTimeoutActive = useAppStore((s) => s.demoTimeoutActive);
  const setDemoTimeoutActive = useAppStore((s) => s.setDemoTimeoutActive);
  const inactivityLoggedOut = useAppStore((s) => s.inactivityLoggedOut);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<FocusedInputType>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Credentials required for access.");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await authenticate(identifier, password);
    
    setLoading(false);

    if (result.success && result.user && result.token) {
      login(result.user, result.token);
    } else {
      setError(result.error || "Authentication protocol failed.");
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#0a0e17]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="grid-bg absolute inset-0 z-0 opacity-30" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up px-4">
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-[#0d131f]/95 p-8 shadow-[0_0_40px_-10px_rgba(0,212,255,0.15)]">
          
          {/* Header Section */}
          <div className="mb-10 flex flex-col items-center">
            <div className="relative mb-5 flex h-14 w-14 animate-fade-in items-center justify-center rounded-2xl bg-[#131f33] border border-cyan-500/20 shadow-[inset_0_0_15px_rgba(0,212,255,0.1)]">
              <Shield className="h-7 w-7 text-cyan-400" />
              <Activity className="absolute -bottom-1 -right-4 h-8 w-8 text-[#1d2a44] opacity-50" />
            </div>
            
            <h1 className="bg-gradient-to-b from-slate-200 to-slate-500 bg-clip-text text-center text-2xl sm:text-3xl font-black tracking-[0.15em] text-transparent">
              A.K.A.S.H.I.C.
            </h1>
            <p className="mt-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-cyan-500">
              <Cpu className="h-3.5 w-3.5" />
              Secure Terminal
            </p>
          </div>

          {inactivityLoggedOut && (
            <div className="mb-4 overflow-hidden animate-fade-in rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-xs font-semibold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              ⚡ Auto-Logout Triggered: User inactive for 15s. Session safely terminated.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div 
                className="overflow-hidden animate-fade-in rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-xs font-medium text-red-400 shadow-[0_0_10px_rgba(255,0,0,0.1)] backdrop-blur-sm"
              >
                {error}
              </div>
            )}

            {/* Quick Fill Preset Buttons for Viva */}
            <div className="flex items-center justify-between gap-1.5 pb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quick Fill:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => { setIdentifier("admin"); setPassword("password"); }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 transition-colors"
                  title="Level 3 Administrator Clearance"
                >
                  Admin (L3)
                </button>
                <button
                  type="button"
                  onClick={() => { setIdentifier("agent"); setPassword("password"); }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                  title="Level 2 Senior Investigator Clearance"
                >
                  Agent (L2)
                </button>
                <button
                  type="button"
                  onClick={() => { setIdentifier("analyst"); setPassword("password"); }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                  title="Level 1 Analyst Clearance"
                >
                  Analyst (L1)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Identifier Input */}
              <div className="relative flex items-center overflow-hidden rounded-lg border border-slate-700/60 bg-[#1e2638]">
                <div className="flex h-12 w-12 items-center justify-center border-r border-slate-700/60 bg-[#161d2b]">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12 w-full bg-transparent px-4 text-sm font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none"
                  placeholder="admin"
                  aria-label="Username or Operator ID"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center overflow-hidden rounded-lg border border-slate-700/60 bg-[#1e2638]">
                <div className="flex h-12 w-12 items-center justify-center border-r border-slate-700/60 bg-[#161d2b]">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full bg-transparent px-4 text-sm font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none tracking-[0.2em]"
                  placeholder="••••••••"
                  aria-label="Security Token / Password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <div className="flex h-12 w-12 items-center justify-center border-l border-slate-700/60">
                  <Fingerprint className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Inactivity Timeout Policy Toggle Switch */}
            <div className="rounded-lg border border-cyan-500/20 bg-[#161d2b]/90 p-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md ${demoTimeoutActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-200">Auto-Logout Timeout</span>
                    <span className="block text-[10px] text-slate-400">
                      {demoTimeoutActive ? "Demo Mode: 15 Seconds" : "Standard Policy: 10 Minutes"}
                    </span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setDemoTimeoutActive(!demoTimeoutActive)}
                  aria-pressed={demoTimeoutActive}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    demoTimeoutActive ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      demoTimeoutActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {demoTimeoutActive && (
                <div className="mt-2 text-[10px] text-cyan-300/90 font-mono bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Viva Presentation Mode: Inactive for 15s triggers automatic session purge.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label="Initialize Connection"
              className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] font-bold tracking-wide text-white shadow-[0_4px_20px_rgba(0,198,255,0.4)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {loading ? (
                <span className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> AUTHENTICATING
                </span>
              ) : (
                <span className="text-[13px]">INITIALIZE CONNECTION</span>
              )}
            </button>
          </form>

          {/* Footer & Architecture Badges */}
          <div className="mt-6 space-y-2 text-center border-t border-slate-800/80 pt-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[10px] font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dual-Layer Encryption: TLS 1.3 + Field-Level AES-256-GCM</span>
            </div>
            <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Zero-Trust JWE Session Guard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
