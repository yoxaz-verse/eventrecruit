import { AccountSettingsPanel } from "@/components/account-settings-panel";
import { accountSettingsData } from "@/lib/account-settings";
export default async function SponsorAgencySettings(){const data=await accountSettingsData();return <><h1 className="mb-6 text-4xl font-black">Sponsor agency settings</h1><AccountSettingsPanel emailNotifications={data.emailNotifications} inAppNotifications={data.inAppNotifications} deletionPending={data.deletionPending} availability={data.availability}/></>;}
