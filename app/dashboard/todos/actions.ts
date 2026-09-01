"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { todos } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { CreateTodoState } from "./todo-state";

const priorities = new Set(["low", "medium", "high"]);

async function authenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function createTodoRecord(
  _previousState: CreateTodoState,
  formData: FormData,
): Promise<CreateTodoState> {
  const user = await authenticatedUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const dueAtValue = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueAtValue ? new Date(dueAtValue) : null;

  if (
    !title ||
    title.length > 180 ||
    description.length > 2_000 ||
    !priorities.has(priority) ||
    (dueAt !== null && Number.isNaN(dueAt.getTime()))
  ) {
    return { status: "error", error: "invalid" };
  }

  try {
    await getDatabase().insert(todos).values({
      ownerId: user.id,
      title,
      description: description || null,
      priority,
      dueAt,
    });
  } catch {
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/todos");
  return { status: "success" };
}

export async function setTodoCompleted(id: string, completed: boolean) {
  const user = await authenticatedUser();
  if (!user || !id) return { status: "error" as const };

  const [updated] = await getDatabase()
    .update(todos)
    .set({
      completed,
      completedAt: completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(todos.id, id), eq(todos.ownerId, user.id)))
    .returning({ id: todos.id });

  if (!updated) return { status: "error" as const };

  revalidatePath("/dashboard/todos");
  return { status: "success" as const };
}
