import type { Metadata } from "next";
import { asc, desc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { todos } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../dashboard-shell";
import { isDashboardLanguage, type DashboardLanguage } from "../language";
import { TodosWorkspace, type TodoRecord } from "./todos-workspace";

export const metadata: Metadata = { title: "To-do's" };

export default async function TodosPage() {
  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get("plutos-language")?.value ?? "en";
  const language: DashboardLanguage = isDashboardLanguage(savedLanguage)
    ? savedLanguage
    : "en";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const records = await getDatabase()
    .select()
    .from(todos)
    .where(eq(todos.ownerId, user.id))
    .orderBy(
      asc(todos.completed),
      sql`${todos.dueAt} asc nulls last`,
      desc(todos.createdAt),
    );

  const serializedTodos: TodoRecord[] = records.map((todo) => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    priority: todo.priority as TodoRecord["priority"],
    dueAt: todo.dueAt?.toISOString() ?? null,
    completed: todo.completed,
    createdAt: todo.createdAt.toISOString(),
  }));

  return (
    <DashboardShell
      email={user.email ?? "member@plutos.app"}
      language={language}
      activeSection="todos"
    >
      <TodosWorkspace todos={serializedTodos} language={language} />
    </DashboardShell>
  );
}
