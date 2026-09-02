"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, Circle, LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DashboardLanguage } from "../language";
import { setTodoCompleted } from "./actions";
import { todosCopy } from "./copy";
import { CreateTodoDialog } from "./create-todo-dialog";

export type TodoRecord = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  dueAt: string | null;
  completed: boolean;
  createdAt: string;
};

type TodoFilter = "all" | "pending" | "completed";

export function TodosWorkspace({
  todos,
  language,
  currentUserId,
}: {
  todos: TodoRecord[];
  language: DashboardLanguage;
  currentUserId: string;
}) {
  const copy = todosCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const completedCount = todos.filter((todo) => todo.completed).length;
  const remainingCount = todos.length - completedCount;
  const visibleTodos = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return todos.filter((todo) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "completed" ? todo.completed : !todo.completed);
      const matchesQuery =
        !normalized ||
        todo.title.toLocaleLowerCase(locale).includes(normalized) ||
        todo.description?.toLocaleLowerCase(locale).includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, locale, query, todos]);

  function toggleTodo(todo: TodoRecord, completed: boolean) {
    setUpdatingId(todo.id);
    startTransition(async () => {
      await setTodoCompleted(todo.id, completed);
      router.refresh();
      setUpdatingId(null);
    });
  }

  return (
    <div className="min-h-[calc(100dvh-73px)] bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
          </div>
          <CreateTodoDialog language={language} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: copy.remaining, value: remainingCount, icon: Circle },
            { label: copy.done, value: completedCount, icon: CheckCircle2 },
            { label: copy.total, value: todos.length, icon: CalendarDays },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} size="sm">
              <CardContent className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="mr-auto text-base">{copy.title}</CardTitle>
              {(["all", "pending", "completed"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={filter === value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(value)}
                >
                  {copy[value]}
                </Button>
              ))}
              <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder={copy.search}
                  aria-label={copy.search}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {visibleTodos.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
                <CheckCircle2 className="size-9" />
                <p className="font-medium text-foreground">{copy.noTasks}</p>
                <p className="max-w-sm text-sm">{copy.noTasksDescription}</p>
              </div>
            ) : (
              <div className="divide-y">
                {visibleTodos.map((todo) => {
                  const dueAt = todo.dueAt ? new Date(todo.dueAt) : null;
                  const loading = isPending && updatingId === todo.id;
                  const canUpdate = todo.ownerId === currentUserId;

                  return (
                    <div key={todo.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                      <div className="pt-0.5">
                        {loading ? (
                          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Checkbox
                            checked={todo.completed}
                            disabled={!canUpdate}
                            onCheckedChange={(checked) => toggleTodo(todo, checked)}
                            aria-label={todo.completed ? copy.markPending : copy.markComplete}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              "font-medium",
                              todo.completed && "text-muted-foreground line-through",
                            )}
                          >
                            {todo.title}
                          </p>
                          <Badge
                            variant={todo.priority === "high" ? "destructive" : "secondary"}
                          >
                            {copy[todo.priority]}
                          </Badge>
                        </div>
                        {todo.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {todo.description}
                          </p>
                        )}
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          {dueAt
                            ? dueAt.toLocaleString(locale, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : copy.noDueDate}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
