"use server";

import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { originCities } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { isArticleOriginCountry } from "../orders/countries";

export async function createOriginCity(countryCode: string, rawName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error" as const, error: "unauthorized" as const };

  const name = rawName.trim();
  if (!isArticleOriginCountry(countryCode) || !name || name.length > 120) {
    return { status: "error" as const, error: "invalid" as const };
  }

  try {
    const [city] = await getDatabase().insert(originCities).values({ ownerId: user.id, countryCode, name }).returning();
    revalidatePath("/dashboard/articles");
    return { status: "success" as const, city: { id: city.id, countryCode: city.countryCode, name: city.name } };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { status: "error" as const, error: "duplicate" as const };
    }
    console.error("Origin city creation failed", error);
    return { status: "error" as const, error: "unknown" as const };
  }
}
