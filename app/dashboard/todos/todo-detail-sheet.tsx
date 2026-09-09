"use client";

import { useActionState, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  LoaderCircle,
  Save,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardLanguage } from "../language";
import { updateTodoRecord } from "./actions";
import { todosCopy } from "./copy";
import {
  TodoPhotoPicker,
  type PendingTodoPhoto,
} from "./todo-photo-picker";
import { initialCreateTodoState, type CreateTodoState } from "./todo-state";
import { isTodoTag, TODO_TAGS, type TodoTag } from "./todo-tags";
import type { TodoRecord } from "./todos-workspace";

function datetimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function TodoEditor({
  todo,
  language,
  canEdit,
  onClose,
}: {
  todo: TodoRecord;
  language: DashboardLanguage;
  canEdit: boolean;
  onClose: () => void;
}) {
  const copy = todosCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const router = useRouter();
  const [tag, setTag] = useState<TodoTag>(todo.tag);
  const [completed, setCompleted] = useState(todo.completed);
  const [photo, setPhoto] = useState<PendingTodoPhoto | null>(
    todo.image ? { name: `${todo.title}.webp`, dataUrl: todo.image } : null,
  );
  const [state, formAction, pending] = useActionState(
    async (previousState: CreateTodoState, formData: FormData) => {
      const nextState = await updateTodoRecord(todo.id, previousState, formData);
      if (nextState.status === "success") {
        router.refresh();
        onClose();
      }
      return nextState;
    },
    initialCreateTodoState,
  );

  const errorMessage = state.error ? copy.errors[state.error] : null;

  return (
    <form action={formAction} className="flex min-h-full flex-col">
      <input type="hidden" name="completed" value={String(completed)} />

      <SheetHeader className="border-b pr-12">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {completed ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <Circle className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg">{copy.editTask}</SheetTitle>
            <SheetDescription className="mt-1">
              {copy.editDescription}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="grid flex-1 gap-5 px-4 pb-5">
        <div className="grid gap-2">
          <Label htmlFor={`todo-title-${todo.id}`}>{copy.taskTitle}</Label>
          <Input
            id={`todo-title-${todo.id}`}
            name="title"
            defaultValue={todo.title}
            maxLength={180}
            disabled={!canEdit || pending}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`todo-description-${todo.id}`}>{copy.details}</Label>
          <Textarea
            id={`todo-description-${todo.id}`}
            name="description"
            defaultValue={todo.description ?? ""}
            maxLength={2_000}
            rows={5}
            disabled={!canEdit || pending}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`todo-tag-${todo.id}`}>{copy.tag}</Label>
            <Select
              name="tag"
              value={tag}
              items={copy.tags}
              onValueChange={(value) => {
                if (value && isTodoTag(value)) setTag(value);
              }}
              disabled={!canEdit || pending}
              required
            >
              <SelectTrigger id={`todo-tag-${todo.id}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TODO_TAGS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {copy.tags[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`todo-priority-${todo.id}`}>{copy.priority}</Label>
            <Select
              name="priority"
              defaultValue={todo.priority}
              items={{ low: copy.low, medium: copy.medium, high: copy.high }}
              disabled={!canEdit || pending}
            >
              <SelectTrigger id={`todo-priority-${todo.id}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{copy.low}</SelectItem>
                <SelectItem value="medium">{copy.medium}</SelectItem>
                <SelectItem value="high">{copy.high}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`todo-due-at-${todo.id}`}>{copy.dueDate}</Label>
          <Input
            id={`todo-due-at-${todo.id}`}
            name="dueAt"
            type="datetime-local"
            defaultValue={datetimeLocalValue(todo.dueAt)}
            disabled={!canEdit || pending}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label>{copy.photo}</Label>
            <span className="text-xs text-muted-foreground">{copy.photoOptional}</span>
          </div>
          <TodoPhotoPicker
            copy={copy.photoPicker}
            photo={photo}
            onPhotoChange={setPhoto}
            disabled={!canEdit || pending}
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
          <Checkbox
            id={`todo-completed-${todo.id}`}
            checked={completed}
            onCheckedChange={setCompleted}
            disabled={!canEdit || pending}
          />
          <Label htmlFor={`todo-completed-${todo.id}`} className="flex-1 cursor-pointer">
            <span className="block">{copy.status}</span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              {completed ? copy.taskCompleted : copy.taskPending}
            </span>
          </Label>
          <Badge variant={completed ? "secondary" : "outline"}>
            {completed ? <CheckCircle2 /> : <Circle />}
            {completed ? copy.completed : copy.pending}
          </Badge>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {copy.createdOn}{" "}
          {new Date(todo.createdAt).toLocaleString(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          <span aria-hidden>·</span>
          <Tag className="size-3.5" />
          {copy.tags[tag]}
        </p>

        {!canEdit && (
          <p className="text-sm text-muted-foreground">{copy.readOnlyTask}</p>
        )}

        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
      </div>

      <SheetFooter className="sticky bottom-0 border-t bg-popover">
        <Button type="button" variant="outline" onClick={onClose}>
          {copy.cancel}
        </Button>
        <Button type="submit" disabled={!canEdit || pending}>
          {pending ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          {pending ? copy.savingChanges : copy.saveChanges}
        </Button>
      </SheetFooter>
    </form>
  );
}

export function TodoDetailSheet({
  todo,
  language,
  currentUserId,
  canManageAll,
  onClose,
}: {
  todo: TodoRecord | null;
  language: DashboardLanguage;
  currentUserId: string;
  canManageAll: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={todo !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {todo && (
          <TodoEditor
            key={todo.id}
            todo={todo}
            language={language}
            canEdit={canManageAll || todo.ownerId === currentUserId}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
