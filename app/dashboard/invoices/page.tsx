import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { articles, clients } from "@/lib/db/schema";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { getDashboardContext } from "../dashboard-context";
import { PosWorkspace } from "./pos-workspace";

export const metadata: Metadata = { title: "Facturation POS" };

export default async function InvoicesPage() {
  const { language, user, isAdmin } = await getDashboardContext();
  const [articleRecords, clientRecords, priceSettings] = await Promise.all([
    getDatabase()
      .select({
        id: articles.id,
        sku: articles.sku,
        name: articles.name,
        category: articles.category,
        salePrice: articles.salePrice,
        stock: articles.stock,
      })
      .from(articles)
      .where(isAdmin ? undefined : eq(articles.ownerId, user.id))
      .orderBy(asc(articles.name)),
    getDatabase()
      .select({ id: clients.id, name: clients.name, phone: clients.phone })
      .from(clients)
      .where(isAdmin ? undefined : eq(clients.ownerId, user.id))
      .orderBy(asc(clients.name)),
    getUserPriceSettings(user.id),
  ]);
  const issuedAt = new Date();
  const invoiceNumber = `FAC-${issuedAt.toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;

  return (
    <PosWorkspace
      language={language}
      priceSettings={priceSettings}
      invoiceNumber={invoiceNumber}
      issuedAt={issuedAt.toISOString()}
      articles={articleRecords.map((article) => ({
        ...article,
        salePrice: Number(article.salePrice),
      }))}
      clients={clientRecords}
    />
  );
}
