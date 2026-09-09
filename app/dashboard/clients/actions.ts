"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { clients } from "@/lib/db/schema";
import { getApplicationRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { CreateClientState } from "./client-state";

function getPostgresErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;

  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  if (typeof candidate.code === "string") return candidate.code;
  return typeof candidate.cause?.code === "string" ? candidate.cause.code : undefined;
}

export async function createClientRecord(
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", error: "unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const hasWhatsApp = formData.get("hasWhatsApp") === "on";

  if (!name || !phone || name.length > 160 || phone.length > 32) {
    return { status: "error", error: "invalid" };
  }

  try {
    const [createdClient] = await getDatabase()
      .insert(clients)
      .values({
        ownerId: user.id,
        name,
        phone,
        hasWhatsApp,
      })
      .returning({ id: clients.id, name: clients.name, phone: clients.phone });

    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/invoices");
    return { status: "success", client: createdClient };
  } catch (error) {
    if (getPostgresErrorCode(error) === "23505") {
      return { status: "error", error: "duplicate" };
    }

    return { status: "error", error: "unknown" };
  }
}

export async function updateClientRecord(
  clientId: string,
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "unauthorized" };
  const isAdmin = (await getApplicationRole(user.id)) === "admin";

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const hasWhatsApp = formData.get("hasWhatsApp") === "on";

  if (!name || !phone || name.length > 160 || phone.length > 32) {
    return { status: "error", error: "invalid" };
  }

  try {
    const updated = await getDatabase()
      .update(clients)
      .set({ name, phone, hasWhatsApp, updatedAt: new Date() })
      .where(isAdmin ? eq(clients.id, clientId) : and(eq(clients.id, clientId), eq(clients.ownerId, user.id)))
      .returning({ id: clients.id });

    if (updated.length === 0) return { status: "error", error: "unauthorized" };
  } catch (error) {
    if (getPostgresErrorCode(error) === "23505") {
      return { status: "error", error: "duplicate" };
    }
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/clients");
  return { status: "success" };
}

export async function deleteClientRecord(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error" as const, error: "unauthorized" as const };
  const isAdmin = (await getApplicationRole(user.id)) === "admin";

  const deleted = await getDatabase()
    .delete(clients)
    .where(isAdmin ? eq(clients.id, clientId) : and(eq(clients.id, clientId), eq(clients.ownerId, user.id)))
    .returning({ id: clients.id });

  if (deleted.length === 0) return { status: "error" as const, error: "unauthorized" as const };

  revalidatePath("/dashboard/clients");
  return { status: "success" as const };
}
