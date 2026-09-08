"use client";

import React, { useState, useEffect } from "react";
import { Database, Server, ShieldCheck, Activity, CheckCircle2 } from "lucide-react";

export default function TelemetryBar() {
  const [latency, setLatency] = useState(24);

  // Subtle realistic latency fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(32, Math.max(18, prev + delta));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="z-header flex h-7 w-full shrink-0 items-center justify-between border-t border-[rgba(0,229,255,0.15)] bg-[#070B0E] px-3 md:px-5 font-mono text-[10px] text-[#6B9DA8] select-none">
      {/* Left Pipeline Status */}
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        <span className="font-bold text-[#E6F8FF] tracking-wider flex items-center gap-1.5">
          PIPELINE ACTIVE
        </span>
      </div>

      {/* Center Telemetry Metrics */}
      <div className="hidden sm:flex items-center gap-4 md:gap-6 text-[#6B9DA8]">
        <div className="flex items-center gap-1.5">
          <Database className="h-3 w-3 text-[#00E5FF]" />
          <span>DATABASE:</span>
          <span className="font-bold text-[#00E5FF]">PRISMA SQLITE: CONNECTED</span>
        </div>

        <span className="text-[rgba(0,229,255,0.2)]">|</span>

        <div className="flex items-center gap-1.5">
          <Server className="h-3 w-3 text-[#00E5FF]" />
          <span>MCP SERVER:</span>
          <span className="font-bold text-emerald-400">DARKNET INTEL (ACTIVE)</span>
        </div>

        <span className="text-[rgba(0,229,255,0.2)]">|</span>

        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-[#00E5FF]" />
          <span>SECURITY:</span>
          <span className="font-bold text-[#E6F8FF]">TLS 1.3 SECURE // API v1</span>
        </div>
      </div>

      {/* Right Latency / Operational Sync */}
      <div className="flex items-center gap-1.5 font-bold text-[#00E5FF]">
        <Activity className="h-3 w-3 text-[#00E5FF]" />
        <span>LATENCY:</span>
        <span className="text-[#E6F8FF] bg-[#111C24] px-1.5 py-0.5 rounded border border-[rgba(0,229,255,0.2)]">
          {latency}ms
        </span>
      </div>
    </footer>
  );
}
