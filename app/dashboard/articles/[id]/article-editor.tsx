"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardLanguage } from "../../language";
import { updateArticleRecord, reorderArticleImages } from "../actions";
import { initialCreateArticleState } from "../article-state";

export function ArticleEditor({ article, language }: {
  article: {
    id: string; name: string; category: string; supplier: string; city: string;
    purchasePrice: number; salePrice: number; transportCost: number; stock: number;
    information: string | null; images: string[];
  };
  language: DashboardLanguage;
}) {
  const fr = language === "fr";
  const router = useRouter();
  const [images, setImages] = useState(article.images);
  const [savingImages, startImageTransition] = useTransition();
  const updateAction = updateArticleRecord.bind(null, article.id);
  const [state, formAction, pending] = useActionState(updateAction, initialCreateArticleState);

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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2"><Label htmlFor="edit-purchase">{fr ? "Prix d’achat" : "Purchase price"}</Label><Input id="edit-purchase" name="purchasePrice" type="number" min={0} step="0.01" defaultValue={article.purchasePrice} required /></div>
              <div className="grid gap-2"><Label htmlFor="edit-sale">{fr ? "Prix de vente" : "Sale price"}</Label><Input id="edit-sale" name="salePrice" type="number" min={0} step="0.01" defaultValue={article.salePrice} required /></div>
              <div className="grid gap-2"><Label htmlFor="edit-transport">{fr ? "Transport" : "Transport"}</Label><Input id="edit-transport" name="transportCost" type="number" min={0} step="0.01" defaultValue={article.transportCost} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-stock">Stock</Label><Input id="edit-stock" name="stock" type="number" min={0} step={1} defaultValue={article.stock} required /></div>
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
              <Avatar className="h-16 w-20 rounded-md"><AvatarImage src={image} className="rounded-md object-cover" /><AvatarFallback>{index + 1}</AvatarFallback></Avatar>
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
