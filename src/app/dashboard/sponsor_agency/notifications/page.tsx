import { PlatformNotificationPage } from "@/components/platform-notification-page";
import { requireSponsorAgencyWorkspace } from "@/lib/dashboard-workspace";
export default async function SponsorAgencyNotificationsPage() { const { profile } = await requireSponsorAgencyWorkspace(); return <PlatformNotificationPage profileId={profile.id} role="sponsor_agency" />; }
