"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { CalendarClock, LoaderCircle, PackagePlus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag";
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
import type { DashboardLanguage } from "../language";
import { createOrderRecord } from "./actions";
import { citiesForCountry, countries, findCountry } from "./countries";
import { ordersCopy } from "./copy";
import {
  initialCreateOrderState,
  type CreateOrderState,
} from "./order-state";

export type OrderArticleOption = {
  id: string;
  name: string;
  sku: string;
};

function CityField({
  id,
  name,
  label,
  countryCode,
  value,
  placeholder,
  language,
  onValueChange,
}: {
  id: string;
  name: string;
  label: string;
  countryCode: string;
  value: string;
  placeholder: string;
  language: DashboardLanguage;
  onValueChange: (value: string) => void;
}) {
  const cities = citiesForCountry(countryCode);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {cities ? (
        <Select
          name={name}
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent align="start">
            {cities.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city[language]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          maxLength={120}
        />
      )}
    </div>
  );
}

export function CreateOrderDialog({
  language,
  carriers,
  articles,
}: {
  language: DashboardLanguage;
  carriers: { id: string; name: string; information: string | null }[];
  articles: OrderArticleOption[];
}) {
  const copy = ordersCopy[language];
  const [open, setOpen] = useState(false);
  const [originCountryCode, setOriginCountryCode] = useState("CN");
  const [destinationCountryCode, setDestinationCountryCode] = useState("CD");
  const [originCity, setOriginCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previousState: CreateOrderState, formData: FormData) => {
      const nextState = await createOrderRecord(previousState, formData);
      if (nextState.status === "success") {
        formRef.current?.reset();
        setOriginCountryCode("CN");
        setDestinationCountryCode("CD");
        setOriginCity("");
        setDestinationCity("");
        setOpen(false);
      }
      return nextState;
    },
    initialCreateOrderState,
  );

  const errorMessage = state.error ? copy.errors[state.error] : null;

  if (articles.length === 0) {
    return (
      <Button
        render={<Link href="/dashboard/articles" title={copy.createArticleFirstHint} />}
        nativeButton={false}
      >
        <PackagePlus data-icon="inline-start" />
        {copy.createArticleFirst}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        {copy.newOrder}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <form ref={formRef} action={formAction} className="contents">
          <DialogHeader>
            <DialogTitle>{copy.newOrder}</DialogTitle>
            <DialogDescription>{copy.createDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="order-origin-country">{copy.originCountry}</Label>
                <Select
                  name="originCountry"
                  value={originCountryCode}
                  onValueChange={(value) => {
                    if (!value) return;
                    setOriginCountryCode(value);
                    setOriginCity("");
                  }}
                  required
                >
                  <SelectTrigger id="order-origin-country" className="w-full">
                    <span className="flex min-w-0 items-center gap-2">
                      <CountryFlag
                        code={originCountryCode}
                        label={findCountry(originCountryCode)?.[language]}
                      />
                      <span className="truncate">
                        {originCountryCode}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <CountryFlag code={country.code} label={country[language]} />
                        {country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CityField
                id="order-origin-city"
                name="originCity"
                label={copy.originCity}
                countryCode={originCountryCode}
                value={originCity}
                placeholder={copy.selectCity}
                language={language}
                onValueChange={setOriginCity}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="order-destination-country">
                  {copy.destinationCountry}
                </Label>
                <Select
                  name="destinationCountry"
                  value={destinationCountryCode}
                  onValueChange={(value) => {
                    if (!value) return;
                    setDestinationCountryCode(value);
                    setDestinationCity("");
                  }}
                  required
                >
                  <SelectTrigger id="order-destination-country" className="w-full">
                    <span className="flex min-w-0 items-center gap-2">
                      <CountryFlag
                        code={destinationCountryCode}
                        label={findCountry(destinationCountryCode)?.[language]}
                      />
                      <span className="truncate">
                        {destinationCountryCode}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <CountryFlag code={country.code} label={country[language]} />
                        {country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CityField
                id="order-destination-city"
                name="destinationCity"
                label={copy.destinationCity}
                countryCode={destinationCountryCode}
                value={destinationCity}
                placeholder={copy.selectCity}
                language={language}
                onValueChange={setDestinationCity}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="order-article">{copy.article}</Label>
                <Select
                  name="articleId"
                  defaultValue={articles[0]?.id}
                  required
                >
                  <SelectTrigger id="order-article" className="w-full">
                    <SelectValue placeholder={copy.selectArticle} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {articles.map((article) => (
                      <SelectItem key={article.id} value={article.id}>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{article.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {article.sku}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order-carrier">{copy.carrier}</Label>
                <Select
                  name="carrier"
                  defaultValue={carriers[0]?.name}
                  disabled={carriers.length === 0}
                  required
                >
                  <SelectTrigger id="order-carrier" className="w-full">
                    <SelectValue placeholder={copy.noConfiguredCarriers} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.name}>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{carrier.name}</span>
                          {carrier.information && (
                            <span className="max-w-72 truncate text-xs text-muted-foreground">
                              {carrier.information}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {carriers.length === 0 && (
                  <p className="text-xs text-destructive">{copy.configureCarriersFirst}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="order-mode">{copy.transportMode}</Label>
                <Select name="transportMode" defaultValue="road" required>
                  <SelectTrigger id="order-mode" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="air">{copy.air}</SelectItem>
                    <SelectItem value="sea">{copy.sea}</SelectItem>
                    <SelectItem value="road">{copy.road}</SelectItem>
                    <SelectItem value="rail">{copy.rail}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order-weight">{copy.weight}</Label>
                <Input
                  id="order-weight"
                  name="totalWeightKg"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order-cbm">{copy.cbm}</Label>
                <Input
                  id="order-cbm"
                  name="cbm"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="2.50"
                />
              </div>
              <div className="grid gap-2">
                <Label>{copy.eta}</Label>
                <div className="flex min-h-9 items-center gap-2 rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                  <CalendarClock className="size-4 shrink-0" />
                  <span>{copy.etaAutomatic}</span>
                </div>
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
              {pending ? copy.creating : copy.createOrder}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
