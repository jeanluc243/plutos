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
import { initialCreateTodoState, type CreateTodoState } from "./todo-state";

export function CreateTodoDialog({ language }: { language: DashboardLanguage }) {
  const copy = todosCopy[language];
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    previousState: CreateTodoState,
    formData: FormData,
  ) => {
    const nextState = await createTodoRecord(previousState, formData);
    if (nextState.status === "success") {
      formRef.current?.reset();
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
      <DialogContent>
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
                <Label htmlFor="todo-priority">{copy.priority}</Label>
                <Select name="priority" defaultValue="medium">
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

              <div className="grid gap-2">
                <Label htmlFor="todo-due-at">{copy.dueDate}</Label>
                <Input id="todo-due-at" name="dueAt" type="datetime-local" />
              </div>
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
