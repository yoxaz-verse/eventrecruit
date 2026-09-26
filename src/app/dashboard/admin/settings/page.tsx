import { reactivateAccount, reviewAccountDeletion } from "@/app/actions/account-settings";
import { AccountSettingsPanel } from "@/components/account-settings-panel";
import { accountSettingsData } from "@/lib/account-settings";
import { requireAdminWorkspace } from "@/lib/dashboard-workspace";

export default async function AdminSettings() {
  const [settings,{db:workspaceDb}] = await Promise.all([accountSettingsData(),requireAdminWorkspace()]);
  const db = settings.availability === "ready" ? workspaceDb : null;
  const [pendingResult, disabledResult] = db ? await Promise.all([
    db.from("account_deletion_requests").select("id,profile_id,requested_at,profiles!account_deletion_requests_profile_id_fkey(full_name,role)").eq("status", "pending").order("requested_at"),
    db.from("app_accounts").select("id,email,disabled_at,profiles(full_name,role)").not("disabled_at", "is", null).order("disabled_at", { ascending: false }),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (pendingResult.error) console.error(JSON.stringify({ event: "admin_settings_queue_load_failed", queue: "deletion_requests", code: pendingResult.error.code ?? "unknown" }));
  if (disabledResult.error) console.error(JSON.stringify({ event: "admin_settings_queue_load_failed", queue: "disabled_accounts", code: disabledResult.error.code ?? "unknown" }));
  const pending = pendingResult.data ?? [];
  const disabled = disabledResult.data ?? [];

  return <>
    <div className="mx-auto max-w-4xl">
      <h1 className="text-4xl font-black">Settings</h1>
      <p className="mt-2 mb-6 text-[var(--muted)]">Manage administrator preferences, security, and account deletion reviews.</p>
      <AccountSettingsPanel emailNotifications={settings.emailNotifications} inAppNotifications={settings.inAppNotifications} deletionPending={settings.deletionPending} availability={settings.availability}/>
      {settings.availability === "ready" ? <>
        <section className="panel mt-6 p-5 sm:p-6"><h2 className="text-xl font-black">Deletion review queue</h2><div className="mt-4 grid gap-3">
          {pending.map(request => { const person = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles; return <form action={reviewAccountDeletion} className="rounded-xl border border-[var(--line)] p-4" key={request.id}><input type="hidden" name="request_id" value={request.id}/><strong>{person?.full_name ?? "Account"}</strong><p className="text-xs capitalize text-[var(--muted)]">{person?.role} · requested {new Date(request.requested_at).toLocaleDateString()}</p><input className="input mt-3" name="review_note" maxLength={1000} placeholder="Optional review note"/><div className="mt-3 flex gap-2"><button className="button button-secondary" name="decision" value="rejected">Reject</button><button className="button border border-red-300 bg-red-50 text-red-700" name="decision" value="approved">Approve and deactivate</button></div></form>; })}
          {!pending.length ? <p className="text-sm text-[var(--muted)]">No deletion requests are awaiting review.</p> : null}
        </div></section>
        <section className="panel mt-6 p-5 sm:p-6"><h2 className="text-xl font-black">Disabled accounts</h2><div className="mt-4 grid gap-3">
          {disabled.map(account => { const person = Array.isArray(account.profiles) ? account.profiles[0] : account.profiles; return <form action={reactivateAccount} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-4" key={account.id}><input type="hidden" name="profile_id" value={account.id}/><div><strong>{person?.full_name ?? account.email}</strong><p className="text-xs capitalize text-[var(--muted)]">{person?.role} · {account.email}</p></div><button className="button button-secondary">Reactivate</button></form>; })}
          {!disabled.length ? <p className="text-sm text-[var(--muted)]">No accounts are disabled.</p> : null}
        </div></section>
      </> : null}
    </div>
  </>;
}
