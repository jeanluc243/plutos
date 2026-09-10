"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { LoaderCircle, PackagePlus, Plus, Trash2, Truck } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
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

type SelectedOrderItem = {
  key: string;
  articleId: string;
  quantity: number;
};

function initialItems(articles: OrderArticleOption[]): SelectedOrderItem[] {
  return articles[0]
    ? [{ key: "initial", articleId: articles[0].id, quantity: 1 }]
    : [];
}

const CREATE_CARRIER_VALUE = "__create_carrier__";
const NO_CLIENT_VALUE = "__no_client__";

function defaultTransitDays(transportMode: string) {
  return transportMode === "air" ? 15 : 90;
}

function suggestedArrivalDate(transportMode: string) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + defaultTransitDays(transportMode));
  return date.toISOString().slice(0, 10);
}

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
  clients,
}: {
  language: DashboardLanguage;
  carriers: { id: string; name: string; information: string | null }[];
  articles: OrderArticleOption[];
  clients: { id: string; name: string }[];
}) {
  const copy = ordersCopy[language];
  const [open, setOpen] = useState(false);
  const [originCountryCode, setOriginCountryCode] = useState("CN");
  const [destinationCountryCode, setDestinationCountryCode] = useState("CD");
  const [originCity, setOriginCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedOrderItem[]>(() => initialItems(articles));
  const [clientId, setClientId] = useState("");
  const [carrier, setCarrier] = useState(carriers[0]?.name ?? "");
  const [creatingCarrier, setCreatingCarrier] = useState(false);
  const [newCarrierName, setNewCarrierName] = useState("");
  const [newCarrierInformation, setNewCarrierInformation] = useState("");
  const [transportMode, setTransportMode] = useState("road");
  const [estimatedArrival, setEstimatedArrival] = useState(() => suggestedArrivalDate("road"));
  const [arrivalOverridden, setArrivalOverridden] = useState(false);
  const [launchImmediately, setLaunchImmediately] = useState(false);
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
        setSelectedItems(initialItems(articles));
        setClientId("");
        setCarrier(carriers[0]?.name ?? "");
        setCreatingCarrier(false);
        setNewCarrierName("");
        setNewCarrierInformation("");
        setTransportMode("road");
        setEstimatedArrival(suggestedArrivalDate("road"));
        setArrivalOverridden(false);
        setLaunchImmediately(false);
        setOpen(false);
      }
      return nextState;
    },
    initialCreateOrderState,
  );

  const errorMessage = state.error ? copy.errors[state.error] : null;
  const selectedCarrier = carriers.find((item) => item.name === carrier);

  function addArticle() {
    const nextArticle = articles.find(
      (article) => !selectedItems.some((item) => item.articleId === article.id),
    );
    if (!nextArticle) return;
    setSelectedItems((items) => [
      ...items,
      { key: crypto.randomUUID(), articleId: nextArticle.id, quantity: 1 },
    ]);
  }

  function updateItem(key: string, patch: Partial<Pick<SelectedOrderItem, "articleId" | "quantity">>) {
    setSelectedItems((items) => items.map((item) => item.key === key ? { ...item, ...patch } : item));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        {copy.newOrder}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {articles.length === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>{copy.newOrder}</DialogTitle>
              <DialogDescription>{copy.createArticleFirstHint}</DialogDescription>
            </DialogHeader>
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 p-6 text-center">
              <PackagePlus className="size-9 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                {copy.createArticleFirstHint}
              </p>
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                {copy.cancel}
              </DialogClose>
              <Button
                render={<Link href="/dashboard/articles" />}
                nativeButton={false}
              >
                <PackagePlus data-icon="inline-start" />
                {copy.createArticleFirst}
              </Button>
            </DialogFooter>
          </>
        ) : (
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

            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>{copy.articles}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addArticle}
                    disabled={selectedItems.length >= articles.length}
                  >
                    <Plus data-icon="inline-start" />
                    {copy.addArticle}
                  </Button>
                </div>
                <input
                  type="hidden"
                  name="items"
                  value={JSON.stringify(selectedItems.map(({ articleId, quantity }) => ({ articleId, quantity })))}
                />
                <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
                  {selectedItems.map((item, index) => {
                    const selectedArticle = articles.find((article) => article.id === item.articleId);
                    return (
                      <div
                        key={item.key}
                        className="grid grid-cols-[minmax(0,1fr)_6rem_auto] items-end gap-2"
                      >
                        <div className="grid min-w-0 gap-1.5">
                          <Label htmlFor={`order-article-${item.key}`} className="text-xs">
                            {copy.article} {index + 1}
                          </Label>
                          <Select
                            value={item.articleId}
                            onValueChange={(value) => updateItem(item.key, { articleId: value ?? "" })}
                            required
                          >
                            <SelectTrigger id={`order-article-${item.key}`} className="w-full">
                              {selectedArticle ? (
                                <span className="flex min-w-0 flex-col text-left">
                                  <span className="truncate">{selectedArticle.name}</span>
                                  <span className="truncate font-mono text-xs text-muted-foreground">
                                    {selectedArticle.sku}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">{copy.selectArticle}</span>
                              )}
                            </SelectTrigger>
                            <SelectContent align="start">
                              {articles.map((article) => (
                                <SelectItem
                                  key={article.id}
                                  value={article.id}
                                  disabled={selectedItems.some(
                                    (selected) => selected.key !== item.key && selected.articleId === article.id,
                                  )}
                                >
                                  <span className="flex min-w-0 flex-col">
                                    <span className="truncate">{article.name}</span>
                                    <span className="font-mono text-xs text-muted-foreground">{article.sku}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`order-quantity-${item.key}`} className="text-xs">
                            {copy.itemQuantity}
                          </Label>
                          <Input
                            id={`order-quantity-${item.key}`}
                            type="number"
                            min={1}
                            max={1_000_000}
                            step={1}
                            value={item.quantity}
                            onChange={(event) => updateItem(item.key, { quantity: Number(event.target.value) })}
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedItems((items) => items.filter((selected) => selected.key !== item.key))}
                          disabled={selectedItems.length === 1}
                          aria-label={copy.removeArticle}
                          title={copy.removeArticle}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order-carrier">{copy.carrier}</Label>
                <Select
                  name="carrier"
                  value={creatingCarrier ? CREATE_CARRIER_VALUE : carrier}
                  onValueChange={(value) => {
                    if (value === CREATE_CARRIER_VALUE) {
                      setCreatingCarrier(true);
                      setCarrier("");
                    } else {
                      setCreatingCarrier(false);
                      setCarrier(value ?? "");
                    }
                  }}
                  required
                >
                  <SelectTrigger id="order-carrier" className="w-full">
                    {creatingCarrier ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Truck className="size-4" />
                        {copy.createCarrier}
                      </span>
                    ) : selectedCarrier ? (
                      <span className="min-w-0 truncate">{selectedCarrier.name}</span>
                    ) : (
                      <span className="text-muted-foreground">{copy.selectCarrier}</span>
                    )}
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
                    <SelectItem value={CREATE_CARRIER_VALUE}>
                      <Plus className="size-4" />
                      {copy.createCarrier}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {creatingCarrier && (
                  <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                    <div className="grid gap-2">
                      <Label htmlFor="order-new-carrier-name">{copy.carrierName}</Label>
                      <Input
                        id="order-new-carrier-name"
                        name="newCarrierName"
                        value={newCarrierName}
                        onChange={(event) => setNewCarrierName(event.target.value)}
                        maxLength={120}
                        placeholder={copy.carrierPlaceholder}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="order-new-carrier-information">
                        {copy.carrierInformation}
                      </Label>
                      <Input
                        id="order-new-carrier-information"
                        name="newCarrierInformation"
                        value={newCarrierInformation}
                        onChange={(event) => setNewCarrierInformation(event.target.value)}
                        maxLength={2_000}
                        placeholder={copy.carrierInformationPlaceholder}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order-client">{copy.client}</Label>
              <Select
                name="clientId"
                value={clientId || NO_CLIENT_VALUE}
                onValueChange={(value) => setClientId(value === NO_CLIENT_VALUE ? "" : value ?? "")}
              >
                <SelectTrigger id="order-client" className="w-full">
                  <span className="truncate">
                    {clients.find((client) => client.id === clientId)?.name ?? copy.noClient}
                  </span>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value={NO_CLIENT_VALUE}>{copy.noClient}</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="order-mode">{copy.transportMode}</Label>
                <Select
                  name="transportMode"
                  value={transportMode}
                  onValueChange={(value) => {
                    const nextMode = value ?? "road";
                    setTransportMode(nextMode);
                    if (!arrivalOverridden) {
                      setEstimatedArrival(suggestedArrivalDate(nextMode));
                    }
                  }}
                  required
                >
                  <SelectTrigger id="order-mode" className="w-full">
                    <span>{copy[transportMode as "air" | "sea" | "road" | "rail"]}</span>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="air">{copy.air}</SelectItem>
                    <SelectItem value="sea">{copy.sea}</SelectItem>
                    <SelectItem value="road">{copy.road}</SelectItem>
                    <SelectItem value="rail">{copy.rail}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid min-w-0 gap-2">
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
              <div className="grid min-w-0 gap-2">
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
              <div className="grid min-w-0 gap-2 sm:col-span-2 xl:col-span-2">
                <Label htmlFor="order-transport-cost">{copy.transportCost}</Label>
                <Input
                  id="order-transport-cost"
                  name="transportCost"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </div>
              <div className="grid min-w-0 gap-2 sm:col-span-2 xl:col-span-2">
                <Label htmlFor="order-additional-charges">{copy.additionalCharges}</Label>
                <Input
                  id="order-additional-charges"
                  name="additionalCharges"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </div>
              <div className="grid gap-2 sm:col-span-2 xl:col-span-4">
                <Label htmlFor="order-eta">{copy.eta}</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="order-eta"
                    name="eta"
                    type="date"
                    value={estimatedArrival}
                    onChange={(event) => {
                      setEstimatedArrival(event.target.value);
                      setArrivalOverridden(true);
                    }}
                    className="w-full sm:w-56"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.etaSuggestion.replace("{days}", String(defaultTransitDays(transportMode)))}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-1">
                <Label htmlFor="order-launch-immediately">{copy.launchImmediately}</Label>
                <p className="text-sm text-muted-foreground">{copy.launchImmediatelyHint}</p>
              </div>
              <input type="hidden" name="launchImmediately" value={String(launchImmediately)} />
              <Switch
                id="order-launch-immediately"
                checked={launchImmediately}
                onCheckedChange={setLaunchImmediately}
                aria-label={copy.launchImmediately}
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
              {pending ? copy.creating : launchImmediately ? copy.launchOrder : copy.createOrder}
            </Button>
          </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
