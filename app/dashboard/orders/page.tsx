import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { articles, carriers, orders } from "@/lib/db/schema";
import { getDashboardContext } from "../dashboard-context";
import { OrdersWorkspace } from "./orders-workspace";

export const metadata: Metadata = { title: "Commandes" };

export default async function OrdersPage() {
  const { language, user, isAdmin } = await getDashboardContext();

  const [records, carrierRecords, articleRecords, priceSettings] = await Promise.all([
    getDatabase()
      .select()
      .from(orders)
      .where(isAdmin ? undefined : eq(orders.ownerId, user.id))
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
    getUserPriceSettings(user.id),
  ]);

  return (
    <OrdersWorkspace
      language={language}
      carriers={carrierRecords}
      articles={articleRecords}
      priceSettings={priceSettings}
      orders={records.map((order) => ({
        ...order,
        cbm: order.cbm === null ? null : Number(order.cbm),
        purchaseUnitPrice: Number(order.purchaseUnitPrice),
        eta: order.eta.toISOString(),
        createdAt: order.createdAt.toISOString(),
      }))}
    />
  );
}
