import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { articles, orders, stockMovements } from "@/lib/db/schema";
import { getDashboardContext } from "../dashboard-context";
import { StockWorkspace } from "./stock-workspace";

export const metadata: Metadata = { title: "Gestion de stock" };

export default async function StockPage() {
  const { language, user, isAdmin } = await getDashboardContext();
  const [articleRecords, movementRecords, orderRecords] = await Promise.all([
    getDatabase()
      .select({
        id: articles.id,
        name: articles.name,
        sku: articles.sku,
        category: articles.category,
        images: articles.images,
        stock: articles.stock,
        information: articles.information,
      })
      .from(articles)
      .where(isAdmin ? undefined : eq(articles.ownerId, user.id))
      .orderBy(articles.name),
    getDatabase()
      .select({
        id: stockMovements.id,
        articleId: stockMovements.articleId,
        movementType: stockMovements.movementType,
        quantityChange: stockMovements.quantityChange,
        stockBefore: stockMovements.stockBefore,
        stockAfter: stockMovements.stockAfter,
        reason: stockMovements.reason,
        createdByEmail: stockMovements.createdByEmail,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .where(isAdmin ? undefined : eq(stockMovements.ownerId, user.id))
      .orderBy(desc(stockMovements.createdAt)),
    getDatabase()
      .select({
        id: orders.id,
        articleId: orders.articleId,
        reference: orders.reference,
        quantity: orders.quantity,
        status: orders.status,
        progress: orders.progress,
        carrier: orders.carrier,
        transportMode: orders.transportMode,
        originCity: orders.originCity,
        originCountryCode: orders.originCountryCode,
        destinationCity: orders.destinationCity,
        destinationCountryCode: orders.destinationCountryCode,
        eta: orders.eta,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(isAdmin ? undefined : eq(orders.ownerId, user.id))
      .orderBy(desc(orders.createdAt)),
  ]);

  return (
    <StockWorkspace
      language={language}
      articles={articleRecords}
      movements={movementRecords.map((movement) => ({
        ...movement,
        createdAt: movement.createdAt.toISOString(),
      }))}
      orders={orderRecords.flatMap((order) => order.articleId ? [{
        ...order,
        articleId: order.articleId,
        eta: order.eta.toISOString(),
        createdAt: order.createdAt.toISOString(),
      }] : [])}
    />
  );
}
