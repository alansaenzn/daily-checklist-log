import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { MomentumSettingsProvider } from "@/components/MomentumSettingsProvider";
import { fetchUserMomentumThreshold } from "@/lib/user-settings";

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

  const momentumThreshold = await fetchUserMomentumThreshold(
    supabase,
    userData.user.id
  );

  return (
    <MomentumSettingsProvider initialMomentumThreshold={momentumThreshold}>
      <main className="mx-auto max-w-xl px-4 py-6 min-h-screen">{children}</main>
    </MomentumSettingsProvider>
  );
}
