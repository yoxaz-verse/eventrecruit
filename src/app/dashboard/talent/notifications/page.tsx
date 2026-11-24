import { PlatformNotificationPage } from "@/components/platform-notification-page";
import { requireTalentWorkspace } from "@/lib/dashboard-workspace";
export default async function TalentNotificationsPage() { const { profile } = await requireTalentWorkspace(); return <PlatformNotificationPage profileId={profile.id} role="talent" />; }
