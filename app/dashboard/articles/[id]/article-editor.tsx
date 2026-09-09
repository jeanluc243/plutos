"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateArticleCost,
  calculateSuggestedSalePrice,
  MAX_GAIN_MULTIPLIER,
  MIN_GAIN_MULTIPLIER,
} from "@/lib/article-pricing";
import type { DashboardLanguage } from "../../language";
import { updateArticleRecord, reorderArticleImages } from "../actions";
import { initialCreateArticleState } from "../article-state";
import { ArticleThumbnail } from "../article-thumbnail";

export function ArticleEditor({ article, language }: {
  article: {
    id: string; name: string; category: string; supplier: string; city: string;
    purchasePrice: number; salePrice: number; transportCost: number; paymentCommission: number;
    chinaTransportCost: number; agencyTransportCost: number; gainMultiplier: number; stock: number;
    information: string | null; images: string[];
  };
  language: DashboardLanguage;
}) {
  const fr = language === "fr";
  const router = useRouter();
  const [images, setImages] = useState(article.images);
  const [costs, setCosts] = useState({
    purchasePrice: String(article.purchasePrice),
    transportCost: String(article.transportCost),
    paymentCommission: String(article.paymentCommission),
    chinaTransportCost: String(article.chinaTransportCost),
    agencyTransportCost: String(article.agencyTransportCost),
    gainMultiplier: String(article.gainMultiplier),
    stock: String(article.stock),
  });
  const [savingImages, startImageTransition] = useTransition();
  const updateAction = updateArticleRecord.bind(null, article.id);
  const [state, formAction, pending] = useActionState(updateAction, initialCreateArticleState);
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

  function updateCost(field: keyof typeof costs, value: string) {
    setCosts((current) => ({ ...current, [field]: value }));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function saveImageOrder() {
    startImageTransition(async () => {
      await reorderArticleImages(article.id, images);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>{fr ? "Modifier l’article" : "Edit product"}</CardTitle>
          <CardDescription>{fr ? "Mettez à jour les informations et les coûts." : "Update product information and costs."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-5">
            {images.map((image) => <input key={image} type="hidden" name="images" value={image} />)}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="edit-name">{fr ? "Nom" : "Name"}</Label><Input id="edit-name" name="name" defaultValue={article.name} required /></div>
              <div className="grid gap-2"><Label htmlFor="edit-category">{fr ? "Catégorie" : "Category"}</Label><Input id="edit-category" name="category" defaultValue={article.category} required /></div>
              <div className="grid gap-2"><Label htmlFor="edit-supplier">{fr ? "Fournisseur" : "Supplier"}</Label><Input id="edit-supplier" name="supplier" defaultValue={article.supplier} required /></div>
              <div className="grid gap-2"><Label htmlFor="edit-city">{fr ? "Ville" : "City"}</Label><Input id="edit-city" name="city" defaultValue={article.city} required /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="edit-purchase">{fr ? "Prix d’achat" : "Purchase price"}</Label><Input id="edit-purchase" name="purchasePrice" type="number" min={0} step="0.01" value={costs.purchasePrice} onChange={(event) => updateCost("purchasePrice", event.target.value)} required /></div>
              <div className="grid gap-2"><Label htmlFor="edit-transport">{fr ? "Coût de transport" : "Transport cost"}</Label><Input id="edit-transport" name="transportCost" type="number" min={0} step="0.01" value={costs.transportCost} onChange={(event) => updateCost("transportCost", event.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2"><Label htmlFor="edit-commission">{fr ? "Commission de paiement" : "Payment commission"}</Label><Input id="edit-commission" name="paymentCommission" type="number" min={0} step="0.01" value={costs.paymentCommission} onChange={(event) => updateCost("paymentCommission", event.target.value)} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-china-transport">{fr ? "Transport achat" : "Purchase transport"}</Label><Input id="edit-china-transport" name="chinaTransportCost" type="number" min={0} step="0.01" value={costs.chinaTransportCost} onChange={(event) => updateCost("chinaTransportCost", event.target.value)} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-agency-transport">{fr ? "Transport agence" : "Agency transport"}</Label><Input id="edit-agency-transport" name="agencyTransportCost" type="number" min={0} step="0.01" value={costs.agencyTransportCost} onChange={(event) => updateCost("agencyTransportCost", event.target.value)} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-multiplier">{fr ? "Indice de gain (×1,5–×10)" : "Gain multiplier (×1.5–×10)"}</Label><Input id="edit-multiplier" name="gainMultiplier" type="number" min={MIN_GAIN_MULTIPLIER} max={MAX_GAIN_MULTIPLIER} step="0.1" value={costs.gainMultiplier} onChange={(event) => updateCost("gainMultiplier", event.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="edit-stock">Stock</Label><Input id="edit-stock" name="stock" type="number" min={0} step={1} value={costs.stock} onChange={(event) => updateCost("stock", event.target.value)} required /></div>
              <div className="grid gap-2"><Label htmlFor="edit-sale">{fr ? "Prix de vente proposé" : "Suggested sale price"}</Label><Input id="edit-sale" type="number" value={suggestedSalePrice.toFixed(2)} readOnly className="font-semibold text-primary" /><p className="text-xs text-muted-foreground">{fr ? "Coût total" : "Total cost"}: {totalCost.toFixed(2)} USD</p></div>
            </div>
            <div className="grid gap-2"><Label htmlFor="edit-information">{fr ? "Informations" : "Information"}</Label><Textarea id="edit-information" name="information" defaultValue={article.information ?? ""} className="min-h-32" /></div>
            {state.status === "success" && <Alert><CheckCircle2 /><AlertTitle>{fr ? "Article enregistré." : "Product saved."}</AlertTitle></Alert>}
            {state.status === "error" && <p className="text-sm text-destructive">{fr ? "Impossible d’enregistrer l’article." : "Unable to save the product."}</p>}
            <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Save />}{fr ? "Enregistrer" : "Save"}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{fr ? "Photos" : "Photos"}</CardTitle><CardDescription>{fr ? "La première photo devient l’image principale." : "The first photo becomes the cover image."}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {images.length === 0 ? <p className="text-sm text-muted-foreground">{fr ? "Aucune photo." : "No photos."}</p> : images.map((image, index) => (
            <div key={image} className="flex items-center gap-3 rounded-lg border p-2">
              <ArticleThumbnail
                src={image}
                alt={`${fr ? "Photo" : "Photo"} ${index + 1}`}
                className="h-16 w-20 rounded-md"
                sizes="80px"
                fallback={<span>{index + 1}</span>}
              />
              <span className="flex-1 text-sm font-medium">{fr ? "Photo" : "Photo"} {index + 1}</span>
              <Button type="button" size="icon-sm" variant="outline" disabled={index === 0} onClick={() => moveImage(index, -1)}><ArrowUp /><span className="sr-only">Up</span></Button>
              <Button type="button" size="icon-sm" variant="outline" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)}><ArrowDown /><span className="sr-only">Down</span></Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" disabled={savingImages || images.length < 2} onClick={saveImageOrder}>
            {savingImages ? <LoaderCircle className="animate-spin" /> : <Save />}{fr ? "Enregistrer l’ordre" : "Save order"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
