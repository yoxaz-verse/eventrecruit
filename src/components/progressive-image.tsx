"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";

export interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
}

export function ProgressiveImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  fallbackIcon,
  ...props
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Skeleton Pulse & Loading Spinner Placeholder */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface-2)]/80 animate-pulse backdrop-blur-xs">
          <Loader2 size={18} className="animate-spin text-[var(--accent)]/70" />
        </div>
      )}

      {/* Fallback Display on Error */}
      {error ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--surface)] text-[var(--muted)] p-2 text-center border border-[var(--line)]">
          {fallbackIcon || <ImageIcon size={20} className="opacity-50" />}
        </div>
      ) : (
        /* Actual Image with Fade-in Animation */
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`transition-opacity duration-300 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
}
