import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { UserSettingsProvider } from "@/components/UserSettingsProvider";
import { fetchUserSettings } from "@/lib/user-settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = supabaseServer();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const settings = await fetchUserSettings(supabase, userData.user.id);

  return (
    <UserSettingsProvider
      initialSettings={settings}
      userEmail={userData.user.email ?? null}
      userId={userData.user.id}
    >
      <main className="mx-auto max-w-xl px-4 py-6 min-h-screen">{children}</main>
    </UserSettingsProvider>
  );
}
