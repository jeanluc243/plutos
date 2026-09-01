import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { articles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../dashboard-shell";
import { isDashboardLanguage, type DashboardLanguage } from "../language";
import { ArticlesWorkspace } from "@/app/dashboard/articles/articles-workspace";

export const metadata: Metadata = { title: "Articles" };

export default async function ArticlesPage() {
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

  const [records, priceSettings] = await Promise.all([
    getDatabase()
      .select()
      .from(articles)
      .where(eq(articles.ownerId, user.id))
      .orderBy(desc(articles.createdAt)),
    getUserPriceSettings(user.id),
  ]);

  return (
    <DashboardShell
      email={user.email ?? "member@plutos.app"}
      language={language}
      activeSection="articles"
    >
      <ArticlesWorkspace
        language={language}
        priceSettings={priceSettings}
        articles={records.map((article) => ({
          ...article,
          purchasePrice: Number(article.purchasePrice),
          salePrice: Number(article.salePrice),
          transportCost: Number(article.transportCost),
          rating: Number(article.rating),
          createdAt: article.createdAt.toISOString(),
        }))}
      />
    </DashboardShell>
  );
}
