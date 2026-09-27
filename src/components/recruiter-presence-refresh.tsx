"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RecruiterPresenceRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [router]);
  return null;
}
