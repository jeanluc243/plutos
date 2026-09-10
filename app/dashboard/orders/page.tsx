import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { articles, carriers, clients, orderItems, orders } from "@/lib/db/schema";
import { getDashboardContext } from "../dashboard-context";
import { OrdersWorkspace } from "./orders-workspace";

export const metadata: Metadata = { title: "Commandes" };

export default async function OrdersPage() {
  const { language, user, isAdmin } = await getDashboardContext();

  const [records, itemRecords, carrierRecords, articleRecords, clientRecords, priceSettings] = await Promise.all([
    getDatabase()
      .select()
      .from(orders)
      .where(isAdmin ? undefined : eq(orders.ownerId, user.id))
      .orderBy(desc(orders.createdAt)),
    getDatabase()
      .select()
      .from(orderItems)
      .where(isAdmin ? undefined : eq(orderItems.ownerId, user.id))
      .orderBy(asc(orderItems.createdAt)),
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
    getDatabase()
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(isAdmin ? undefined : eq(clients.ownerId, user.id))
      .orderBy(asc(clients.name)),
    getUserPriceSettings(user.id),
  ]);

  return (
    <OrdersWorkspace
      language={language}
      carriers={carrierRecords}
      articles={articleRecords}
      clients={clientRecords}
      priceSettings={priceSettings}
      orders={records.map((order) => {
        const storedItems = itemRecords
          .filter((item) => item.orderId === order.id)
          .map((item) => ({
            id: item.id,
            articleId: item.articleId,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            purchaseUnitPrice: Number(item.purchaseUnitPrice),
          }));
        const items = storedItems.length > 0 ? storedItems : [{
          id: `legacy-${order.id}`,
          articleId: order.articleId,
          description: order.cargo,
          sku: articleRecords.find((article) => article.id === order.articleId)?.sku ?? order.reference,
          quantity: order.quantity,
          purchaseUnitPrice: Number(order.purchaseUnitPrice),
        }];

        return {
          ...order,
          items,
          clientName: clientRecords.find((client) => client.id === order.clientId)?.name ?? null,
          cbm: order.cbm === null ? null : Number(order.cbm),
          purchaseUnitPrice: Number(order.purchaseUnitPrice),
          transportCost: Number(order.transportCost),
          additionalCharges: Number(order.additionalCharges),
          eta: order.eta.toISOString(),
          createdAt: order.createdAt.toISOString(),
          launchedAt: order.launchedAt?.toISOString() ?? null,
        };
      })}
    />
  );
}
