import { PlatformNotificationPage } from "@/components/platform-notification-page";
import { requireAdminWorkspace } from "@/lib/dashboard-workspace";
export default async function AdminNotificationsPage() { const { profile } = await requireAdminWorkspace(); return <PlatformNotificationPage profileId={profile.id} role="admin" />; }
