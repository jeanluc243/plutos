"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { carriers } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { CarrierActionState } from "./carrier-state";

export async function createCarrier(
  _previousState: CarrierActionState,
  formData: FormData,
): Promise<CarrierActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const information = String(formData.get("information") ?? "").trim();
  if (!name || name.length > 120 || information.length > 3000) {
    return { status: "error", error: "invalid" };
  }

  try {
    await getDatabase().insert(carriers).values({
      ownerId: user.id,
      name,
      information: information || null,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { status: "error", error: "duplicate" };
    }
    console.error("Carrier creation failed", error);
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/orders");
  return { status: "success" };
}

export async function deleteCarrier(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error" as const };

  await getDatabase()
    .delete(carriers)
    .where(and(eq(carriers.id, id), eq(carriers.ownerId, user.id)));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/orders");
  return { status: "success" as const };
}
