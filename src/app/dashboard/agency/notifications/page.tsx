import Link from "next/link";
import { agencyDataContext } from "@/lib/agency-data";
import { EmptyState } from "@/components/empty-state";
import { Bell } from "lucide-react";

export default async function Notifications() {
  const ctx = await agencyDataContext();
  if (!ctx) throw new Error("Notifications unavailable.");

  const { data } = await ctx.db
    .from("agency_notifications")
    .select("*")
    .eq("agency_id", ctx.agency.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <h1 className="text-4xl font-black">Notifications</h1>
      <div className="mt-6 grid gap-3">
        {data?.map((note) => (
          <Link href={note.href || "#"} className="panel p-5" key={note.id}>
            <h2 className="font-black">{note.title}</h2>
            <p className="text-sm text-[var(--muted)]">{note.body}</p>
            <time className="mt-2 block text-xs">{new Date(note.created_at).toLocaleString()}</time>
          </Link>
        ))}
        {!data?.length ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up! Updates about your agency events, applications, and staff will appear here."
          />
        ) : null}
      </div>
    </>
  );
}
