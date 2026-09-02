import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { appUsers, articleCategories, carriers } from "@/lib/db/schema";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { getDashboardContext } from "../dashboard-context";
import { settingsCopy } from "./copy";
import { CarrierSettings } from "./carrier-settings";
import { CategorySettings } from "./category-settings";
import { PriceSettingsForm } from "./price-settings-form";
import { UserRoleSettings } from "./user-role-settings";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const { language, user, isAdmin } = await getDashboardContext();
  const copy = settingsCopy[language];

  const [priceSettings, carrierRecords, categoryRecords, applicationUsers] = await Promise.all([
    getUserPriceSettings(user.id),
    getDatabase()
      .select({ id: carriers.id, name: carriers.name, information: carriers.information })
      .from(carriers)
      .where(eq(carriers.ownerId, user.id))
      .orderBy(asc(carriers.name)),
    getDatabase()
      .select({ id: articleCategories.id, name: articleCategories.name })
      .from(articleCategories)
      .where(eq(articleCategories.ownerId, user.id))
      .orderBy(asc(articleCategories.name)),
    isAdmin
      ? getDatabase()
          .select({ id: appUsers.id, email: appUsers.email, role: appUsers.role })
          .from(appUsers)
          .orderBy(asc(appUsers.email))
      : Promise.resolve([]),
  ]);

  return (
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
        <CategorySettings language={language} categories={categoryRecords} />
        {isAdmin && (
          <UserRoleSettings
            language={language}
            currentUserId={user.id}
            users={applicationUsers.map((applicationUser) => ({
              ...applicationUser,
              role: applicationUser.role === "admin" ? "admin" as const : "user" as const,
            }))}
          />
        )}
      </div>
    </div>
  );
}
