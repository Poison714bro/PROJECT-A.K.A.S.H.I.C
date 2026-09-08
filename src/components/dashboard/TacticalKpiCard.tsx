"use client";

import React from "react";
import { Target, Gavel, Coins, ShieldAlert, Crosshair, ArrowUpRight } from "lucide-react";

export interface TacticalKpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  secondaryMetric?: string;
  showSparkline?: boolean;
  sparklineData?: number[];
  graphicType?: "eye" | "gavel" | "coins" | "shield" | "target" | "alert";
  icon?: React.ReactNode;
  showAction?: boolean;
  actionText?: string;
  onClick?: () => void;
  className?: string;
  // Backward compatibility props (gracefully ignored to eliminate visual clutter)
  streamId?: string;
  systemTag?: string;
  weekAvg?: number | string;
  useSevenSegment?: boolean;
}

/**
 * Compact, smooth 40px sparkline for law-enforcement metrics.
 */
function MiniSparkline({ isPositive, data }: { isPositive: boolean; data?: number[] }) {
  const strokeColor = isPositive ? "#00E5BE" : "#FF4D4D";
  const fillColor = isPositive ? "rgba(0, 229, 190, 0.15)" : "rgba(255, 77, 77, 0.15)";

  let pathD = isPositive
    ? "M 0,13 Q 10,14 18,9 T 32,5 L 40,2"
    : "M 0,3 Q 10,2 18,8 T 32,12 L 40,14";
  let areaD = isPositive
    ? "M 0,13 Q 10,14 18,9 T 32,5 L 40,2 L 40,16 L 0,16 Z"
    : "M 0,3 Q 10,2 18,8 T 32,12 L 40,14 L 40,16 L 0,16 Z";

  if (data && data.length >= 4) {
    const min = Math.min(...data);
    const max = Math.max(...data) || 1;
    const range = max - min || 1;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * 40;
      const y = 14 - ((val - min) / range) * 12;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    pathD = `M ${points.join(" L ")}`;
    areaD = `M ${points[0]} L ${points.join(" L ")} L 40,16 L 0,16 Z`;
  }

  return (
    <svg className="w-10 h-4 overflow-visible shrink-0 select-none" viewBox="0 0 40 16">
      <path d={areaD} fill={fillColor} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Tactical Outline Icon in #00F0FF80
 */
function CardOutlineIcon({ type }: { type?: string }) {
  const iconProps = { className: "w-5 h-5 text-[#00F0FF80] stroke-[1.5]" };

  switch (type) {
    case "eye":
    case "target":
      return <Crosshair {...iconProps} />;
    case "gavel":
      return <Gavel {...iconProps} />;
    case "coins":
      return <Coins {...iconProps} />;
    case "shield":
    case "alert":
      return <ShieldAlert {...iconProps} />;
    default:
      return <Target {...iconProps} />;
  }
}

export function TacticalKpiCard({
  title,
  value,
  trend,
  trendLabel = "vs 7d avg",
  secondaryMetric,
  showSparkline = true,
  sparklineData,
  graphicType = "target",
  icon,
  showAction = true,
  actionText = "View Details →",
  onClick,
  className = "",
}: TacticalKpiCardProps) {
  const isPositive = trend !== undefined ? trend >= 0 : true;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      className={`group relative flex flex-col justify-between p-5 text-[#E6F8FF] transition-all duration-200 hover:border-[rgba(0,240,255,0.35)] hover:bg-[rgba(4,14,22,0.92)] cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-cyan-400/40 ${className}`}
      style={{
        background: "rgba(3, 10, 16, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(0, 240, 255, 0.15)",
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
      }}
    >
      {/* ── Top Row: Metric Label on Left + Minimal Outline Icon on Right ── */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#6B9DA8] uppercase font-mono truncate">
          {title}
        </span>
        <div className="shrink-0 flex items-center justify-center">
          {icon ? icon : <CardOutlineIcon type={graphicType} />}
        </div>
      </div>

      {/* ── Middle Row: Primary Value in Crisp Tabular Figures ── */}
      <div className="my-3 flex items-baseline">
        <span className="text-3xl font-bold tracking-tight text-[#E6F8FF] tabular-nums font-sans">
          {value}
        </span>
      </div>

      {/* ── Bottom Row: Clean Trend Badge + Sparkline + Discreet Action Link ── */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#0A2B35]/40">
        <div className="flex items-center gap-2 min-w-0">
          {trend !== undefined && (
            <span
              className={`text-xs font-semibold whitespace-nowrap ${
                isPositive ? "text-[#00E5BE]" : "text-[#FF4D4D]"
              }`}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(trend)}%{" "}
              <span className="text-[#6B9DA8] font-normal">{trendLabel}</span>
            </span>
          )}
          {secondaryMetric && (
            <span className="text-xs text-[#6B9DA8] font-mono whitespace-nowrap">
              {secondaryMetric}
            </span>
          )}
          {showSparkline && <MiniSparkline isPositive={isPositive} data={sparklineData} />}
        </div>

        {showAction && (
          <span className="text-xs text-[#00F0FF]/80 group-hover:text-cyan-300 group-hover:underline transition-colors whitespace-nowrap font-medium shrink-0">
            {actionText}
          </span>
        )}
      </div>
    </div>
  );
}

export default TacticalKpiCard;
