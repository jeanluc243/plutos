"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { articles, carriers, orders } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { findCountry } from "./countries";
import type { CreateOrderState } from "./order-state";

const transportModes = ["air", "sea", "road", "rail"] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createOrderRecord(
  _previousState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", error: "unauthorized" };

  const originCountry = findCountry(String(formData.get("originCountry") ?? ""));
  const destinationCountry = findCountry(
    String(formData.get("destinationCountry") ?? ""),
  );
  const originCity = String(formData.get("originCity") ?? "").trim();
  const destinationCity = String(formData.get("destinationCity") ?? "").trim();
  const articleId = String(formData.get("articleId") ?? "").trim();
  const carrier = String(formData.get("carrier") ?? "").trim();
  const transportMode = String(formData.get("transportMode") ?? "");
  const weightInput = String(formData.get("totalWeightKg") ?? "").trim();
  const cbmInput = String(formData.get("cbm") ?? "").trim();
  const totalWeightKg = weightInput ? Number(weightInput) : null;
  const cbm = cbmInput ? Number(cbmInput) : null;

  if (
    !originCountry ||
    !destinationCountry ||
    !uuidPattern.test(articleId) ||
    !carrier ||
    !transportModes.includes(transportMode as (typeof transportModes)[number]) ||
    (totalWeightKg !== null && (!Number.isInteger(totalWeightKg) || totalWeightKg <= 0)) ||
    (cbm !== null && (!Number.isFinite(cbm) || cbm <= 0))
  ) {
    return { status: "error", error: "invalid" };
  }

  const [[configuredCarrier], [configuredArticle]] = await Promise.all([
    getDatabase()
      .select({ name: carriers.name })
      .from(carriers)
      .where(and(eq(carriers.ownerId, user.id), eq(carriers.name, carrier)))
      .limit(1),
    getDatabase()
      .select({ name: articles.name })
      .from(articles)
      .where(and(eq(articles.ownerId, user.id), eq(articles.id, articleId)))
      .limit(1),
  ]);

  if (!configuredCarrier) return { status: "error", error: "invalid" };
  if (!configuredArticle) {
    return { status: "error", error: "articleRequired" };
  }

  const createdAt = new Date();
  const eta = new Date(createdAt);
  eta.setUTCDate(eta.getUTCDate() + 90);
  const reference = `CMD-${createdAt.getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;

  try {
    await getDatabase().insert(orders).values({
      ownerId: user.id,
      reference,
      articleId,
      originCountryCode: originCountry.code,
      originCountryName: originCountry.en,
      originCity: originCity.slice(0, 120),
      destinationCountryCode: destinationCountry.code,
      destinationCountryName: destinationCountry.en,
      destinationCity: destinationCity.slice(0, 120),
      cargo: configuredArticle.name.slice(0, 180),
      carrier: carrier.slice(0, 120),
      transportMode,
      totalWeightKg,
      cbm: cbm === null ? null : cbm.toFixed(2),
      eta,
    });
  } catch (error) {
    console.error("Order creation failed", error);
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/orders");
  return { status: "success" };
}
