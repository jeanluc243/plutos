"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import {
  articles,
  carriers,
  clients,
  orderItems,
  orders,
  stockMovements,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { findCountry } from "./countries";
import type { CreateOrderState } from "./order-state";

const transportModes = ["air", "sea", "road", "rail"] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const createCarrierValue = "__create_carrier__";

type SubmittedOrderItem = { articleId: string; quantity: number };

function parseOrderItems(value: FormDataEntryValue | null): SubmittedOrderItem[] | null {
  try {
    const parsed: unknown = JSON.parse(String(value ?? "[]"));
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 50) return null;

    const items = parsed.map((item) => {
      if (!item || typeof item !== "object") return null;
      const articleId = String((item as { articleId?: unknown }).articleId ?? "").trim();
      const quantity = Number((item as { quantity?: unknown }).quantity);
      if (
        !uuidPattern.test(articleId) ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 1_000_000
      ) return null;
      return { articleId, quantity };
    });

    if (items.some((item) => item === null)) return null;
    const validItems = items as SubmittedOrderItem[];
    if (new Set(validItems.map((item) => item.articleId)).size !== validItems.length) return null;
    return validItems;
  } catch {
    return null;
  }
}

function defaultTransitDays(transportMode: string) {
  return transportMode === "air" ? 15 : 90;
}

function parseArrivalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

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
  const submittedItems = parseOrderItems(formData.get("items"));
  const clientIdInput = String(formData.get("clientId") ?? "").trim();
  const clientId = clientIdInput || null;
  const selectedCarrier = String(formData.get("carrier") ?? "").trim();
  const newCarrierName = String(formData.get("newCarrierName") ?? "").trim();
  const newCarrierInformation = String(formData.get("newCarrierInformation") ?? "").trim();
  const creatingCarrier = selectedCarrier === createCarrierValue;
  const carrier = creatingCarrier ? newCarrierName : selectedCarrier;
  const transportMode = String(formData.get("transportMode") ?? "");
  const etaInput = String(formData.get("eta") ?? "").trim();
  const transportCost = Number(formData.get("transportCost") ?? 0);
  const additionalCharges = Number(formData.get("additionalCharges") ?? 0);
  const launchImmediately = String(formData.get("launchImmediately") ?? "false") === "true";
  const weightInput = String(formData.get("totalWeightKg") ?? "").trim();
  const cbmInput = String(formData.get("cbm") ?? "").trim();
  const totalWeightKg = weightInput ? Number(weightInput) : null;
  const cbm = cbmInput ? Number(cbmInput) : null;
  const selectedEta = etaInput ? parseArrivalDate(etaInput) : null;

  if (
    !originCountry ||
    !destinationCountry ||
    !submittedItems ||
    (clientId !== null && !uuidPattern.test(clientId)) ||
    !carrier ||
    carrier.length > 120 ||
    newCarrierInformation.length > 2_000 ||
    !transportModes.includes(transportMode as (typeof transportModes)[number]) ||
    (etaInput && !selectedEta) ||
    !Number.isFinite(transportCost) || transportCost < 0 || transportCost > 1_000_000_000 ||
    !Number.isFinite(additionalCharges) || additionalCharges < 0 || additionalCharges > 1_000_000_000 ||
    (totalWeightKg !== null && (!Number.isInteger(totalWeightKg) || totalWeightKg <= 0)) ||
    (cbm !== null && (!Number.isFinite(cbm) || cbm <= 0))
  ) {
    return { status: "error", error: "invalid" };
  }

  if (creatingCarrier) {
    await getDatabase()
      .insert(carriers)
      .values({
        ownerId: user.id,
        name: carrier,
        information: newCarrierInformation || null,
      })
      .onConflictDoNothing();
  }

  if (!submittedItems) return { status: "error", error: "articleRequired" };

  const articleIds = submittedItems.map((item) => item.articleId);
  const [[configuredCarrier], configuredArticles, [configuredClient]] = await Promise.all([
    getDatabase()
      .select({ name: carriers.name })
      .from(carriers)
      .where(and(eq(carriers.ownerId, user.id), eq(carriers.name, carrier)))
      .limit(1),
    getDatabase()
      .select({
        id: articles.id,
        name: articles.name,
        sku: articles.sku,
        purchasePrice: articles.purchasePrice,
      })
      .from(articles)
      .where(and(eq(articles.ownerId, user.id), inArray(articles.id, articleIds))),
    clientId
      ? getDatabase()
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.ownerId, user.id), eq(clients.id, clientId)))
        .limit(1)
      : Promise.resolve([undefined]),
  ]);

  if (!configuredCarrier) return { status: "error", error: "invalid" };
  if (configuredArticles.length !== submittedItems.length) {
    return { status: "error", error: "articleRequired" };
  }
  if (clientId && !configuredClient) return { status: "error", error: "invalid" };

  const createdAt = new Date();
  const eta = selectedEta ?? new Date(createdAt);
  if (!selectedEta) eta.setUTCDate(eta.getUTCDate() + defaultTransitDays(transportMode));
  const reference = `CMD-${createdAt.getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const articlesById = new Map(configuredArticles.map((article) => [article.id, article]));
  const resolvedItems = submittedItems.map((item) => ({
    ...item,
    article: articlesById.get(item.articleId)!,
  }));
  const firstItem = resolvedItems[0];
  const totalQuantity = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);
  const cargo = resolvedItems.length === 1
    ? firstItem.article.name
    : `${firstItem.article.name} + ${resolvedItems.length - 1}`;

  try {
    await getDatabase().transaction(async (transaction) => {
      const [createdOrder] = await transaction.insert(orders).values({
        ownerId: user.id,
        reference,
        articleId: firstItem.articleId,
        clientId,
        originCountryCode: originCountry.code,
        originCountryName: originCountry.en,
        originCity: originCity.slice(0, 120),
        destinationCountryCode: destinationCountry.code,
        destinationCountryName: destinationCountry.en,
        destinationCity: destinationCity.slice(0, 120),
        cargo: cargo.slice(0, 180),
        carrier: carrier.slice(0, 120),
        transportMode,
        quantity: totalQuantity,
        purchaseUnitPrice: firstItem.article.purchasePrice,
        transportCost: transportCost.toFixed(2),
        additionalCharges: additionalCharges.toFixed(2),
        createdByEmail: user.email ?? null,
        launchedAt: launchImmediately ? createdAt : null,
        launchedByEmail: launchImmediately ? user.email ?? null : null,
        totalWeightKg,
        cbm: cbm === null ? null : cbm.toFixed(2),
        status: launchImmediately ? "in_transit" : "draft",
        progress: launchImmediately ? 10 : 0,
        eta,
      }).returning({ id: orders.id });

      await transaction.insert(orderItems).values(resolvedItems.map((item) => ({
        orderId: createdOrder.id,
        ownerId: user.id,
        articleId: item.articleId,
        description: item.article.name,
        sku: item.article.sku,
        quantity: item.quantity,
        purchaseUnitPrice: item.article.purchasePrice,
        createdAt,
      })));

      if (launchImmediately) {
        for (const item of resolvedItems) {
          const [stockUpdate] = await transaction
            .update(articles)
            .set({ stock: sql`${articles.stock} + ${item.quantity}`, updatedAt: createdAt })
            .where(and(eq(articles.id, item.articleId), eq(articles.ownerId, user.id)))
            .returning({ ownerId: articles.ownerId, stockAfter: articles.stock });

          if (!stockUpdate) throw new Error("ARTICLE_NOT_FOUND");

          await transaction.insert(stockMovements).values({
            ownerId: stockUpdate.ownerId,
            articleId: item.articleId,
            movementType: "entry",
            quantityChange: item.quantity,
            stockBefore: stockUpdate.stockAfter - item.quantity,
            stockAfter: stockUpdate.stockAfter,
            reason: `Commande ${reference}`,
            createdByEmail: user.email ?? null,
          });
        }
      }
    });
  } catch (error) {
    console.error("Order creation failed", error);
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/articles");
  for (const articleId of articleIds) revalidatePath(`/dashboard/articles/${articleId}`);
  revalidatePath("/dashboard/invoices");
  return { status: "success" };
}

export async function launchOrderRecord(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !uuidPattern.test(orderId)) return { status: "error" as const };

  try {
    await getDatabase().transaction(async (transaction) => {
      const now = new Date();
      const [order] = await transaction
        .update(orders)
        .set({
          status: "in_transit",
          progress: 10,
          launchedAt: now,
          launchedByEmail: user.email ?? null,
          updatedAt: now,
        })
        .where(and(
          eq(orders.id, orderId),
          eq(orders.ownerId, user.id),
          eq(orders.status, "draft"),
        ))
        .returning({
          articleId: orders.articleId,
          cargo: orders.cargo,
          ownerId: orders.ownerId,
          purchaseUnitPrice: orders.purchaseUnitPrice,
          quantity: orders.quantity,
          reference: orders.reference,
        });

      if (!order?.articleId) throw new Error("ORDER_NOT_FOUND");

      const storedItems = await transaction
        .select({ articleId: orderItems.articleId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(and(eq(orderItems.orderId, orderId), eq(orderItems.ownerId, order.ownerId)));
      const items = storedItems.length > 0
        ? storedItems
        : [{ articleId: order.articleId, quantity: order.quantity }];

      for (const item of items) {
        if (!item.articleId) throw new Error("ARTICLE_NOT_FOUND");
        const [stockUpdate] = await transaction
          .update(articles)
          .set({ stock: sql`${articles.stock} + ${item.quantity}`, updatedAt: now })
          .where(and(eq(articles.id, item.articleId), eq(articles.ownerId, order.ownerId)))
          .returning({ stockAfter: articles.stock });

        if (!stockUpdate) throw new Error("ARTICLE_NOT_FOUND");

        await transaction.insert(stockMovements).values({
          ownerId: order.ownerId,
          articleId: item.articleId,
          movementType: "entry",
          quantityChange: item.quantity,
          stockBefore: stockUpdate.stockAfter - item.quantity,
          stockAfter: stockUpdate.stockAfter,
          reason: `Commande ${order.reference}`,
          createdByEmail: user.email ?? null,
        });
      }
    });
  } catch (error) {
    console.error("Order launch failed", error);
    return { status: "error" as const };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/articles");
  revalidatePath("/dashboard/invoices");
  return { status: "success" as const };
}
