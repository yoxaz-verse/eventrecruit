"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { DualTextSpinner } from "@/components/dual-text-spinner";

const OVERLAY_DELAY_MS = 120;
const NAVIGATION_TIMEOUT_MS = 15_000;

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const finishNavigation = useCallback(() => {
    clearTimers();
    setLoading(false);
    setShowOverlay(false);
    setProgress(100);

    document.querySelectorAll('[data-loading="true"]').forEach((element) => {
      element.removeAttribute("data-loading");
    });

    timersRef.current.push(
      window.setTimeout(() => setProgress(0), 350),
    );
  }, [clearTimers]);

  const startNavigation = useCallback((element?: HTMLElement) => {
    clearTimers();
    element?.setAttribute("data-loading", "true");
    setLoading(true);
    setShowOverlay(false);
    setProgress(35);

    timersRef.current.push(
      window.setTimeout(() => setShowOverlay(true), OVERLAY_DELAY_MS),
      window.setTimeout(() => setProgress(65), 180),
      window.setTimeout(() => setProgress(88), 550),
      window.setTimeout(() => finishNavigation(), NAVIGATION_TIMEOUT_MS),
    );
  }, [clearTimers, finishNavigation]);

  // Clear loading attributes on route/search changes
  useEffect(() => {
    const frame = requestAnimationFrame(finishNavigation);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pathname, searchParams, finishNavigation]);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest<HTMLElement>(
        "a[href], .dashboard-nav-link[href]"
      );

      if (!clickable) return;

      if (
        clickable.hasAttribute("disabled") ||
        clickable.getAttribute("aria-disabled") === "true" ||
        clickable.getAttribute("data-loading") === "true" ||
        clickable.getAttribute("data-pending") === "true"
      ) {
        return;
      }

      const href = clickable.getAttribute("href");
      if (!href || clickable.hasAttribute("download") || clickable.getAttribute("target") === "_blank") return;

      let destination: URL;
      try {
        destination = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

      startNavigation(clickable);
    };

    const handlePopState = () => startNavigation();

    document.addEventListener("click", handleGlobalClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [clearTimers, startNavigation]);

  if (progress === 0 && !loading && !showOverlay) return null;

  return (
    <>
      {showOverlay && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[var(--background)]/96 px-4 backdrop-blur-sm">
          <DualTextSpinner
            size="md"
            label="Loading your next page"
            sublabel="Preparing your Expoline workspace..."
            showQuotes={false}
            className="w-full max-w-xl"
          />
        </div>
      )}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 bg-transparent overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-[var(--accent)] to-amber-400 shadow-[0_0_14px_rgba(37,99,235,0.9)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
        />
      </div>
    </>
  );
}

