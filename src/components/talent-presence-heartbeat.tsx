"use client";

import { useEffect } from "react";

export function TalentPresenceHeartbeat() {
  useEffect(() => {
    const heartbeat = () => {
      if (document.visibilityState === "visible") void fetch("/api/talent/presence", { method: "POST", cache: "no-store" });
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, 60_000);
    document.addEventListener("visibilitychange", heartbeat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, []);
  return null;
}
