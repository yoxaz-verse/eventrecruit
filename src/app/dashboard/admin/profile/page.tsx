import { accountProfileData } from "@/app/actions/account-profile";
import { AccountProfileCard } from "@/components/account-profile-card";
import { DashboardShell } from "@/components/dashboard-shell";
export default async function AdminProfile({searchParams}:{searchParams:Promise<{saved?:string}>}){const data=await accountProfileData(),saved=(await searchParams).saved==="account";return <DashboardShell active="admin" current="/dashboard/admin/profile"><div className="mx-auto max-w-3xl"><h1 className="text-4xl font-black">Your profile</h1><p className="mt-2 mb-6 text-[var(--muted)]">Manage the personal identity attached to your administrator account.</p><AccountProfileCard id={data.profile.id} role="admin" fullName={data.profile.full_name} email={data.email} phone={data.phone} avatarUrl={data.profile.avatar_url} saved={saved}/></div></DashboardShell>}

