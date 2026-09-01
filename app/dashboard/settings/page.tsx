import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { carriers } from "@/lib/db/schema";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../dashboard-shell";
import { isDashboardLanguage, type DashboardLanguage } from "../language";
import { settingsCopy } from "./copy";
import { CarrierSettings } from "./carrier-settings";
import { PriceSettingsForm } from "./price-settings-form";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get("plutos-language")?.value ?? "en";
  const language: DashboardLanguage = isDashboardLanguage(savedLanguage)
    ? savedLanguage
    : "en";
  const copy = settingsCopy[language];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [priceSettings, carrierRecords] = await Promise.all([
    getUserPriceSettings(user.id),
    getDatabase()
      .select({ id: carriers.id, name: carriers.name, information: carriers.information })
      .from(carriers)
      .where(eq(carriers.ownerId, user.id))
      .orderBy(asc(carriers.name)),
  ]);

  return (
    <DashboardShell
      email={user.email ?? "member@plutos.app"}
      language={language}
      activeSection="settings"
    >
      <div className="min-h-[calc(100dvh-73px)] bg-muted/20 p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <div className="grid gap-6">
          <PriceSettingsForm
            language={language}
            initialSettings={priceSettings}
          />
          <CarrierSettings language={language} carriers={carrierRecords} />
        </div>
      </div>
    </DashboardShell>
  );
}
