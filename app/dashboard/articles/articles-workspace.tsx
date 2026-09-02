"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowUpDown, ImageIcon, LoaderCircle, Package, Search, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPrice, type PriceSettings } from "@/lib/pricing";
import { calculateArticleCost } from "@/lib/article-pricing";
import type { DashboardLanguage } from "../language";
import { buyArticle } from "./actions";
import { articlesCopy } from "./copy";
import { CreateArticleDialog } from "./create-article-dialog";
import { ArticleDetailSheet } from "./article-detail-sheet";

export type ArticleRecord = {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  purchasePrice: number;
  salePrice: number;
  transportCost: number;
  paymentCommission: number;
  chinaTransportCost: number;
  agencyTransportCost: number;
  gainMultiplier: number;
  city: string;
  countryCode: string;
  countryName: string;
  information: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  createdAt: string;
};

export type ArticleCategoryRecord = { id: string; name: string };
export type OriginCityRecord = { id: string; countryCode: string; name: string };

type SortKey = "name" | "category" | "salePrice" | "rating" | "stock";

function SortButton({
  label,
  value,
  onSort,
  align = "left",
}: {
  label: string;
  value: SortKey;
  onSort: (value: SortKey) => void;
  align?: "left" | "right";
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-auto min-h-8 max-w-full whitespace-normal px-2 py-1.5 text-xs leading-4 font-semibold",
        align === "right"
          ? "ml-auto -mr-2 justify-end text-right"
          : "-ml-2 justify-start text-left",
      )}
      onClick={() => onSort(value)}
    >
      <span>{label}</span>
      <ArrowUpDown className="shrink-0" data-icon="inline-end" />
    </Button>
  );
}

