"use client";

import { useEffect } from "react";

export function RefreshRestoredOtp() {
  useEffect(() => {
    const refresh = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", refresh);
    return () => window.removeEventListener("pageshow", refresh);
  }, []);
  return null;
}
