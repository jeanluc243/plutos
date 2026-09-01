"use client";

import { useActionState, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardLanguage } from "../language";
import { countries, findCountry } from "../orders/countries";
import { createArticleRecord } from "./actions";
import {
  ArticleImagePicker,
  type PendingArticleImage,
} from "./article-image-picker";
import {
  initialCreateArticleState,
  type CreateArticleState,
} from "./article-state";
import { articlesCopy } from "./copy";

export function CreateArticleDialog({ language }: { language: DashboardLanguage }) {
  const copy = articlesCopy[language];
  const [open, setOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("CD");
  const [images, setImages] = useState<PendingArticleImage[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previousState: CreateArticleState, formData: FormData) => {
      const nextState = await createArticleRecord(previousState, formData);
      if (nextState.status === "success") {
        formRef.current?.reset();
        setCountryCode("CD");
        setImages([]);
        setOpen(false);
      }
      return nextState;
    },
    initialCreateArticleState,
  );

  const errorMessage = state.error ? copy.errors[state.error] : null;

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
                <Input
                  id="article-category"
                  name="category"
                  placeholder={copy.categoryPlaceholder}
                  maxLength={120}
                  required
                />
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="article-purchase-price">{copy.purchasePrice}</Label>
                <Input
                  id="article-purchase-price"
                  name="purchasePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={copy.pricePlaceholder}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-sale-price">{copy.salePrice}</Label>
                <Input
                  id="article-sale-price"
                  name="salePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={copy.pricePlaceholder}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-stock">{copy.initialStock}</Label>
                <Input
                  id="article-stock"
                  name="stock"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={0}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-transport-cost">{copy.transportCost}</Label>
                <Input id="article-transport-cost" name="transportCost" type="number" min={0} step="0.01" defaultValue={0} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="article-country">{copy.country}</Label>
                <Select
                  name="country"
                  value={countryCode}
                  onValueChange={(value) => value && setCountryCode(value)}
                  required
                >
                  <SelectTrigger id="article-country" className="w-full">
                    <span className="flex min-w-0 items-center gap-2">
                      <CountryFlag
                        code={countryCode}
                        label={findCountry(countryCode)?.[language]}
                      />
                      <span className="font-mono">{countryCode}</span>
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
              <div className="grid gap-2">
                <Label htmlFor="article-city">{copy.city}</Label>
                <Input id="article-city" name="city" maxLength={120} required />
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
