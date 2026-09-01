"use client";

import { useActionState, useState } from "react";
import { BadgeDollarSign, CheckCircle2, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  formatPrice,
  isDisplayCurrency,
  type DisplayCurrency,
  type PriceSettings,
} from "@/lib/pricing";
import type { DashboardLanguage } from "../language";
import { savePriceSettings } from "./actions";
import { settingsCopy } from "./copy";
import { initialSaveSettingsState } from "./settings-state";

export function PriceSettingsForm({
  language,
  initialSettings,
}: {
  language: DashboardLanguage;
  initialSettings: PriceSettings;
}) {
  const copy = settingsCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [exchangeRate, setExchangeRate] = useState(
    String(initialSettings.exchangeRate),
  );
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(
    initialSettings.displayCurrency,
  );
  const [state, formAction, pending] = useActionState(
    savePriceSettings,
    initialSaveSettingsState,
  );

  const numericRate = Number(exchangeRate);
  const previewSettings: PriceSettings = {
    exchangeRate:
      Number.isFinite(numericRate) && numericRate > 0
        ? numericRate
        : initialSettings.exchangeRate,
    displayCurrency,
  };
  const errorMessage = state.error ? copy.errors[state.error] : null;

  return (
    <form action={formAction}>
      <Card className="max-w-3xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <BadgeDollarSign className="size-5 text-muted-foreground" />
            {copy.pricing}
          </CardTitle>
          <CardDescription>{copy.pricingDescription}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <BadgeDollarSign />
            <AlertTitle>{copy.baseCurrency}: USD</AlertTitle>
            <AlertDescription>{copy.baseCurrencyNotice}</AlertDescription>
          </Alert>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <Label htmlFor="settings-exchange-rate">{copy.exchangeRate}</Label>
              <div className="relative">
                <Input
                  id="settings-exchange-rate"
                  name="exchangeRate"
                  type="number"
                  min="0.0001"
                  max="1000000"
                  step="0.0001"
                  inputMode="decimal"
                  value={exchangeRate}
                  onChange={(event) => setExchangeRate(event.target.value)}
                  className="pr-14 font-mono tabular-nums"
                  required
                />
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  CDF
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {copy.exchangeRateHelp}
              </p>
            </div>

            <div className="grid content-start gap-2">
              <Label htmlFor="settings-display-currency">
                {copy.displayCurrency}
              </Label>
              <Select
                name="displayCurrency"
                value={displayCurrency}
                onValueChange={(value) => {
                  if (value && isDisplayCurrency(value)) setDisplayCurrency(value);
                }}
                required
              >
                <SelectTrigger id="settings-display-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="USD">{copy.usd}</SelectItem>
                  <SelectItem value="CDF">{copy.cdf}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {copy.displayCurrencyHelp}
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.preview}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                  {formatPrice(100, previewSettings, locale)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {displayCurrency === "CDF" ? copy.previewFormula : "100 USD"}
              </p>
            </div>
          </div>

          {state.status === "success" && (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>{copy.saved}</AlertTitle>
            </Alert>
          )}

          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending && (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            )}
            {pending ? copy.saving : copy.save}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
