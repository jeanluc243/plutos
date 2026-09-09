import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { articleCategories, articles, orders, originCities, stockMovements } from "@/lib/db/schema";
import { getDashboardContext } from "../dashboard-context";
import { ArticlesWorkspace } from "@/app/dashboard/articles/articles-workspace";

export const metadata: Metadata = { title: "Articles" };

export default async function ArticlesPage() {
  const { language, user, isAdmin } = await getDashboardContext();

  const [records, priceSettings, categoryRecords, originCityRecords, orderRecords, stockRecords] = await Promise.all([
    getDatabase()
      .select()
      .from(articles)
      .where(isAdmin ? undefined : eq(articles.ownerId, user.id))
      .orderBy(desc(articles.createdAt)),
    getUserPriceSettings(user.id),
    getDatabase()
      .select({ id: articleCategories.id, name: articleCategories.name })
      .from(articleCategories)
      .where(eq(articleCategories.ownerId, user.id))
      .orderBy(articleCategories.name),
    getDatabase()
      .select({ id: originCities.id, countryCode: originCities.countryCode, name: originCities.name })
      .from(originCities)
      .where(eq(originCities.ownerId, user.id))
      .orderBy(originCities.name),
    getDatabase()
      .select({
        id: orders.id,
        articleId: orders.articleId,
        reference: orders.reference,
        carrier: orders.carrier,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(isAdmin ? undefined : eq(orders.ownerId, user.id))
      .orderBy(desc(orders.createdAt)),
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
  ]);

  return (
    <ArticlesWorkspace
      language={language}
      isAdmin={isAdmin}
      priceSettings={priceSettings}
      categories={categoryRecords}
      originCities={originCityRecords}
      orderHistory={orderRecords.flatMap((order) => order.articleId ? [{
        ...order,
        articleId: order.articleId,
        createdAt: order.createdAt.toISOString(),
      }] : [])}
      stockHistory={stockRecords.map((movement) => ({
        ...movement,
        createdAt: movement.createdAt.toISOString(),
      }))}
      articles={records.map((article) => ({
        ...article,
        purchasePrice: isAdmin ? Number(article.purchasePrice) : null,
        salePrice: Number(article.salePrice),
        transportCost: Number(article.transportCost),
        paymentCommission: Number(article.paymentCommission),
        chinaTransportCost: Number(article.chinaTransportCost),
        agencyTransportCost: Number(article.agencyTransportCost),
        gainMultiplier: Number(article.gainMultiplier),
        rating: Number(article.rating),
        createdAt: article.createdAt.toISOString(),
      }))}
    />
  );
}
