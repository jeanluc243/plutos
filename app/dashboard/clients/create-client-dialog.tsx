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
import { Switch } from "@/components/ui/switch";
import { dashboardCopy, type DashboardLanguage } from "../language";
import { createClientRecord } from "./actions";
import {
  initialCreateClientState,
  type CreateClientState,
} from "./client-state";

export function CreateClientDialog({
  language,
  inline = false,
  onCreated,
}: {
  language: DashboardLanguage;
  inline?: boolean;
  onCreated?: (client: { id: string; name: string; phone: string }) => void;
}) {
  const copy = dashboardCopy[language];
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    previousState: CreateClientState,
    formData: FormData,
  ) => {
    const nextState = await createClientRecord(previousState, formData);
    if (nextState.status === "success") {
      if (nextState.client) onCreated?.(nextState.client);
      formRef.current?.reset();
      setOpen(false);
    }
    return nextState;
  }, initialCreateClientState);

  const errorMessage = state.error ? copy.createClientErrors[state.error] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={inline ? "ghost" : "default"}
            size={inline ? "sm" : "default"}
            className={inline ? "h-auto px-0 py-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground" : undefined}
          />
        }
      >
        <Plus data-icon="inline-start" />
        {copy.newClient}
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="contents">
          <DialogHeader>
            <DialogTitle>{copy.newClient}</DialogTitle>
            <DialogDescription>{copy.createClientDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="grid gap-2">
              <Label htmlFor="client-name">{copy.fullName}</Label>
              <Input
                id="client-name"
                name="name"
                placeholder={copy.fullNamePlaceholder}
                autoComplete="name"
                maxLength={160}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-phone">{copy.phone}</Label>
              <Input
                id="client-phone"
                name="phone"
                placeholder={copy.phonePlaceholder}
                autoComplete="tel"
                inputMode="tel"
                maxLength={32}
                required
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <Label htmlFor="client-whatsapp" className="flex-1">
                {copy.hasWhatsApp}
              </Label>
              <Switch id="client-whatsapp" name="hasWhatsApp" />
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
              {pending ? copy.creatingClient : copy.createClient}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
