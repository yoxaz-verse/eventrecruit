"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  onLoad,
  onError,
  ...props
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleLoadSuccess = useCallback(
    (e?: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setLoaded(true);
      setError(false);
      if (e && onLoad) onLoad(e);
    },
    [onLoad]
  );

  const handleLoadError = useCallback(
    (e?: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setError(true);
      setLoaded(false);
      if (e && onError) onError(e);
    },
    [onError]
  );

  const checkComplete = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth > 0) {
        setLoaded(true);
        setError(false);
      } else {
        setError(true);
        setLoaded(false);
      }
    }
  }, []);

  const setRef = useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      if (node) {
        checkComplete(node);
      }
    },
    [checkComplete]
  );

  useEffect(() => {
    const frame=requestAnimationFrame(()=>{setLoaded(false);setError(!src);if(src&&imgRef.current)checkComplete(imgRef.current);});

    // Fallback safety check if network event does not fire within 5s
    const timer = setTimeout(() => {
      if (imgRef.current) {
        checkComplete(imgRef.current);
      }
    }, 5000);

    return () => {cancelAnimationFrame(frame);clearTimeout(timer);};
  }, [src, checkComplete]);

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
        /* eslint-disable-next-line @next/next/no-img-element -- private authenticated media bypasses the public optimizer */
        <img
          ref={setRef}
          src={src}
          alt={alt}
          onLoad={handleLoadSuccess}
          onError={handleLoadError}
          className={`transition-opacity duration-300 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
}
