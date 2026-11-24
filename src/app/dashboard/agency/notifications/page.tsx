import { PlatformNotificationPage } from "@/components/platform-notification-page";
import { requireAgencyWorkspace } from "@/lib/dashboard-workspace";
import { agencyDataContext } from "@/lib/agency-data";
import Link from "next/link";

export default async function AgencyNotificationsPage() {
  const [{ profile }, context] = await Promise.all([requireAgencyWorkspace(), agencyDataContext()]);
  const legacy = context ? await context.db.from("agency_notifications").select("id,title,body,href,created_at").eq("agency_id", context.agency.id).order("created_at", { ascending: false }).limit(50) : { data: [] };
  return <PlatformNotificationPage profileId={profile.id} role="agency">
    {legacy.data?.length ? <section className="mt-9"><h2 className="text-2xl font-black">Agency operation updates</h2><div className="mt-4 grid gap-3">{legacy.data.map((note) => <Link className="panel p-5" href={note.href || "#"} key={note.id}><h3 className="font-black">{note.title}</h3><p className="text-sm text-[var(--muted)]">{note.body}</p><time className="mt-2 block text-xs text-[var(--muted)]">{new Date(note.created_at).toLocaleString("en-IN")}</time></Link>)}</div></section> : null}
  </PlatformNotificationPage>;
}
