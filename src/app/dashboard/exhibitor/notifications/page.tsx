import { PlatformNotificationPage } from "@/components/platform-notification-page";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";
export default async function ExhibitorNotificationsPage() { const { profile } = await requireExhibitorWorkspace(); return <PlatformNotificationPage profileId={profile.id} role="exhibitor" />; }
