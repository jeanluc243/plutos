"use client";

import { useActionState, useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, LoaderCircle, MessageCircle, Pencil, Phone, Save, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { dashboardCopy, type DashboardLanguage } from "../language";
import { deleteClientRecord, updateClientRecord } from "./actions";
import { initialCreateClientState, type CreateClientState } from "./client-state";
import type { ClientRecord } from "./clients-table";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ClientDetailSheet({
  client,
  language,
  onClose,
}: {
  client: ClientRecord | null;
  language: DashboardLanguage;
  onClose: () => void;
}) {
  return (
    <Sheet open={client !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {client && (
          <ClientDetail key={client.id} client={client} language={language} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ClientDetail({
  client,
  language,
  onClose,
}: {
  client: ClientRecord;
  language: DashboardLanguage;
  onClose: () => void;
}) {
  const copy = dashboardCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, startDeleteTransition] = useTransition();
  const updateAction = updateClientRecord.bind(null, client.id);
  const [state, formAction, saving] = useActionState(async (previousState: CreateClientState, formData: FormData) => {
    const result = await updateAction(previousState, formData);
    if (result.status === "success") {
      setEditing(false);
      router.refresh();
    }
    return result;
  }, initialCreateClientState);
  const whatsAppNumber = client.phone.replace(/\D/g, "");
  const canWriteOnWhatsApp = Boolean(client.hasWhatsApp && whatsAppNumber);
  const errorMessage = state.error ? copy.createClientErrors[state.error] : null;

  function deleteClient() {
    startDeleteTransition(async () => {
      const result = await deleteClientRecord(client.id);
      if (result.status === "success") {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <>
            <SheetHeader className="border-b pr-12">
              <div className="flex items-start gap-3">
                <Avatar className="size-14 rounded-xl">
                  <AvatarFallback className="rounded-xl">
                    {initials(client.name) || <UserRound />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg">{client.name}</SheetTitle>
                  <SheetDescription className="mt-1 font-mono">
                    #{client.id.slice(0, 8)}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="grid gap-5 px-4 pb-6">
              {editing ? (
                <form action={formAction} className="grid gap-4 rounded-xl border p-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`client-name-${client.id}`}>{copy.fullName}</Label>
                    <Input id={`client-name-${client.id}`} name="name" defaultValue={client.name} maxLength={160} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`client-phone-${client.id}`}>{copy.phone}</Label>
                    <Input id={`client-phone-${client.id}`} name="phone" defaultValue={client.phone} inputMode="tel" maxLength={32} required />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <Label htmlFor={`client-whatsapp-${client.id}`}>{copy.hasWhatsApp}</Label>
                    <Switch id={`client-whatsapp-${client.id}`} name="hasWhatsApp" defaultChecked={client.hasWhatsApp} />
                  </div>
                  {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" disabled={saving} onClick={() => setEditing(false)}>{copy.cancel}</Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
                      {saving ? copy.savingClient : copy.saveClient}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{copy.phone}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono font-medium">{client.phone}</span>
                </CardContent>
              </Card>

              <div className="grid gap-5">
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="grid gap-1.5">
                    <p className="text-xs text-muted-foreground">{copy.whatsapp}</p>
                    <Badge variant="outline">
                      {client.hasWhatsApp ? (
                        <CheckCircle2 className="text-primary" />
                      ) : (
                        <Phone className="text-muted-foreground" />
                      )}
                      {client.hasWhatsApp ? copy.yes : copy.no}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.joined}</p>
                    <p className="mt-1 font-medium">
                      {new Date(client.createdAt).toLocaleString(locale, {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>

            <SheetFooter className="border-t">
              {canWriteOnWhatsApp ? (
                <Button
                  className="w-full"
                  render={
                    <a
                      href={`https://wa.me/${whatsAppNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  nativeButton={false}
                >
                  <MessageCircle data-icon="inline-start" />
                  {copy.writeOnWhatsApp}
                </Button>
              ) : (
                <Button type="button" className="w-full" disabled>
                  <MessageCircle data-icon="inline-start" />
                  {copy.writeOnWhatsApp}
                </Button>
              )}
              {client.canManage && !editing && (
                <div className="grid w-full grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil data-icon="inline-start" />
                    {copy.editClient}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
                      <Trash2 data-icon="inline-start" />
                      {copy.deleteClient}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{copy.deleteClient}</AlertDialogTitle>
                        <AlertDialogDescription>{copy.deleteClientConfirmation}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={deleting} onClick={deleteClient}>
                          {deleting && <LoaderCircle className="animate-spin" />}
                          {deleting ? copy.deletingClient : copy.deleteClient}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </SheetFooter>
    </>
  );
}
