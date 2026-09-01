"use client";

import { CalendarDays, CheckCircle2, MessageCircle, Phone, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { dashboardCopy, type DashboardLanguage } from "../language";
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
  const copy = dashboardCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const whatsAppNumber = client?.phone.replace(/\D/g, "") ?? "";
  const canWriteOnWhatsApp = Boolean(client?.hasWhatsApp && whatsAppNumber);

  return (
    <Sheet open={client !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {client && (
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
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
