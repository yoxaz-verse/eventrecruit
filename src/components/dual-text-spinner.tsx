"use client";

import { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, Building2, Users } from "lucide-react";

const DEFAULT_QUOTES = [
  "The right people make every moment matter.",
  "Connecting verified event talent across 10+ Indian markets.",
  "Coordinating hosts, promoters, registration crews & store teams...",
  "Verifying profiles, placement histories, and shift readiness...",
  "India-wide event staffing operations made seamless.",
];

export interface DualTextSpinnerProps {
  size?: "sm" | "md" | "lg";
  outerText?: string;
  innerText?: string;
  label?: string;
  sublabel?: string;
  quotes?: string[];
  showQuotes?: boolean;
  className?: string;
}

export function DualTextSpinner({
  size = "md",
  outerText = "EXPORB TALENT OPS • INDIA-WIDE EVENT STAFFING • VERIFIED PLACEMENTS • RECRUITMENT CREWS • ",
  innerText = "COORDINATING CREWS • VERIFYING SKILLS • LIVE DEMAND • MATCHING WORKSPACE • ",
  label,
  sublabel,
  quotes = DEFAULT_QUOTES,
  showQuotes = true,
  className = "",
}: DualTextSpinnerProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (!showQuotes || !quotes || quotes.length === 0) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [showQuotes, quotes]);

  // Dimension presets
  const dimMap = {
    sm: { viewBox: 220, outerR: 96, innerR: 72, fontSizeOuter: 10, fontSizeInner: 9, svgSize: 180, iconSize: 22 },
    md: { viewBox: 280, outerR: 122, innerR: 92, fontSizeOuter: 11.5, fontSizeInner: 10, svgSize: 250, iconSize: 30 },
    lg: { viewBox: 340, outerR: 148, innerR: 112, fontSizeOuter: 13, fontSizeInner: 11, svgSize: 320, iconSize: 38 },
  };

  const dim = dimMap[size] || dimMap.md;
  const center = dim.viewBox / 2;

  // Path definitions for SVG textPath
  const outerPathD = `M ${center}, ${center} m -${dim.outerR}, 0 a ${dim.outerR},${dim.outerR} 0 1,1 ${dim.outerR * 2},0 a ${dim.outerR},${dim.outerR} 0 1,1 -${dim.outerR * 2},0`;
  const innerPathD = `M ${center}, ${center} m -${dim.innerR}, 0 a ${dim.innerR},${dim.innerR} 0 1,1 ${dim.innerR * 2},0 a ${dim.innerR},${dim.innerR} 0 1,1 -${dim.innerR * 2},0`;

  const outerId = `outer-ring-${size}`;
  const innerId = `inner-ring-${size}`;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--accent)]/15 via-amber-400/10 to-blue-600/15 blur-2xl transform scale-110 pointer-events-none" />

        {/* SVG Dual Text Rings */}
        <svg
          viewBox={`0 0 ${dim.viewBox} ${dim.viewBox}`}
          style={{ width: dim.svgSize, height: dim.svgSize }}
          className="relative z-10 overflow-visible drop-shadow-sm"
        >
          <defs>
            <path id={outerId} d={outerPathD} />
            <path id={innerId} d={innerPathD} />
          </defs>

          {/* Outer Guideline Ring */}
          <circle
            cx={center}
            cy={center}
            r={dim.outerR}
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.12"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Inner Guideline Ring */}
          <circle
            cx={center}
            cy={center}
            r={dim.innerR}
            fill="none"
            stroke="var(--accent-2)"
            strokeOpacity="0.18"
            strokeWidth="1"
          />

          {/* Clockwise Outer Text Ring */}
          <g className="spin-clockwise">
            <text
              fill="var(--accent)"
              fontSize={dim.fontSizeOuter}
              fontWeight="800"
              letterSpacing="0.18em"
              className="uppercase"
            >
              <textPath href={`#${outerId}`} startOffset="0%">
                {outerText}
              </textPath>
            </text>
          </g>

          {/* Counter-Clockwise Inner Text Ring */}
          <g className="spin-counterclockwise">
            <text
              fill="var(--foreground)"
              fillOpacity="0.75"
              fontSize={dim.fontSizeInner}
              fontWeight="700"
              letterSpacing="0.16em"
              className="uppercase"
            >
              <textPath href={`#${innerId}`} startOffset="0%">
                {innerText}
              </textPath>
            </text>
          </g>
        </svg>

        {/* Center Logo Core */}
        <div className="absolute z-20 flex flex-col items-center justify-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ink)] text-white shadow-xl border border-white/20 spin-slow-pulse">
            <Sparkles size={dim.iconSize} className="text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border border-white" />
            </span>
          </div>
        </div>
      </div>

      {/* Optional Label / Header */}
      {label && (
        <h3 className="mt-5 text-base font-black tracking-tight text-[var(--foreground)]">
          {label}
        </h3>
      )}

      {/* Optional Sublabel */}
      {sublabel && (
        <p className="mt-1 text-xs text-[var(--muted)] font-medium max-w-sm">
          {sublabel}
        </p>
      )}

      {/* Rotating Event Staffing Quote Banner */}
      {showQuotes && quotes && quotes.length > 0 && (
        <div className="mt-4 max-w-md min-h-[44px] flex items-center justify-center px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-xs transition-all duration-300">
          <p className="text-xs font-semibold text-[var(--foreground)] italic flex items-center gap-2">
            <span className="text-[var(--accent)] not-italic font-black text-sm">“</span>
            <span>{quotes[quoteIndex]}</span>
            <span className="text-[var(--accent)] not-italic font-black text-sm">”</span>
          </p>
        </div>
      )}
    </div>
  );
}
