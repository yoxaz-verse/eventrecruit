import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function DashboardIndex() {
  const profile = await getCurrentProfile();
  redirect(profile?.role ? `/dashboard/${profile.role}` : "/login");
}
