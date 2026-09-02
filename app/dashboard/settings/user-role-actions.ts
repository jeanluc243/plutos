"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDashboardContext } from "../dashboard-context";
import { getDatabase } from "@/lib/db/client";
import { appUsers } from "@/lib/db/schema";

export async function setUserRole(userId: string, role: "admin" | "user") {
  const { user, isAdmin } = await getDashboardContext();

  if (!isAdmin || user.id === userId) {
    return { status: "error" as const, error: "forbidden" as const };
  }

  const updated = await getDatabase()
    .update(appUsers)
    .set({ role, updatedAt: new Date() })
    .where(eq(appUsers.id, userId))
    .returning({ id: appUsers.id });

  if (updated.length === 0) {
    return { status: "error" as const, error: "notFound" as const };
  }

  revalidatePath("/dashboard/settings");
  return { status: "success" as const };
}
