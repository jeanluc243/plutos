"use client";

import { useActionState, useRef, useTransition } from "react";
import { LoaderCircle, Plus, Trash2, Truck } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardLanguage } from "../language";
import { createCarrier, deleteCarrier } from "./carrier-actions";
import { initialCarrierActionState, type CarrierActionState } from "./carrier-state";
import { settingsCopy } from "./copy";

export type CarrierRecord = {
  id: string;
  name: string;
  information: string | null;
};

export function CarrierSettings({
  language,
  carriers,
}: {
  language: DashboardLanguage;
  carriers: CarrierRecord[];
}) {
  const copy = settingsCopy[language];
  const formRef = useRef<HTMLFormElement>(null);
  const [deleting, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (previousState: CarrierActionState, formData: FormData) => {
      const nextState = await createCarrier(previousState, formData);
      if (nextState.status === "success") formRef.current?.reset();
      return nextState;
    },
    initialCarrierActionState,
  );

  const errorMessage = state.error ? copy.carrierErrors[state.error] : null;

  return (
    <Card className="max-w-3xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Truck className="size-5 text-muted-foreground" />
          {copy.carriers}
        </CardTitle>
        <CardDescription>{copy.carriersDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form ref={formRef} action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="carrier-name">{copy.carrierName}</Label>
            <Input id="carrier-name" name="name" maxLength={120} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="carrier-information">{copy.carrierInformation}</Label>
            <Textarea
              id="carrier-information"
              name="information"
              maxLength={3000}
              placeholder={copy.carrierInformationPlaceholder}
              className="min-h-28"
            />
          </div>
          {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
              {pending ? copy.addingCarrier : copy.addCarrier}
            </Button>
          </div>
        </form>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{copy.carrierList}</h3>
          {carriers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.noCarriers}</p>
          ) : (
            carriers.map((carrier) => (
              <div key={carrier.id} className="flex items-start gap-3 rounded-lg border p-4">
                <Truck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{carrier.name}</p>
                  {carrier.information && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {carrier.information}
                    </p>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" />}>
                    <Trash2 />
                    <span className="sr-only">{copy.deleteCarrier}</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{copy.deleteCarrier}</AlertDialogTitle>
                      <AlertDialogDescription>{copy.deleteCarrierConfirmation}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={deleting}
                        onClick={() => startTransition(async () => {
                          await deleteCarrier(carrier.id);
                        })}
                      >
                        {copy.delete}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
