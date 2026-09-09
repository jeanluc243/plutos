"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getApplicationRole } from "@/lib/auth/roles";
import { getDatabase } from "@/lib/db/client";
import { articles, stockMovements } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { StockActionState } from "./stock-state";

export async function adjustStock(
  _previousState: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const articleId = String(formData.get("articleId") ?? "");
  const operation = String(formData.get("operation") ?? "");
  const quantity = Number(formData.get("quantity"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(articleId) ||
    (operation !== "entry" && operation !== "exit") ||
    !Number.isInteger(quantity) || quantity <= 0 || quantity > 1_000_000 ||
    !reason || reason.length > 240
  ) {
    return { status: "error", error: "invalid" };
  }

  try {
    const isAdmin = (await getApplicationRole(user.id)) === "admin";
    const change = operation === "entry" ? quantity : -quantity;
    const database = getDatabase();
    const outcome = await database.transaction(async (transaction) => {
      const permission = isAdmin
        ? eq(articles.id, articleId)
        : and(eq(articles.id, articleId), eq(articles.ownerId, user.id));
      const condition = operation === "exit"
        ? and(permission, gte(articles.stock, quantity))
        : permission;

      const [updated] = await transaction
        .update(articles)
        .set({
          stock: sql`${articles.stock} + ${change}`,
          updatedAt: new Date(),
        })
        .where(condition)
        .returning({ ownerId: articles.ownerId, stockAfter: articles.stock });

      if (!updated) {
        const [existing] = await transaction
          .select({ stock: articles.stock })
          .from(articles)
          .where(permission)
          .limit(1);
        return existing ? "insufficient" as const : "notFound" as const;
      }

      await transaction.insert(stockMovements).values({
        ownerId: updated.ownerId,
        articleId,
        movementType: operation,
        quantityChange: change,
        stockBefore: updated.stockAfter - change,
        stockAfter: updated.stockAfter,
        reason,
        createdByEmail: user.email ?? null,
      });

      return "success" as const;
    });

    if (outcome !== "success") return { status: "error", error: outcome };
  } catch {
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/articles");
  revalidatePath(`/dashboard/articles/${articleId}`);
  revalidatePath("/dashboard/invoices");
  return { status: "success" };
}
