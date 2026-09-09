"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  LoaderCircle,
  Search,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DashboardLanguage } from "../language";
import { setTodoCompleted } from "./actions";
import { todosCopy } from "./copy";
import { CreateTodoDialog } from "./create-todo-dialog";
import { TodoDetailSheet } from "./todo-detail-sheet";
import { TODO_TAGS, type TodoTag } from "./todo-tags";

export type TodoRecord = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  tag: TodoTag;
  image: string | null;
  dueAt: string | null;
  completed: boolean;
  createdAt: string;
};

type TodoFilter = "all" | "pending" | "completed";

export function TodosWorkspace({
  todos,
  language,
  currentUserId,
  canManageAll,
}: {
  todos: TodoRecord[];
  language: DashboardLanguage;
  currentUserId: string;
  canManageAll: boolean;
}) {
  const copy = todosCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [tagFilter, setTagFilter] = useState<TodoTag | "all">("all");
  const [selectedTodo, setSelectedTodo] = useState<TodoRecord | null>(null);
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
      const matchesTag = tagFilter === "all" || todo.tag === tagFilter;
      const matchesQuery =
        !normalized ||
        todo.title.toLocaleLowerCase(locale).includes(normalized) ||
        todo.description?.toLocaleLowerCase(locale).includes(normalized) ||
        copy.tags[todo.tag].toLocaleLowerCase(locale).includes(normalized);
      return matchesFilter && matchesTag && matchesQuery;
    });
  }, [copy.tags, filter, locale, query, tagFilter, todos]);

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
              <Select
                value={tagFilter}
                items={{ all: copy.allTags, ...copy.tags }}
                onValueChange={(value) => {
                  if (value === "all" || (value && TODO_TAGS.includes(value as TodoTag))) {
                    setTagFilter(value as TodoTag | "all");
                  }
                }}
              >
                <SelectTrigger className="min-w-36" aria-label={copy.filterByTag}>
                  <Tag className="size-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.allTags}</SelectItem>
                  {TODO_TAGS.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {copy.tags[tag]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  const canUpdate = canManageAll || todo.ownerId === currentUserId;

                  return (
                    <div
                      key={todo.id}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:px-5"
                    >
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
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        aria-label={`${copy.openTask}: ${todo.title}`}
                        onClick={() => setSelectedTodo(todo)}
                      >
                        {todo.image && (
                          <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                            <Image
                              src={todo.image}
                              alt=""
                              fill
                              unoptimized
                              sizes="56px"
                              className="object-cover"
                            />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "font-medium",
                                todo.completed && "text-muted-foreground line-through",
                              )}
                            >
                              {todo.title}
                            </span>
                            <Badge variant="outline">
                              <Tag />
                              {copy.tags[todo.tag]}
                            </Badge>
                            <Badge
                              variant={todo.priority === "high" ? "destructive" : "secondary"}
                            >
                              {copy[todo.priority]}
                            </Badge>
                          </span>
                          {todo.description && (
                            <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">
                              {todo.description}
                            </span>
                          )}
                          <span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" />
                            {dueAt
                              ? dueAt.toLocaleString(locale, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : copy.noDueDate}
                          </span>
                        </span>
                        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <TodoDetailSheet
          todo={selectedTodo}
          language={language}
          currentUserId={currentUserId}
          canManageAll={canManageAll}
          onClose={() => setSelectedTodo(null)}
        />
      </div>
    </div>
  );
}
