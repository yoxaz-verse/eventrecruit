import type { UserRole } from "@/lib/types";

export function validateOnboarding(role: UserRole, data: FormData): string | null {
  const value = (key: string) => String(data.get(key) ?? "").trim();
  if (!value("phone") || value("phone").length > 40) return "Enter your private phone number.";
  if (role === "talent") {
    const preferred = data.getAll("preferred_location_ids").map(String).filter(Boolean);
    if (!value("home_location_id") || !preferred.length || new Set(preferred).size !== preferred.length) return "Choose your home city and at least one preferred work city.";
    const experience = value("experience_years");
    if (experience && (!Number.isFinite(Number(experience)) || Number(experience) < 0 || Number(experience) > 99)) return "Enter valid years of experience.";
  }
  if (role !== "talent" && (!value("city") || value("city").length > 120)) return "Enter your city and private phone number.";
  if (role === "agency") {
    if (!value("business_name") || value("business_name").length > 160) return "Enter your agency name.";
    const commission = value("commission_value");
    if ((commission && (!Number.isFinite(Number(commission)) || Number(commission) < 0)) || !["percentage", "fixed"].includes(value("commission_type"))) return "Enter valid commission details.";
  }
  if (role === "exhibitor" && (!value("business_name") || value("business_name").length > 160)) return "Enter your company name.";
  return null;
}

export function hasCoreProfile(role: UserRole, city?: string | null, phone?: string | null, details?: { headline?: string | null; skills?: string[] | null; name?: string | null; company_name?: string | null } | null) {
  if (!city?.trim() || !phone?.trim()) return false;
  if (role === "talent") return true;
  if (role === "agency") return Boolean(details?.name?.trim());
  if (role === "exhibitor") return Boolean(details?.company_name?.trim());
  return false;
}
