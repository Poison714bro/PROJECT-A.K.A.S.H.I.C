"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface DrugRadarIrisProps {
  data: Array<{ name: string; value: number; color?: string }>;
  onSelectCategory?: (name: string) => void;
}

const DEFAULT_DRUG_DATA = [
  { name: "Opioids/Fentanyl", value: 45, color: "#FF334B" },
  { name: "Stimulants", value: 32, color: "#00F0FF" },
  { name: "Psychedelics", value: 18, color: "#B026FF" },
  { name: "Prescription/Other", value: 28, color: "#FFB800" },
  { name: "Cannabis", value: 14, color: "#00E5BE" },
];

export function DrugRadarIris({ data, onSelectCategory }: DrugRadarIrisProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const activeData = data && data.length > 0 ? data : DEFAULT_DRUG_DATA;
  const totalValue = activeData.reduce((sum, item) => sum + (item.value || 0), 0) || 1;

  // Donut geometry:
  // In a 240x240 SVG, an outer radius of 84px gives a diameter of 168px (70% of 240px)
  const cx = 120;
  const cy = 120;
  const outerRadius = 84;
  const innerRadius = 62;
  const gapDegrees = 3; // gap between donut slices

  // Helper to convert polar coordinates to Cartesian
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Helper to generate SVG donut segment path
  const createDonutSegment = (
    startAngle: number,
    endAngle: number,
    outerR: number,
    innerR: number
  ) => {
    const p1 = polarToCartesian(cx, cy, outerR, startAngle);
    const p2 = polarToCartesian(cx, cy, outerR, endAngle);
    const p3 = polarToCartesian(cx, cy, innerR, endAngle);
    const p4 = polarToCartesian(cx, cy, innerR, startAngle);

    const arcSweep = endAngle - startAngle;
    const largeArcFlag = arcSweep > 180 ? 1 : 0;

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
      "Z",
    ].join(" ");
  };

  // Calculate arc slices
  let cumulativeAngle = 0;
  const slices = activeData.map((item) => {
    const sliceAngle = ((item.value || 0) / totalValue) * 360;
    const startAngle = cumulativeAngle + gapDegrees / 2;
    const endAngle = cumulativeAngle + sliceAngle - gapDegrees / 2;
    cumulativeAngle += sliceAngle;

    return {
      name: item.name,
      value: item.value,
      color: item.color || "#00F0FF",
      startAngle,
      endAngle: Math.max(startAngle + 0.5, endAngle),
      percentage: Math.round(((item.value || 0) / totalValue) * 100),
    };
  });

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      {/* Outer ambient glow */}
      <div className="absolute h-52 w-52 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

      {/* SVG Donut Chart (70% card height) with Concentric Target Rings Centered Inside */}
      <svg
        viewBox="0 0 240 240"
        className="h-56 sm:h-60 w-auto select-none overflow-visible cursor-pointer"
      >
        <defs>
          <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="reticleGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Outer Donut Slices (fills 70% of 240px height) ── */}
        <g className="transition-all duration-300">
          {slices.map((slice, idx) => {
            const isHovered = hoveredCategory === slice.name;
            const segmentOuterR = isHovered ? outerRadius + 3 : outerRadius;
            const segmentInnerR = isHovered ? innerRadius - 2 : innerRadius;
            const pathD = createDonutSegment(
              slice.startAngle,
              slice.endAngle,
              segmentOuterR,
              segmentInnerR
            );

            return (
              <g
                key={`slice-${idx}`}
                onClick={() => onSelectCategory?.(slice.name)}
                onMouseEnter={() => setHoveredCategory(slice.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <path
                  d={pathD}
                  fill={slice.color}
                  fillOpacity={isHovered ? 1 : 0.85}
                  stroke={slice.color}
                  strokeWidth={isHovered ? 2 : 1}
                  filter="url(#donutGlow)"
                  className="transition-all duration-200 hover:brightness-125"
                />
              </g>
            );
          })}
        </g>

        {/* ── Concentric Target Rings Centered Inside Donut Hole (Radius < 62px) ── */}
        <g id="concentric-target-rings" filter="url(#reticleGlow)">
          {/* Target Reticle Outer Ring (r=52px) */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={52}
            stroke="#00F0FF"
            strokeWidth={1}
            strokeOpacity={0.4}
            strokeDasharray="4 4"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Target Reticle Mid Ring (r=36px) */}
          <circle
            cx={cx}
            cy={cy}
            r={36}
            stroke="#00F0FF"
            strokeWidth={1}
            strokeOpacity={0.65}
            fill="rgba(4, 18, 24, 0.45)"
          />

          {/* Target Reticle Inner Ring (r=20px) */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={20}
            stroke="#00E5BE"
            strokeWidth={1.2}
            strokeOpacity={0.8}
            strokeDasharray="2 3"
            fill="none"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Horizontal Crosshairs with Center Gap */}
          <line
            x1={cx - 56}
            y1={cy}
            x2={cx - 10}
            y2={cy}
            stroke="#00F0FF"
            strokeWidth={1}
            strokeOpacity={0.6}
          />
          <line
            x1={cx + 10}
            y1={cy}
            x2={cx + 56}
            y2={cy}
            stroke="#00F0FF"
            strokeWidth={1}
            strokeOpacity={0.6}
          />

          {/* Vertical Crosshairs with Center Gap */}
          <line
            x1={cx}
            y1={cy - 56}
            x2={cx}
            y2={cy - 10}
            stroke="#00F0FF"
            strokeWidth={1}
            strokeOpacity={0.6}
          />
          <line
            x1={cx}
            y1={cy + 10}
            x2={cx}
            y2={cy + 56}
            stroke="#00F0FF"
            strokeWidth={1}
            strokeOpacity={0.6}
          />

          {/* Diagonal Corner Radar Ticks */}
          <line x1={cx - 38} y1={cy - 38} x2={cx - 32} y2={cy - 32} stroke="#00F0FF" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={cx + 38} y1={cy - 38} x2={cx + 32} y2={cy - 32} stroke="#00F0FF" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={cx - 38} y1={cy + 38} x2={cx - 32} y2={cy + 32} stroke="#00F0FF" strokeWidth={1} strokeOpacity={0.4} />
          <line x1={cx + 38} y1={cy + 38} x2={cx + 32} y2={cy + 32} stroke="#00F0FF" strokeWidth={1} strokeOpacity={0.4} />

          {/* Rotating Radar Sweep Beam */}
          <motion.line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - 50}
            stroke="#00F0FF"
            strokeWidth={1.5}
            strokeOpacity={0.7}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Center Target Bullseye Core */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={5}
            fill="#00F0FF"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <circle cx={cx} cy={cy} r={2} fill="#FFFFFF" />
        </g>

        {/* Dynamic Center Tooltip / Hover Stat readout */}
        {hoveredCategory && (
          <g>
            <rect
              x={cx - 45}
              y={cy + 38}
              width={90}
              height={18}
              rx={3}
              fill="#020c15"
              stroke="#00F0FF"
              strokeWidth={0.8}
              fillOpacity={0.9}
            />
            <text
              x={cx}
              y={cy + 50}
              textAnchor="middle"
              fill="#00F0FF"
              fontSize={8.5}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {hoveredCategory.toUpperCase().slice(0, 14)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default DrugRadarIris;
