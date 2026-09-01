import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { articles, carriers, orders } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../dashboard-shell";
import { isDashboardLanguage, type DashboardLanguage } from "../language";
import { OrdersWorkspace } from "./orders-workspace";

export const metadata: Metadata = { title: "Commandes" };

export default async function OrdersPage() {
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

  const [records, carrierRecords, articleRecords] = await Promise.all([
    getDatabase()
      .select()
      .from(orders)
      .where(eq(orders.ownerId, user.id))
      .orderBy(desc(orders.createdAt)),
    getDatabase()
      .select({ id: carriers.id, name: carriers.name, information: carriers.information })
      .from(carriers)
      .where(eq(carriers.ownerId, user.id))
      .orderBy(asc(carriers.name)),
    getDatabase()
      .select({ id: articles.id, name: articles.name, sku: articles.sku })
      .from(articles)
      .where(eq(articles.ownerId, user.id))
      .orderBy(asc(articles.name)),
  ]);

  return (
    <DashboardShell
      email={user.email ?? "member@plutos.app"}
      language={language}
      activeSection="activeOrders"
    >
      <OrdersWorkspace
        language={language}
        carriers={carrierRecords}
        articles={articleRecords}
        orders={records.map((order) => ({
          ...order,
          cbm: order.cbm === null ? null : Number(order.cbm),
          eta: order.eta.toISOString(),
          createdAt: order.createdAt.toISOString(),
        }))}
      />
    </DashboardShell>
  );
}