export function ArticlesWorkspace({
  articles,
  language,
  priceSettings,
  categories,
  originCities,
}: {
  articles: ArticleRecord[];
  language: DashboardLanguage;
  priceSettings: PriceSettings;
  categories: ArticleCategoryRecord[];
  originCities: OriginCityRecord[];
}) {
  const copy = articlesCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [descending, setDescending] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [detailArticle, setDetailArticle] = useState<ArticleRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleArticles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return articles
      .filter((article) =>
        !normalized ||
        article.name.toLocaleLowerCase(locale).includes(normalized) ||
        article.sku.toLocaleLowerCase(locale).includes(normalized) ||
        article.category.toLocaleLowerCase(locale).includes(normalized) ||
        article.supplier.toLocaleLowerCase(locale).includes(normalized),
      )
      .toSorted((first, second) => {
        const direction = descending ? -1 : 1;
        if (sortKey === "salePrice" || sortKey === "rating" || sortKey === "stock") {
          return (first[sortKey] - second[sortKey]) * direction;
        }
        return first[sortKey].localeCompare(second[sortKey], locale) * direction;
      });
  }, [articles, descending, locale, query, sortKey]);

  const allSelected =
    visibleArticles.length > 0 &&
    visibleArticles.every((article) => selected.has(article.id));

  function changeSort(nextKey: SortKey) {
    if (sortKey === nextKey) setDescending((value) => !value);
    else {
      setSortKey(nextKey);
      setDescending(false);
    }
  }

  function toggleAll(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      visibleArticles.forEach((article) => {
        if (checked) next.add(article.id);
        else next.delete(article.id);
      });
      return next;
    });
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function purchase(id: string) {
    setBuyingId(id);
    startTransition(async () => {
      await buyArticle(id);
      router.refresh();
      setBuyingId(null);
    });
  }

  return (
    <div className="min-h-[calc(100dvh-73px)] bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
          </div>
          <CreateArticleDialog language={language} categories={categories} originCities={originCities} />
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-base">
                {articles.length.toLocaleString(locale)}{" "}
                {(articles.length === 1 ? copy.article : copy.title).toLocaleLowerCase(locale)}
              </CardTitle>
              <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder={copy.search}
                  aria-label={copy.search}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="min-w-[920px] min-[1800px]:min-w-[1420px]">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12 pl-5">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="min-w-[240px] px-3">
                    <SortButton label={copy.article} value="name" onSort={changeSort} />
                  </TableHead>
                  <TableHead className="min-w-28 px-3"><SortButton label={copy.category} value="category" onSort={changeSort} /></TableHead>
                  <TableHead className="min-w-28 px-3 text-right text-xs min-[1800px]:hidden">{copy.totalCost}</TableHead>
                  <TableHead className="hidden min-w-28 whitespace-normal px-3 text-right text-xs leading-4 min-[1800px]:table-cell">{copy.transportCost}</TableHead>
                  <TableHead className="hidden min-w-32 whitespace-normal px-3 text-right text-xs leading-4 min-[1800px]:table-cell">{copy.paymentCommission}</TableHead>
                  <TableHead className="hidden min-w-28 whitespace-normal px-3 text-right text-xs leading-4 min-[1800px]:table-cell">{copy.chinaTransportCost}</TableHead>
                  <TableHead className="hidden min-w-28 whitespace-normal px-3 text-right text-xs leading-4 min-[1800px]:table-cell">{copy.agencyTransportCost}</TableHead>
                  <TableHead className="hidden min-w-24 whitespace-normal px-3 text-center text-xs leading-4 min-[1800px]:table-cell">{copy.gainMultiplier}</TableHead>
                  <TableHead className="min-w-28 px-3"><SortButton label={copy.salePrice} value="salePrice" onSort={changeSort} align="right" /></TableHead>
                  <TableHead className="hidden px-3 xl:table-cell"><SortButton label={copy.rating} value="rating" onSort={changeSort} /></TableHead>
                  <TableHead className="min-w-24 px-3"><SortButton label={copy.stock} value="stock" onSort={changeSort} align="right" /></TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-56 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="size-9" />
                        <p>{copy.noArticles}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleArticles.map((article) => (
                    <TableRow
                      key={article.id}
                      data-state={selected.has(article.id) ? "selected" : undefined}
                      className="group/article h-24 cursor-pointer"
                      onClick={() => setDetailArticle(article)}
                    >
                      <TableCell className="pl-5" onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(article.id)}
                          onCheckedChange={(checked) => toggleOne(article.id, checked)}
                          aria-label={article.name}
                        />
                      </TableCell>
                      <TableCell className="px-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-14 shrink-0 rounded-xl">
                            {article.images[0] && (
                              <AvatarImage className="rounded-xl" src={article.images[0]} alt={article.name} />
                            )}
                            <AvatarFallback className="rounded-xl"><Package /></AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/articles/${article.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block cursor-pointer truncate font-semibold underline-offset-4 hover:underline focus-visible:underline"
                              onClick={(event) => event.stopPropagation()}
                            >{article.name}</Link>
                            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                              {copy.sku}: {article.sku}
                            </p>
                            {article.information && (
                              <p className="mt-1 max-w-64 truncate text-xs text-muted-foreground">
                                {article.information}
                              </p>
                            )}
                            {article.images.length > 1 && (
                              <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <ImageIcon className="size-3" />
                                {article.images.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3">
                        <Badge className="max-w-full truncate" variant="secondary" title={article.category}>
                          {article.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 text-right min-[1800px]:hidden">
                        <p className="font-semibold tabular-nums">
                          {formatPrice(calculateArticleCost(article), priceSettings, locale)}
                        </p>
                        <p className="text-xs text-muted-foreground">×{article.gainMultiplier.toFixed(2)}</p>
                      </TableCell>
                      <TableCell className="hidden px-3 text-right tabular-nums min-[1800px]:table-cell">{formatPrice(article.transportCost, priceSettings, locale)}</TableCell>
                      <TableCell className="hidden px-3 text-right tabular-nums min-[1800px]:table-cell">{formatPrice(article.paymentCommission, priceSettings, locale)}</TableCell>
                      <TableCell className="hidden px-3 text-right tabular-nums min-[1800px]:table-cell">{formatPrice(article.chinaTransportCost, priceSettings, locale)}</TableCell>
                      <TableCell className="hidden px-3 text-right tabular-nums min-[1800px]:table-cell">{formatPrice(article.agencyTransportCost, priceSettings, locale)}</TableCell>
                      <TableCell className="hidden px-3 text-center font-semibold tabular-nums min-[1800px]:table-cell">×{article.gainMultiplier.toFixed(2)}</TableCell>
                      <TableCell className="px-3 text-right">
                        <p className="font-semibold tabular-nums">
                          {formatPrice(article.salePrice, priceSettings, locale)}
                        </p>
                      </TableCell>
                      <TableCell className="hidden px-3 xl:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <Star className="size-4 fill-current" />
                          <span className="font-medium tabular-nums">
                            {article.reviewCount > 0 ? article.rating.toFixed(1) : "—"}
                          </span>
                          <span className="text-muted-foreground">({article.reviewCount})</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 text-right">
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            article.stock === 0 && "text-destructive",
                            article.stock > 0 && article.stock < 20 && "text-destructive",
                            article.stock >= 20 && article.stock < 50 && "text-status-warning",
                            article.stock >= 50 && "text-primary",
                          )}
                        >
                          {article.stock} {copy.units}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          type="button"
                          className="min-w-24"
                          disabled={article.stock === 0 || (isPending && buyingId === article.id)}
                          onClick={(event) => {
                            event.stopPropagation();
                            purchase(article.id);
                          }}
                        >
                          {isPending && buyingId === article.id && <LoaderCircle className="animate-spin" />}
                          {article.stock === 0
                            ? copy.outOfStock
                            : isPending && buyingId === article.id
                              ? copy.buying
                              : copy.buy}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <ArticleDetailSheet
          article={detailArticle}
          language={language}
          priceSettings={priceSettings}
          onClose={() => setDetailArticle(null)}
        />
      </div>
    </div>
  );
}
