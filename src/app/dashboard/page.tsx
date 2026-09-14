import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { nextAccountPath } from "@/lib/onboarding";

export default async function DashboardIndex() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const next = await nextAccountPath(profile.id);
  redirect(next === "/dashboard" ? `/dashboard/${profile.role}` : next);
}
