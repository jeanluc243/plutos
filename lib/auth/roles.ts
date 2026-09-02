import "server-only";

import { eq } from "drizzle-orm";

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
  const database = getDatabase();
  const email = normalizedEmail(user);
  const [existing] = await database
    .select()
    .from(appUsers)
    .where(eq(appUsers.id, user.id))
    .limit(1);

  if (existing) {
    if (existing.email !== email) {
      await database
        .update(appUsers)
        .set({ email, updatedAt: new Date() })
        .where(eq(appUsers.id, user.id));
      return { ...existing, email };
    }
    return existing;
  }

  const [firstUser] = await database.select({ id: appUsers.id }).from(appUsers).limit(1);
  await database
    .insert(appUsers)
    .values({ id: user.id, email, role: firstUser ? "user" : "admin" })
    .onConflictDoNothing();

  const [created] = await database
    .select()
    .from(appUsers)
    .where(eq(appUsers.id, user.id))
    .limit(1);

  if (!created) throw new Error("Unable to initialize the application user.");
  return created;
}

export async function getApplicationRole(userId: string): Promise<AppRole> {
  const [record] = await getDatabase()
    .select({ role: appUsers.role })
    .from(appUsers)
    .where(eq(appUsers.id, userId))
    .limit(1);

  return record?.role === "admin" ? "admin" : "user";
}
