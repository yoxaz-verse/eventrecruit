"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_URL;
    if (!endpoint) return;
    const body = JSON.stringify({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      path: window.location.pathname,
    });
    if (navigator.sendBeacon) navigator.sendBeacon(endpoint, body);
    else void fetch(endpoint, { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  });
  return null;
}
