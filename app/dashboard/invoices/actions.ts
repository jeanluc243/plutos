"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getApplicationRole } from "@/lib/auth/roles";
import { getDatabase } from "@/lib/db/client";
import { articles, stockMovements } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { CompleteSaleState } from "./sale-state";

type SaleLine = { id: string; quantity: number };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readSaleLines(value: FormDataEntryValue | null): SaleLine[] | null {
  if (typeof value !== "string") return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 100) return null;
    const lines: SaleLine[] = [];
    for (const line of parsed) {
      if (!line || typeof line !== "object") return null;
      const { id, quantity } = line as { id?: unknown; quantity?: unknown };
      if (
        typeof id !== "string" || !uuidPattern.test(id) ||
        typeof quantity !== "number" || !Number.isInteger(quantity) ||
        quantity <= 0 || quantity > 1_000_000
      ) return null;
      lines.push({ id, quantity });
    }
    if (new Set(lines.map((line) => line.id)).size !== lines.length) return null;
    return lines;
  } catch {
    return null;
  }
}

export async function completePosSale(
  _previousState: CompleteSaleState,
  formData: FormData,
): Promise<CompleteSaleState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();
  const lines = readSaleLines(formData.get("lines"));
  if (!lines || !/^FAC-[A-Z0-9-]{8,32}$/i.test(invoiceNumber)) {
    return { status: "error", error: "invalid" };
  }

  try {
    const isAdmin = (await getApplicationRole(user.id)) === "admin";
    await getDatabase().transaction(async (transaction) => {
      for (const line of lines) {
        const permission = isAdmin
          ? eq(articles.id, line.id)
          : and(eq(articles.id, line.id), eq(articles.ownerId, user.id));
        const [updated] = await transaction
          .update(articles)
          .set({ stock: sql`${articles.stock} - ${line.quantity}`, updatedAt: new Date() })
          .where(and(permission, gte(articles.stock, line.quantity)))
          .returning({ ownerId: articles.ownerId, stockAfter: articles.stock });

        if (!updated) throw new Error("INSUFFICIENT_STOCK");

        await transaction.insert(stockMovements).values({
          ownerId: updated.ownerId,
          articleId: line.id,
          movementType: "sale",
          quantityChange: -line.quantity,
          stockBefore: updated.stockAfter + line.quantity,
          stockAfter: updated.stockAfter,
          reason: `Vente POS ${invoiceNumber}`,
          createdByEmail: user.email ?? null,
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return { status: "error", error: "insufficient" };
    }
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/articles");
  return { status: "success" };
}
