"use client";

import { useActionState, useRef, useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardLanguage } from "../language";
import { createTodoRecord } from "./actions";
import { todosCopy } from "./copy";
import {
  TodoPhotoPicker,
  type PendingTodoPhoto,
} from "./todo-photo-picker";
import { initialCreateTodoState, type CreateTodoState } from "./todo-state";
import { isTodoTag, TODO_TAGS, type TodoTag } from "./todo-tags";

export function CreateTodoDialog({ language }: { language: DashboardLanguage }) {
  const copy = todosCopy[language];
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<TodoTag | null>(null);
  const [photo, setPhoto] = useState<PendingTodoPhoto | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    previousState: CreateTodoState,
    formData: FormData,
  ) => {
    const nextState = await createTodoRecord(previousState, formData);
    if (nextState.status === "success") {
      formRef.current?.reset();
      setTag(null);
      setPhoto(null);
      setOpen(false);
    }
    return nextState;
  }, initialCreateTodoState);

  const errorMessage = state.error ? copy.errors[state.error] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        {copy.newTask}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form ref={formRef} action={formAction} className="contents">
          <DialogHeader>
            <DialogTitle>{copy.newTask}</DialogTitle>
            <DialogDescription>{copy.createDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="grid gap-2">
              <Label htmlFor="todo-title">{copy.taskTitle}</Label>
              <Input
                id="todo-title"
                name="title"
                placeholder={copy.titlePlaceholder}
                maxLength={180}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="todo-description">{copy.details}</Label>
              <Textarea
                id="todo-description"
                name="description"
                placeholder={copy.detailsPlaceholder}
                maxLength={2_000}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="todo-tag">{copy.tag}</Label>
                <Select
                  name="tag"
                  value={tag}
                  items={copy.tags}
                  onValueChange={(value) => {
                    if (value && isTodoTag(value)) setTag(value);
                    else setTag(null);
                  }}
                  required
                >
                  <SelectTrigger id="todo-tag" className="w-full">
                    <SelectValue placeholder={copy.selectTag} />
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
                <Label htmlFor="todo-priority">{copy.priority}</Label>
                <Select
                  name="priority"
                  defaultValue="medium"
                  items={{ low: copy.low, medium: copy.medium, high: copy.high }}
                >
                  <SelectTrigger id="todo-priority" className="w-full">
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
              <Label htmlFor="todo-due-at">{copy.dueDate}</Label>
              <Input id="todo-due-at" name="dueAt" type="datetime-local" />
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
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {copy.cancel}
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : (
                <Plus data-icon="inline-start" />
              )}
              {pending ? copy.creatingTask : copy.createTask}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
