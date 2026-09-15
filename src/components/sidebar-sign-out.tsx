import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export function SidebarSignOut() {
  return (
    <form action={signOut}>
      <SubmitButton
        className="button button-secondary min-h-0 w-full gap-2 py-2 text-xs font-bold"
        pendingText="Signing out…"
      >
        <LogOut size={15} aria-hidden />
        <span>Sign out</span>
      </SubmitButton>
    </form>
  );
}
