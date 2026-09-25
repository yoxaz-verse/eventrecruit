import { Bell, KeyRound, LogOut, Trash2 } from "lucide-react";
import { beginSignedInPasswordReset, cancelAccountDeletion, requestAccountDeletion, saveAccountPreferences } from "@/app/actions/account-settings";
import { signOut } from "@/app/actions/auth";
import { accountSettingsData } from "@/lib/account-settings";

export async function AccountSettingsPanel({}: { emailNotifications: boolean; inAppNotifications: boolean; deletionPending: boolean }) {
  const { emailNotifications, inAppNotifications, deletionPending, availability } = await accountSettingsData();
  const ready = availability === "ready";
  return <div className="grid gap-6">
    {!ready ? <div className="alert border-amber-200 bg-amber-50 text-amber-900" role="status"><strong>Some settings are temporarily unavailable.</strong><p className="mt-1 text-sm">{availability === "migration_required" ? "Account preference storage is not configured for this deployment yet. Security actions remain available." : "We could not load account preferences right now. Try again shortly; security actions remain available."}</p></div> : null}
    <form action={saveAccountPreferences} className="panel grid gap-4 p-5 sm:p-6">
      <div className="flex items-center gap-2"><Bell className="text-[var(--accent)]" size={20} /><h2 className="text-xl font-black">Notifications</h2></div>
      <label className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-4"><input className="mt-1" type="checkbox" name="email_notifications" defaultChecked={emailNotifications} disabled={!ready} /><span><strong className="block">Email notifications</strong><small className="text-[var(--muted)]">Operational updates and account activity. Security messages are always sent.</small></span></label>
      <label className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-4"><input className="mt-1" type="checkbox" name="in_app_notifications" defaultChecked={inAppNotifications} disabled={!ready} /><span><strong className="block">In-app notifications</strong><small className="text-[var(--muted)]">Show relevant updates inside your dashboard.</small></span></label>
      <button className="button button-primary w-full sm:w-fit" disabled={!ready}>Save preferences</button>
    </form>
    <section className="panel grid gap-4 p-5 sm:p-6">
      <div className="flex items-center gap-2"><KeyRound className="text-[var(--accent)]" size={20} /><h2 className="text-xl font-black">Security</h2></div>
      <p className="text-sm text-[var(--muted)]">Password changes use a recovery code sent to your verified login email.</p>
      <div className="flex flex-wrap gap-3"><form action={() => beginSignedInPasswordReset()}><button className="button button-secondary">Reset password</button></form><form action={signOut}><button className="button button-secondary gap-2"><LogOut size={16} />Sign out</button></form></div>
    </section>
    <section className="panel grid gap-4 border-red-200 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-red-700"><Trash2 size={20} /><h2 className="text-xl font-black">Delete account</h2></div>
      <p className="text-sm text-[var(--muted)]">Deletion is reviewed by an administrator. Your account remains usable until approval, and operational records are retained.</p>
      {!ready ? <p className="text-sm text-[var(--muted)]">Account deletion controls will return when settings storage is available.</p> : deletionPending ? <><p className="alert border-amber-200 bg-amber-50 text-amber-900">Your deletion request is awaiting review.</p><form action={cancelAccountDeletion}><button className="button button-secondary">Cancel deletion request</button></form></> : <form action={requestAccountDeletion} className="grid gap-3"><label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" name="confirm" value="yes" required /><span>I understand that approval will deactivate my login.</span></label><button className="button w-fit border border-red-300 bg-red-50 text-red-700 hover:bg-red-100">Request account deletion</button></form>}
    </section>
  </div>;
}
