import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { articleCategories, articles, originCities } from "@/lib/db/schema";
import { getDashboardContext } from "../dashboard-context";
import { ArticlesWorkspace } from "@/app/dashboard/articles/articles-workspace";

export const metadata: Metadata = { title: "Articles" };

export default async function ArticlesPage() {
  const { language, user, isAdmin } = await getDashboardContext();

  const [records, priceSettings, categoryRecords, originCityRecords] = await Promise.all([
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
  ]);

  return (
    <ArticlesWorkspace
      language={language}
      priceSettings={priceSettings}
      categories={categoryRecords}
      originCities={originCityRecords}
      articles={records.map((article) => ({
        ...article,
        purchasePrice: Number(article.purchasePrice),
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
