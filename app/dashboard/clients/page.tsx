import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { clients } from "@/lib/db/schema";
import { ClientsTable } from "./clients-table";
import { getDashboardContext } from "../dashboard-context";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const { language, user, isAdmin } = await getDashboardContext();

  const records = await getDatabase()
    .select({
      id: clients.id,
      ownerId: clients.ownerId,
      name: clients.name,
      phone: clients.phone,
      hasWhatsApp: clients.hasWhatsApp,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .where(isAdmin ? undefined : eq(clients.ownerId, user.id))
    .orderBy(desc(clients.createdAt));

  return (
    <ClientsTable
      language={language}
      clients={records.map((client) => ({
        ...client,
        canManage: isAdmin || client.ownerId === user.id,
        createdAt: client.createdAt.toISOString(),
      }))}
    />
  );
}
