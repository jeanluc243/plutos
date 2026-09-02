import "server-only";

import { eq, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { appUsers } from "@/lib/db/schema";

export type AppRole = "admin" | "user";

type AuthenticatedUser = {
  id: string;
  email?: string | null;
};

function normalizedEmail(user: AuthenticatedUser) {
  return user.email?.trim().toLowerCase() || `${user.id}@users.plutos.local`;
}

export async function ensureApplicationUser(user: AuthenticatedUser) {
  return getDatabase().transaction(async (transaction) => {
    await transaction.execute(sql`select pg_advisory_xact_lock(842011)`);

    const [existing] = await transaction
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, user.id))
      .limit(1);

    if (existing) {
      const email = normalizedEmail(user);
      if (existing.email !== email) {
        await transaction
          .update(appUsers)
          .set({ email, updatedAt: new Date() })
          .where(eq(appUsers.id, user.id));
        return { ...existing, email };
      }
      return existing;
    }

    const [firstUser] = await transaction.select({ id: appUsers.id }).from(appUsers).limit(1);
    const [created] = await transaction
      .insert(appUsers)
      .values({
        id: user.id,
        email: normalizedEmail(user),
        role: firstUser ? "user" : "admin",
      })
      .returning();

    return created;
  });
}

export async function getApplicationRole(userId: string): Promise<AppRole> {
  const [record] = await getDatabase()
    .select({ role: appUsers.role })
    .from(appUsers)
    .where(eq(appUsers.id, userId))
    .limit(1);

  return record?.role === "admin" ? "admin" : "user";
}
