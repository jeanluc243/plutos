import type { Metadata } from "next";
import { asc, desc, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { todos } from "@/lib/db/schema";
import { getDashboardContext } from "../dashboard-context";
import { TodosWorkspace, type TodoRecord } from "./todos-workspace";

export const metadata: Metadata = { title: "To-do's" };

export default async function TodosPage() {
  const { language, user, isAdmin } = await getDashboardContext();

  const records = await getDatabase()
    .select()
    .from(todos)
    .where(isAdmin ? undefined : eq(todos.ownerId, user.id))
    .orderBy(
      asc(todos.completed),
      sql`${todos.dueAt} asc nulls last`,
      desc(todos.createdAt),
    );

  const serializedTodos: TodoRecord[] = records.map((todo) => ({
    id: todo.id,
    ownerId: todo.ownerId,
    title: todo.title,
    description: todo.description,
    priority: todo.priority as TodoRecord["priority"],
    dueAt: todo.dueAt?.toISOString() ?? null,
    completed: todo.completed,
    createdAt: todo.createdAt.toISOString(),
  }));

  return <TodosWorkspace todos={serializedTodos} language={language} currentUserId={user.id} />;
}
