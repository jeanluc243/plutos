"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { articleCategories } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { CategoryActionState } from "./category-state";

export async function createCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 120) return { status: "error", error: "invalid" };

  try {
    await getDatabase().insert(articleCategories).values({ ownerId: user.id, name });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { status: "error", error: "duplicate" };
    }
    console.error("Category creation failed", error);
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/articles");
  return { status: "success" };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error" as const };

  await getDatabase()
    .delete(articleCategories)
    .where(and(eq(articleCategories.id, id), eq(articleCategories.ownerId, user.id)));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/articles");
  return { status: "success" as const };
}
