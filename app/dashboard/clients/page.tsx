import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { clients } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ClientsTable } from "./clients-table";
import { DashboardShell } from "../dashboard-shell";
import { isDashboardLanguage, type DashboardLanguage } from "../language";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
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

  const records = await getDatabase()
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      hasWhatsApp: clients.hasWhatsApp,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .where(eq(clients.ownerId, user.id))
    .orderBy(desc(clients.createdAt));

  return (
    <DashboardShell
      email={user.email ?? "member@plutos.app"}
      language={language}
      activeSection="clients"
    >
      <ClientsTable
        language={language}
        clients={records.map((client) => ({
          ...client,
          createdAt: client.createdAt.toISOString(),
        }))}
      />
    </DashboardShell>
  );
}
