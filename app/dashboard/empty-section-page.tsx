import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type DashboardSection } from "./dashboard-shell";
import { isDashboardLanguage, type DashboardLanguage } from "./language";

export async function EmptySectionPage({
  activeSection,
}: {
  activeSection: DashboardSection;
}) {
  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get("plutos-language")?.value ?? "en";
  const language: DashboardLanguage = isDashboardLanguage(savedLanguage)
    ? savedLanguage
    : "en";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DashboardShell
      email={user.email ?? "member@plutos.app"}
      language={language}
      activeSection={activeSection}
    >
      <div className="min-h-[calc(100dvh-73px)]" />
    </DashboardShell>
  );
}
