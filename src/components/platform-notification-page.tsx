import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { listNotifications } from "@/lib/platform-notifications";
import type { UserRole } from "@/lib/types";

export async function PlatformNotificationPage({ profileId, role, children }: { profileId: string; role: UserRole; children?: React.ReactNode }) {
  const { notifications, available } = await listNotifications(profileId);
  const unread = notifications.filter((item) => !item.readAt).length;
  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><span className="badge">Communication center</span><h1 className="mt-3 text-4xl font-black">Notifications</h1><p className="mt-2 text-[var(--muted)]">Important account and workflow updates for your {role.replaceAll("_", " ")} workspace.</p></div>
      {unread ? <form action={markAllNotificationsRead}><button className="button button-secondary" type="submit"><CheckCheck size={16} />Mark all read</button></form> : null}
    </div>
    {!available ? <p className="alert mt-6">Notifications will be available after the latest database migration is applied.</p> : null}
    <section className="mt-7 grid gap-3">
      {notifications.map((item) => <article className={`panel flex flex-wrap items-start justify-between gap-4 p-5 ${item.readAt ? "opacity-75" : "border-blue-200"}`} key={item.id}>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Bell size={16} className={item.readAt ? "text-[var(--muted)]" : "text-[var(--accent)]"} /><span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">{item.category}</span>{!item.readAt ? <span className="badge badge-accent">New</span> : null}</div><h2 className="mt-2 font-black">{item.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{item.body}</p><time className="mt-2 block text-[11px] text-[var(--muted)]">{new Date(item.createdAt).toLocaleString("en-IN")}</time></div>
        <div className="flex gap-2">{item.actionHref ? <Link className="button button-secondary text-xs" href={item.actionHref}>Open</Link> : null}{!item.readAt ? <form action={markNotificationRead}><input name="notification_id" type="hidden" value={item.id} /><button className="button button-secondary text-xs" type="submit">Mark read</button></form> : null}</div>
      </article>)}
      {available && !notifications.length ? <div className="panel p-8 text-center"><Bell className="mx-auto text-[var(--muted)]" /><h2 className="mt-3 font-black">You are all caught up</h2><p className="mt-1 text-sm text-[var(--muted)]">New workflow updates will appear here.</p></div> : null}
    </section>
    {children}
  </>;
}
