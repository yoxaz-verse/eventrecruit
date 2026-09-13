import { SignupForm } from "@/components/auth/signup-form";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage, resolveAuthMessage } from "@/components/auth/auth-message";
import { TopNav } from "@/components/top-nav";
import { getSupabaseServerConfig } from "@/lib/supabase/env";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; role?: string }>;
}) {
  const params = await searchParams;
  const supabaseConfigured = getSupabaseServerConfig().isConfigured;
  if (params?.message === "configure-supabase" && supabaseConfigured) {
    redirect("/signup");
  }

  const message = resolveAuthMessage(params?.message, {
    supabaseConfigured,
  });
  const selectedRole = ["organizer", "talent", "exhibitor", "agency"].includes(params?.role ?? "") ? params!.role! : "talent";

  return (
    <div className="shell">
      <TopNav />
      <AuthCard
        badge="Verified signup"
        title="Create your account"
        description="Start as an event organizer, talent, an exhibitor, or an agency for events and retail activations across India."
        footer={{ text: "Already registered?", href: "/login", label: "Log in" }}
      >
        <AuthMessage message={message} />
        <SignupForm selectedRole={selectedRole} />
      </AuthCard>
    </div>
  );
}
