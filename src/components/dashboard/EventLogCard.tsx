"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";

interface EventLogCardProps {
  className?: string;
}

export function EventLogCard({ className = "" }: EventLogCardProps) {
  const logEntries = [
    { prefix: "[RECV...]", status: "[ENCYPT_SECURED]", ip: "10.0.1.25", port: "44S", time: "12:14:02" },
    { prefix: "[RECV...]", status: "[ENCRYPT_LINK_SECURED]", ip: "192.168.4.11", port: "8080", time: "12:13:58" },
    { prefix: "[RECV...]", status: "[ENCRYPT_LINK_SECURED]", ip: "172.16.88.2", port: "9001", time: "12:13:42" },
    { prefix: "[RECV...]", status: "[ENCRYPT_LINK_SECURED]", ip: "10.14.0.9", port: "443", time: "12:13:19" },
  ];

  return (
    <div
      className={`relative overflow-hidden p-5 text-[#E6F8FF] border border-[#00F0FF]/30 shadow-[inset_0_0_15px_rgba(0,240,255,0.05)] flex flex-col justify-between ${className}`}
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
        backgroundColor: "rgba(4, 18, 24, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Background Cyber Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#0A2B35] pb-2">
        <h3 className="text-sm font-bold font-mono text-white tracking-wide">Event Log</h3>
        <button
          type="button"
          aria-label="Event Log Options"
          className="text-[#6B9DA8] hover:text-cyan-400 transition-colors p-1"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Monospace Encrypted Stream */}
      <div className="relative z-10 my-3 space-y-2 font-mono text-[11px]">
        {logEntries.map((log, i) => (
          <div key={i} className="flex items-center gap-2 tracking-wide">
            <span className="text-[#6B9DA8]">{log.prefix}</span>
            <span className="text-emerald-400 font-semibold drop-shadow-[0_0_6px_rgba(0,229,190,0.6)]">
              {log.status}
            </span>
            <span className="hidden sm:inline text-[9px] text-[#6B9DA8]/60 ml-auto">{log.time}</span>
          </div>
        ))}
      </div>

      {/* Bottom status badge */}
      <div className="relative z-10 flex items-center justify-between text-[8.5px] font-mono text-[#6B9DA8] border-t border-[#0A2B35]/60 pt-2">
        <span>UPLINK_BUFFER: 99.4%</span>
        <span className="text-cyan-400 font-bold">STATUS: STREAMING</span>
      </div>
    </div>
  );
}

export default EventLogCard;
