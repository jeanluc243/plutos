"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { LoaderCircle, Plus } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateArticleCost,
  calculateSuggestedSalePrice,
  MAX_GAIN_MULTIPLIER,
  MIN_GAIN_MULTIPLIER,
} from "@/lib/article-pricing";
import type { DashboardLanguage } from "../language";
import { articleOriginCountries, defaultCitiesForArticleOrigin, findCountry } from "../orders/countries";
import { createArticleRecord } from "./actions";
import { createOriginCity } from "./origin-city-actions";
import {
  ArticleImagePicker,
  type PendingArticleImage,
} from "./article-image-picker";
import { ArticleCategorySelect } from "./article-category-select";
import {
  initialCreateArticleState,
  type CreateArticleState,
} from "./article-state";
import { articlesCopy } from "./copy";

export function CreateArticleDialog({
  language,
  categories,
  originCities,
}: {
  language: DashboardLanguage;
  categories: { id: string; name: string }[];
  originCities: { id: string; countryCode: string; name: string }[];
}) {
  const copy = articlesCopy[language];
  const [open, setOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("CN");
  const [city, setCity] = useState("Guangzhou");
  const [addedCities, setAddedCities] = useState<typeof originCities>([]);
  const [newCity, setNewCity] = useState("");
  const [cityError, setCityError] = useState<string | null>(null);
  const [addingCity, startAddingCity] = useTransition();
  const [images, setImages] = useState<PendingArticleImage[]>([]);
  const [costs, setCosts] = useState({
    purchasePrice: "",
    transportCost: "0",
    paymentCommission: "0",
    chinaTransportCost: "0",
    agencyTransportCost: "0",
    gainMultiplier: String(MIN_GAIN_MULTIPLIER),
    stock: "0",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previousState: CreateArticleState, formData: FormData) => {
      const nextState = await createArticleRecord(previousState, formData);
      if (nextState.status === "success") {
        formRef.current?.reset();
        setCountryCode("CN");
        setCity("Guangzhou");
        setImages([]);
        setCosts({
          purchasePrice: "",
          transportCost: "0",
          paymentCommission: "0",
          chinaTransportCost: "0",
          agencyTransportCost: "0",
          gainMultiplier: String(MIN_GAIN_MULTIPLIER),
          stock: "0",
        });
        setOpen(false);
      }
      return nextState;
    },
    initialCreateArticleState,
  );

  const errorMessage = state.error ? copy.errors[state.error] : null;
  const pricingInputs = {
    purchasePrice: Number(costs.purchasePrice) || 0,
    transportCost: Number(costs.transportCost) || 0,
    paymentCommission: Number(costs.paymentCommission) || 0,
    chinaTransportCost: Number(costs.chinaTransportCost) || 0,
    agencyTransportCost: Number(costs.agencyTransportCost) || 0,
    gainMultiplier: Number(costs.gainMultiplier) || MIN_GAIN_MULTIPLIER,
    stock: Number(costs.stock) || 0,
  };
  const totalCost = calculateArticleCost(pricingInputs);
  const suggestedSalePrice = calculateSuggestedSalePrice(pricingInputs);
  const availableCities = useMemo(() => {
    const names = [...defaultCitiesForArticleOrigin(countryCode), ...originCities, ...addedCities]
      .filter((item) => typeof item === "string" || item.countryCode === countryCode)
      .map((item) => typeof item === "string" ? item : item.name);
    return [...new Set(names)];
  }, [addedCities, countryCode, originCities]);

  function updateCost(field: keyof typeof costs, value: string) {
    setCosts((current) => ({ ...current, [field]: value }));
  }

  function changeCountry(value: string | null) {
    if (!value) return;
    setCountryCode(value);
    setCity(defaultCitiesForArticleOrigin(value)[0] ?? "");
    setCityError(null);
  }

  function addCity() {
    startAddingCity(async () => {
      const result = await createOriginCity(countryCode, newCity);
      if (result.status === "success") {
        setAddedCities((current) => [...current, result.city]);
        setCity(result.city.name);
        setNewCity("");
        setCityError(null);
      } else setCityError(copy.cityErrors[result.error]);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        {copy.newArticle}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <form ref={formRef} action={formAction} className="contents">
          <DialogHeader>
            <DialogTitle>{copy.newArticle}</DialogTitle>
            <DialogDescription>{copy.createDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="grid gap-2">
                <Label htmlFor="article-name">{copy.article}</Label>
                <Input
                  id="article-name"
                  name="name"
                  placeholder={copy.namePlaceholder}
                  maxLength={180}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-sku">{copy.sku}</Label>
                <Input
                  id="article-sku"
                  name="sku"
                  placeholder={copy.skuPlaceholder}
                  maxLength={64}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="article-category">{copy.category}</Label>
                <ArticleCategorySelect language={language} categories={categories} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-supplier">{copy.supplier}</Label>
                <Input
                  id="article-supplier"
                  name="supplier"
                  placeholder={copy.supplierPlaceholder}
                  maxLength={160}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="article-purchase-price">{copy.purchasePrice}</Label>
                <Input
                  id="article-purchase-price"
                  name="purchasePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={copy.pricePlaceholder}
                  value={costs.purchasePrice}
                  onChange={(event) => updateCost("purchasePrice", event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-transport-cost">{copy.transportCost}</Label>
                <Input
                  id="article-transport-cost"
                  name="transportCost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={costs.transportCost}
                  onChange={(event) => updateCost("transportCost", event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="article-payment-commission">{copy.paymentCommission}</Label>
                <Input id="article-payment-commission" name="paymentCommission" type="number" min={0} step="0.01" value={costs.paymentCommission} onChange={(event) => updateCost("paymentCommission", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-china-transport">{copy.chinaTransportCost}</Label>
                <Input id="article-china-transport" name="chinaTransportCost" type="number" min={0} step="0.01" value={costs.chinaTransportCost} onChange={(event) => updateCost("chinaTransportCost", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-agency-transport">{copy.agencyTransportCost}</Label>
                <Input id="article-agency-transport" name="agencyTransportCost" type="number" min={0} step="0.01" value={costs.agencyTransportCost} onChange={(event) => updateCost("agencyTransportCost", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-gain-multiplier">{copy.gainMultiplier}</Label>
                <Input id="article-gain-multiplier" name="gainMultiplier" type="number" min={MIN_GAIN_MULTIPLIER} max={MAX_GAIN_MULTIPLIER} step="0.1" value={costs.gainMultiplier} onChange={(event) => updateCost("gainMultiplier", event.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="article-stock">{copy.initialStock}</Label>
                <Input
                  id="article-stock"
                  name="stock"
                  type="number"
                  min={0}
                  step={1}
                  value={costs.stock}
                  onChange={(event) => updateCost("stock", event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-sale-price">{copy.suggestedSalePrice}</Label>
                <Input id="article-sale-price" type="number" value={suggestedSalePrice.toFixed(2)} readOnly aria-describedby="article-price-summary" className="font-semibold text-primary" />
                <p id="article-price-summary" className="text-xs text-muted-foreground">{copy.totalCost}: {totalCost.toFixed(2)} USD · {copy.gainMultiplier}: ×{pricingInputs.gainMultiplier}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="article-country">{copy.country}</Label>
                <Select
                  name="country"
                  value={countryCode}
                  onValueChange={changeCountry}
                  required
                >
                  <SelectTrigger id="article-country" className="w-full">
                    <span className="flex min-w-0 items-center gap-2">
                      <CountryFlag
                        code={countryCode}
                        label={findCountry(countryCode)?.[language]}
                      />
                      <span>{findCountry(countryCode)?.[language]}</span>
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {articleOriginCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <CountryFlag code={country.code} label={country[language]} />
                        {country[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-city">{copy.city}</Label>
                <Select name="city" value={city} onValueChange={(value) => value && setCity(value)} required>
                  <SelectTrigger id="article-city" className="w-full"><SelectValue placeholder={copy.selectCity} /></SelectTrigger>
                  <SelectContent align="start">
                    {availableCities.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input value={newCity} onChange={(event) => setNewCity(event.target.value)} placeholder={copy.newCityPlaceholder} maxLength={120} />
                  <Button type="button" variant="outline" onClick={addCity} disabled={!newCity.trim() || addingCity}>
                    {addingCity ? <LoaderCircle className="animate-spin" /> : <Plus />}{copy.addCity}
                  </Button>
                </div>
                {cityError && <p className="text-xs text-destructive">{cityError}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="article-information">{copy.information}</Label>
              <Textarea
                id="article-information"
                name="information"
                placeholder={copy.informationPlaceholder}
                maxLength={5000}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="article-images">{copy.images}</Label>
              <ArticleImagePicker
                copy={copy.imagePicker}
                images={images}
                onImagesChange={setImages}
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">{errorMessage}</p>
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
              {pending ? copy.creating : copy.createArticle}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
