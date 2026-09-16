import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export function SidebarSignOut() {
  return (
    <form action={signOut}>
      <SubmitButton
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--muted)] hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer shadow-xs"
        pendingText="Signing out…"
      >
        <LogOut size={14} aria-hidden />
        <span>Sign out</span>
      </SubmitButton>
    </form>
  );
}
