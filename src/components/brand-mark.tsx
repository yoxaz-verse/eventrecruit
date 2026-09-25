import { Sparkles } from "lucide-react";

export interface BrandMarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
  showStatusDot?: boolean;
}

export function BrandMark({ size = 42, className = "", animated = false, showStatusDot = false }: BrandMarkProps) {
  const iconSize = Math.max(14, Math.round(size * 0.52));
  const dotSize = Math.max(10, Math.round(size * 0.25));

  return (
    <span
      className={`brand-mark ${animated ? "spin-slow-pulse" : ""} ${className}`.trim()}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
      aria-hidden="true"
    >
      <Sparkles size={iconSize} strokeWidth={2.25} className={animated ? "animate-pulse" : undefined} />
      {showStatusDot ? (
        <span className="brand-status-dot" style={{ width: dotSize, height: dotSize }}>
          <span className="brand-status-ping" />
          <span className="brand-status-core" />
        </span>
      ) : null}
    </span>
  );
}
