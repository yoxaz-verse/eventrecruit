"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Clear loading state on route/search changes
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setLoading(false);
      setProgress(100);

      // Clean up data-loading and injected spinners
      document.querySelectorAll('[data-loading="true"]').forEach((el) => {
        el.removeAttribute("data-loading");
        const spinner = el.querySelector(".btn-injected-spinner");
        if (spinner) spinner.remove();
      });
    });

    const timer = setTimeout(() => {
      setProgress(0);
    }, 350);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  // Global click & submit interceptors for instant visual feedback on buttons
  useEffect(() => {
    const clearElementLoading = (el: HTMLElement) => {
      el.removeAttribute("data-loading");
      const spinner = el.querySelector(".btn-injected-spinner");
      if (spinner) spinner.remove();
    };

    const applyElementLoading = (el: HTMLElement) => {
      el.setAttribute("data-loading", "true");
      if (
        !el.querySelector(".button-spinner") &&
        !el.querySelector(".btn-injected-spinner")
      ) {
        const spinner = document.createElement("span");
        spinner.className = "btn-injected-spinner";
        spinner.setAttribute("aria-hidden", "true");
        el.prepend(spinner);
      }
    };

    const handleGlobalClick = (event: MouseEvent) => {
      // Ignore right clicks or modifier key clicks (new tab opens)
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest<HTMLElement>(
        "button, a, .button, [role='button'], input[type='submit'], input[type='button'], .dashboard-nav-link"
      );

      if (!clickable) return;

      // Skip disabled or already loading elements
      if (
        clickable.hasAttribute("disabled") ||
        clickable.getAttribute("aria-disabled") === "true" ||
        clickable.getAttribute("data-loading") === "true" ||
        clickable.getAttribute("data-pending") === "true"
      ) {
        return;
      }

      const isAnchor = clickable.tagName === "A";
      const href = isAnchor ? clickable.getAttribute("href") : null;

      if (isAnchor && href) {
        if (
          href.startsWith("#") ||
          href.startsWith("javascript:") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          clickable.getAttribute("target") === "_blank"
        ) {
          return;
        }
      }

      // Apply button loading state visually
      applyElementLoading(clickable);

      setLoading(true);
      setProgress(35);

      const p1 = setTimeout(() => setProgress(65), 150);
      const p2 = setTimeout(() => setProgress(88), 450);

      // Auto safety cleanup if no route change occurs within 1.8 seconds
      const safetyTimeout = setTimeout(() => {
        clearElementLoading(clickable);
      }, 1800);

      return () => {
        clearTimeout(p1);
        clearTimeout(p2);
        clearTimeout(safetyTimeout);
      };
    };

    const handleFormSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;

      const submitter =
        (event.submitter as HTMLElement | null) ||
        form.querySelector<HTMLElement>("button[type='submit'], input[type='submit'], .button");

      if (submitter) {
        applyElementLoading(submitter);
      }

      setLoading(true);
      setProgress(35);

      const p1 = setTimeout(() => setProgress(70), 200);
      const p2 = setTimeout(() => setProgress(90), 550);

      const safetyTimeout = setTimeout(() => {
        if (submitter) {
          clearElementLoading(submitter);
        }
      }, 2500);

      return () => {
        clearTimeout(p1);
        clearTimeout(p2);
        clearTimeout(safetyTimeout);
      };
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    document.addEventListener("submit", handleFormSubmit, { capture: true });

    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
      document.removeEventListener("submit", handleFormSubmit, { capture: true });
    };
  }, []);

  if (progress === 0 && !loading) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 bg-transparent overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-[var(--accent)] to-amber-400 shadow-[0_0_14px_rgba(37,99,235,0.9)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

