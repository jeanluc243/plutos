"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getApplicationRole } from "@/lib/auth/roles";
import { getDatabase } from "@/lib/db/client";
import { todos } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { CreateTodoState } from "./todo-state";
import { isTodoTag } from "./todo-tags";

const priorities = new Set(["low", "medium", "high"]);
const imagePrefixes = [
  "data:image/png;base64,",
  "data:image/jpeg;base64,",
  "data:image/webp;base64,",
];
const maximumStoredImageLength = 1_350_000;

async function authenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function isValidStoredImage(value: string) {
  return (
    !value ||
    (value.length <= maximumStoredImageLength &&
      imagePrefixes.some((prefix) => value.startsWith(prefix)))
  );
}

function readTodoForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const tag = String(formData.get("tag") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const dueAtValue = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueAtValue ? new Date(dueAtValue) : null;

  return { title, description, priority, tag, image, dueAt };
}

function isValidTodoForm(values: ReturnType<typeof readTodoForm>) {
  return (
    values.title.length > 0 &&
    values.title.length <= 180 &&
    values.description.length <= 2_000 &&
    priorities.has(values.priority) &&
    isTodoTag(values.tag) &&
    (values.dueAt === null || !Number.isNaN(values.dueAt.getTime()))
  );
}

export async function createTodoRecord(
  _previousState: CreateTodoState,
  formData: FormData,
): Promise<CreateTodoState> {
  const user = await authenticatedUser();
  if (!user) return { status: "error", error: "unauthorized" };

  const values = readTodoForm(formData);

  if (!isValidTodoForm(values)) {
    return { status: "error", error: "invalid" };
  }
  if (!isValidStoredImage(values.image)) {
    return { status: "error", error: "invalidPhoto" };
  }

  try {
    await getDatabase().insert(todos).values({
      ownerId: user.id,
      title: values.title,
      description: values.description || null,
      priority: values.priority,
      tag: values.tag,
      image: values.image || null,
      dueAt: values.dueAt,
    });
  } catch {
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/todos");
  return { status: "success" };
}

export async function updateTodoRecord(
  id: string,
  _previousState: CreateTodoState,
  formData: FormData,
): Promise<CreateTodoState> {
  const user = await authenticatedUser();
  if (!user) return { status: "error", error: "unauthorized" };
  if (!id) return { status: "error", error: "invalid" };
  const isAdmin = (await getApplicationRole(user.id)) === "admin";

  const values = readTodoForm(formData);
  const completed = String(formData.get("completed") ?? "false") === "true";

  if (!isValidTodoForm(values)) {
    return { status: "error", error: "invalid" };
  }
  if (!isValidStoredImage(values.image)) {
    return { status: "error", error: "invalidPhoto" };
  }

  try {
    const [updated] = await getDatabase()
      .update(todos)
      .set({
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        tag: values.tag,
        image: values.image || null,
        dueAt: values.dueAt,
        completed,
        completedAt: completed ? sql`coalesce(${todos.completedAt}, now())` : null,
        updatedAt: new Date(),
      })
      .where(
        isAdmin
          ? eq(todos.id, id)
          : and(eq(todos.id, id), eq(todos.ownerId, user.id)),
      )
      .returning({ id: todos.id });

    if (!updated) return { status: "error", error: "forbidden" };
  } catch {
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard/todos");
  return { status: "success" };
}

export async function setTodoCompleted(id: string, completed: boolean) {
  const user = await authenticatedUser();
  if (!user || !id) return { status: "error" as const };
  const isAdmin = (await getApplicationRole(user.id)) === "admin";

  const [updated] = await getDatabase()
    .update(todos)
    .set({
      completed,
      completedAt: completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      isAdmin
        ? eq(todos.id, id)
        : and(eq(todos.id, id), eq(todos.ownerId, user.id)),
    )
    .returning({ id: todos.id });

  if (!updated) return { status: "error" as const };

  revalidatePath("/dashboard/todos");
  return { status: "success" as const };
}
