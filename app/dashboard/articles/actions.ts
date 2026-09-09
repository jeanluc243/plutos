"use server";

import { randomUUID } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { articleCategories, articles, stockMovements } from "@/lib/db/schema";
import {
  calculateSuggestedSalePrice,
  MAX_GAIN_MULTIPLIER,
  MIN_GAIN_MULTIPLIER,
} from "@/lib/article-pricing";
import { createClient } from "@/lib/supabase/server";
import { findCountry } from "../orders/countries";
import type { CreateArticleState } from "./article-state";

function parseImages(formData: FormData) {
  return formData
    .getAll("images")
    .map(String)
    .map((image) => image.trim())
    .filter(Boolean);
}

function isValidStoredImage(value: string) {
  if (
    value.startsWith("data:image/png;base64,iVBORw0KGgo") &&
    value.length <= 1_350_000
  ) {
    return true;
  }

  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && value.length <= 2048;
  } catch {
    return false;
  }
}

function getPostgresErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  if (typeof candidate.code === "string") return candidate.code;
  return typeof candidate.cause?.code === "string" ? candidate.cause.code : undefined;
}

export async function createArticleRecord(
  _previousState: CreateArticleState,
  formData: FormData,
): Promise<CreateArticleState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const requestedSku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const category = String(formData.get("category") ?? "").trim();
  const supplier = String(formData.get("supplier") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = findCountry(String(formData.get("country") ?? ""));
  const purchasePrice = Number(formData.get("purchasePrice"));
  const transportCost = Number(formData.get("transportCost") || 0);
  const paymentCommission = Number(formData.get("paymentCommission") || 0);
  const chinaTransportCost = Number(formData.get("chinaTransportCost") || 0);
  const agencyTransportCost = Number(formData.get("agencyTransportCost") || 0);
  const gainMultiplier = Number(formData.get("gainMultiplier") || MIN_GAIN_MULTIPLIER);
  const stock = Number(formData.get("stock"));
  const salePrice = calculateSuggestedSalePrice({
    purchasePrice,
    transportCost,
    paymentCommission,
    chinaTransportCost,
    agencyTransportCost,
    gainMultiplier,
    stock,
  });
  const information = String(formData.get("information") ?? "").trim();
  const images = parseImages(formData);

  if (
    !name || !category || !supplier || !city || !country ||
    name.length > 180 || category.length > 120 || supplier.length > 160 ||
    requestedSku.length > 64 || city.length > 120 || information.length > 5000 ||
    !Number.isFinite(purchasePrice) || purchasePrice < 0 ||
    !Number.isFinite(transportCost) || transportCost < 0 ||
    !Number.isFinite(paymentCommission) || paymentCommission < 0 ||
    !Number.isFinite(chinaTransportCost) || chinaTransportCost < 0 ||
    !Number.isFinite(agencyTransportCost) || agencyTransportCost < 0 ||
    !Number.isFinite(gainMultiplier) || gainMultiplier < MIN_GAIN_MULTIPLIER || gainMultiplier > MAX_GAIN_MULTIPLIER ||
    !Number.isInteger(stock) || stock < 0
  ) {
    return { status: "error", error: "invalid" };
  }

  if (images.length > 8 || images.some((image) => !isValidStoredImage(image))) {
    return { status: "error", error: "invalidImages" };
  }

  const configuredCategory = await getDatabase()
    .select({ id: articleCategories.id })
    .from(articleCategories)
    .where(and(eq(articleCategories.ownerId, user.id), eq(articleCategories.name, category)))
    .limit(1);

  if (configuredCategory.length === 0) {
    return { status: "error", error: "invalidCategory" };
  }

  try {
    await getDatabase().transaction(async (transaction) => {
      const [created] = await transaction.insert(articles).values({
        ownerId: user.id,
        sku: requestedSku || `ART-${randomUUID().slice(0, 8).toUpperCase()}`,
        name,
        category,
        supplier,
        purchasePrice: purchasePrice.toFixed(2),
        salePrice: salePrice.toFixed(2),
        transportCost: transportCost.toFixed(2),
        paymentCommission: paymentCommission.toFixed(2),
        chinaTransportCost: chinaTransportCost.toFixed(2),
        agencyTransportCost: agencyTransportCost.toFixed(2),
        gainMultiplier: gainMultiplier.toFixed(2),
        city,
        countryCode: country.code,
        countryName: country.en,
        information: information || null,
        images,
        stock,
      }).returning({ id: articles.id });

      if (stock > 0) {
        await transaction.insert(stockMovements).values({
          ownerId: user.id,
          articleId: created.id,
          movementType: "entry",
          quantityChange: stock,
          stockBefore: 0,
          stockAfter: stock,
          reason: "Stock initial",
          createdByEmail: user.email ?? null,
        });
      }
    });
  } catch (error) {
    if (getPostgresErrorCode(error) === "23505") {
      return { status: "error", error: "duplicate" };
    }
    console.error("Article creation failed", error);
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/articles");
  revalidatePath("/dashboard/stock");
  return { status: "success" };
}

export async function updateArticleRecord(
  articleId: string,
  _previousState: CreateArticleState,
  formData: FormData,
): Promise<CreateArticleState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const supplier = String(formData.get("supplier") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const purchasePrice = Number(formData.get("purchasePrice"));
  const transportCost = Number(formData.get("transportCost") || 0);
  const paymentCommission = Number(formData.get("paymentCommission") || 0);
  const chinaTransportCost = Number(formData.get("chinaTransportCost") || 0);
  const agencyTransportCost = Number(formData.get("agencyTransportCost") || 0);
  const gainMultiplier = Number(formData.get("gainMultiplier") || MIN_GAIN_MULTIPLIER);
  const stock = Number(formData.get("stock"));
  const salePrice = calculateSuggestedSalePrice({
    purchasePrice,
    transportCost,
    paymentCommission,
    chinaTransportCost,
    agencyTransportCost,
    gainMultiplier,
    stock,
  });
  const information = String(formData.get("information") ?? "").trim();
  const images = parseImages(formData);

  if (
    !name || !category || !supplier || !city ||
    name.length > 180 || category.length > 120 || supplier.length > 160 ||
    city.length > 120 || information.length > 5000 ||
    !Number.isFinite(purchasePrice) || purchasePrice < 0 ||
    !Number.isFinite(transportCost) || transportCost < 0 ||
    !Number.isFinite(paymentCommission) || paymentCommission < 0 ||
    !Number.isFinite(chinaTransportCost) || chinaTransportCost < 0 ||
    !Number.isFinite(agencyTransportCost) || agencyTransportCost < 0 ||
    !Number.isFinite(gainMultiplier) || gainMultiplier < MIN_GAIN_MULTIPLIER || gainMultiplier > MAX_GAIN_MULTIPLIER ||
    !Number.isInteger(stock) || stock < 0 ||
    images.length > 8 || images.some((image) => !isValidStoredImage(image))
  ) return { status: "error", error: "invalid" };

  await getDatabase().transaction(async (transaction) => {
    const [current] = await transaction
      .select({ stock: articles.stock })
      .from(articles)
      .where(and(eq(articles.id, articleId), eq(articles.ownerId, user.id)))
      .limit(1);
    if (!current) return;

    await transaction.update(articles).set({
      name,
      category,
      supplier,
      city,
      purchasePrice: purchasePrice.toFixed(2),
      salePrice: salePrice.toFixed(2),
      transportCost: transportCost.toFixed(2),
      paymentCommission: paymentCommission.toFixed(2),
      chinaTransportCost: chinaTransportCost.toFixed(2),
      agencyTransportCost: agencyTransportCost.toFixed(2),
      gainMultiplier: gainMultiplier.toFixed(2),
      stock,
      information: information || null,
      images,
      updatedAt: new Date(),
    }).where(and(eq(articles.id, articleId), eq(articles.ownerId, user.id)));

    const change = stock - current.stock;
    if (change !== 0) {
      await transaction.insert(stockMovements).values({
        ownerId: user.id,
        articleId,
        movementType: change > 0 ? "entry" : "exit",
        quantityChange: change,
        stockBefore: current.stock,
        stockAfter: stock,
        reason: "Modification depuis la fiche article",
        createdByEmail: user.email ?? null,
      });
    }
  });

  revalidatePath("/dashboard/articles");
  revalidatePath(`/dashboard/articles/${articleId}`);
  revalidatePath("/dashboard/stock");
  return { status: "success" };
}

export async function reorderArticleImages(articleId: string, images: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || images.length > 8 || images.some((image) => !isValidStoredImage(image))) {
    return { status: "error" as const };
  }
  await getDatabase().update(articles).set({ images, updatedAt: new Date() })
    .where(and(eq(articles.id, articleId), eq(articles.ownerId, user.id)));
  revalidatePath(`/dashboard/articles/${articleId}`);
  revalidatePath("/dashboard/articles");
  return { status: "success" as const };
}

export async function buyArticle(articleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "unauthorized" as const };

  const updated = await getDatabase().transaction(async (transaction) => {
    const records = await transaction
      .update(articles)
      .set({
        stock: sql`${articles.stock} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(articles.id, articleId),
          eq(articles.ownerId, user.id),
          gt(articles.stock, 0),
        ),
      )
      .returning({ ownerId: articles.ownerId, stockAfter: articles.stock });

    const [record] = records;
    if (!record) return records;

    await transaction.insert(stockMovements).values({
      ownerId: record.ownerId,
      articleId,
      movementType: "sale",
      quantityChange: -1,
      stockBefore: record.stockAfter + 1,
      stockAfter: record.stockAfter,
      reason: "Achat depuis le catalogue",
      createdByEmail: user.email ?? null,
    });
    return records;
  });

  if (updated.length === 0) return { status: "unavailable" as const };

  revalidatePath("/dashboard/articles");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/invoices");
  return { status: "success" as const };
}
