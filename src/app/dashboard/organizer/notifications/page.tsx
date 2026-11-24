import { PlatformNotificationPage } from "@/components/platform-notification-page";
import { requireOrganizerWorkspace } from "@/lib/dashboard-workspace";
export default async function OrganizerNotificationsPage() { const { profile } = await requireOrganizerWorkspace(); return <PlatformNotificationPage profileId={profile.id} role="organizer" />; }
