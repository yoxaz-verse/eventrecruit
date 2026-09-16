"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const frame=requestAnimationFrame(()=>{setLoading(false);setProgress(100);});
    const timer = setTimeout(() => {
      setProgress(0);
    }, 300);
    return () => {cancelAnimationFrame(frame);clearTimeout(timer);};
  }, [pathname, searchParams]);

  useEffect(() => {
    // Listen for link clicks across the app for instant navigation feedback
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || anchor.target === "_blank") return;

      const currentUrl = window.location.pathname + window.location.search;
      if (href !== currentUrl) {
        setLoading(true);
        setProgress(30);

        // Incrementally advance progress to signal active loading
        const p1 = setTimeout(() => setProgress(65), 150);
        const p2 = setTimeout(() => setProgress(85), 500);

        return () => {
          clearTimeout(p1);
          clearTimeout(p2);
        };
      }
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => document.removeEventListener("click", handleLinkClick, { capture: true });
  }, []);

  if (progress === 0 && !loading) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 bg-transparent overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-[var(--accent)] to-amber-400 shadow-[0_0_12px_rgba(37,99,235,0.8)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
