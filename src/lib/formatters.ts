/**
 * Utility functions for clean, professional display formatting of dates, times, rates, and titles across EventRecruit / exporb.
 */

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const clean = timeStr.trim();
  const parts = clean.split(":");
  if (parts.length < 2) return clean;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return clean;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
}

export function formatShiftTime(startStr: string | null | undefined, endStr: string | null | undefined): string {
  if (!startStr || !endStr) return startStr || endStr || "";
  const formattedStart = formatTime(startStr);
  const formattedEnd = formatTime(endStr);
  return `${formattedStart} – ${formattedEnd}`;
}

export function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const clean = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean;
  const date = new Date(clean.includes("T") ? clean : `${clean}T00:00:00`);
  if (isNaN(date.getTime())) return clean;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateRangeDisplay(startStr: string | null | undefined, endStr: string | null | undefined): string {
  if (!startStr) return formatDateDisplay(endStr);
  if (!endStr || startStr === endStr) return formatDateDisplay(startStr);

  const startClean = startStr.trim();
  const endClean = endStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(startClean) || !/^\d{4}-\d{2}-\d{2}/.test(endClean)) {
    return `${startClean} – ${endClean}`;
  }

  const startDate = new Date(startClean.includes("T") ? startClean : `${startClean}T00:00:00`);
  const endDate = new Date(endClean.includes("T") ? endClean : `${endClean}T00:00:00`);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return `${startClean} – ${endClean}`;
  }

  const startMonth = startDate.toLocaleDateString("en-IN", { month: "short" });
  const endMonth = endDate.toLocaleDateString("en-IN", { month: "short" });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}, ${startYear}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
  }

  return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
}

export function formatHourlyRate(rate: number | null | undefined, unit: "hour" | "day" = "hour"): string {
  if (rate == null || isNaN(rate) || rate <= 0) {
    return "Competitive";
  }
  return `₹${rate.toLocaleString("en-IN")}/${unit}`;
}

export function formatTitleCase(str: string | null | undefined): string {
  if (!str) return "";
  const trimmed = str.trim();
  if (!trimmed) return "";

  const acronyms = new Set(["atb", "it", "hr", "id", "vip", "pr", "ai", "ml", "ui", "ux", "ceo", "cto"]);

  return trimmed
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (acronyms.has(lower)) {
        return lower.toUpperCase();
      }
      if (word.length <= 1) return word.toUpperCase();
      if (word === lower) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(" ");
}
