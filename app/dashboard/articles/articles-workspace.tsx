"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Eye, EyeOff, ImageIcon, Package, Search } from "lucide-react";
import Link from "next/link";

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
import type { DashboardLanguage } from "../language";
import { ArticleThumbnail } from "./article-thumbnail";
import { articlesCopy } from "./copy";
import { CreateArticleDialog } from "./create-article-dialog";
import { ArticleDetailSheet } from "./article-detail-sheet";

export type ArticleRecord = {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  purchasePrice: number | null;
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
export type ArticleOrderRecord = {
  id: string;
  articleId: string;
  reference: string;
  carrier: string;
  status: string;
  createdAt: string;
};
export type ArticleStockMovementRecord = {
  id: string;
  articleId: string;
  movementType: string;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  createdByEmail: string | null;
  createdAt: string;
};

type SortKey = "name" | "category" | "purchasePrice" | "salePrice" | "rating" | "stock";

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
    <button
      type="button"
      className={cn(
        "group/sort flex h-7 w-full max-w-full cursor-pointer items-center gap-1 whitespace-nowrap text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        align === "right"
          ? "justify-end text-right"
          : "justify-start text-left",
      )}
      onClick={() => onSort(value)}
    >
      <span>{label}</span>
      <ArrowUpDown className="size-3 shrink-0 opacity-60 transition-opacity group-hover/sort:opacity-100" />
    </button>
  );
}

export function ArticlesWorkspace({
  articles,
  language,
  isAdmin,
  priceSettings,
  categories,
  originCities,
  orderHistory,
  stockHistory,
}: {
  articles: ArticleRecord[];
  language: DashboardLanguage;
  isAdmin: boolean;
  priceSettings: PriceSettings;
  categories: ArticleCategoryRecord[];
  originCities: OriginCityRecord[];
  orderHistory: ArticleOrderRecord[];
  stockHistory: ArticleStockMovementRecord[];
}) {
  const copy = articlesCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [descending, setDescending] = useState(false);
  const [detailArticle, setDetailArticle] = useState<ArticleRecord | null>(null);
  const [purchasePricesVisible, setPurchasePricesVisible] = useState(false);

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
        if (sortKey === "name" || sortKey === "category") {
          return first[sortKey].localeCompare(second[sortKey], locale) * direction;
        }
        return ((Number(first[sortKey]) || 0) - (Number(second[sortKey]) || 0)) * direction;
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

  return (
    <div className="min-h-[calc(100dvh-73px)] bg-muted/20 p-3 sm:p-5">
      <div className="w-full space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin ? copy.description : copy.userDescription}
            </p>
          </div>
          <CreateArticleDialog language={language} categories={categories} originCities={originCities} />
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b px-3 py-3 sm:px-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <CardTitle className="text-sm font-medium">
                {articles.length.toLocaleString(locale)}{" "}
                {(articles.length === 1 ? copy.article : copy.title).toLocaleLowerCase(locale)}
              </CardTitle>
              <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-8 pl-8 text-sm"
                  placeholder={copy.search}
                  aria-label={copy.search}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className={cn("table-fixed", isAdmin ? "min-w-[760px]" : "min-w-[640px]")}>
              <colgroup>
                <col className="w-12" />
                <col className="w-[29%]" />
                <col className="w-[17%]" />
                {isAdmin && <col className="w-32" />}
                <col className="w-28" />
                <col className="w-[60px]" />
                <col className="w-20" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="h-9 w-12 px-0 text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="h-9 w-[29%] px-0">
                    <SortButton label={copy.article} value="name" onSort={changeSort} />
                  </TableHead>
                  <TableHead className="h-9 w-[17%] px-2"><SortButton label={copy.category} value="category" onSort={changeSort} align="right" /></TableHead>
                  {isAdmin && (
                    <TableHead className="h-9 w-32 px-2">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={purchasePricesVisible ? copy.hidePurchasePrices : copy.showPurchasePrices}
                          title={purchasePricesVisible ? copy.hidePurchasePrices : copy.showPurchasePrices}
                          onClick={() => setPurchasePricesVisible((visible) => !visible)}
                        >
                          {purchasePricesVisible ? <EyeOff /> : <Eye />}
                        </Button>
                        <SortButton label={copy.purchasePrice} value="purchasePrice" onSort={changeSort} align="right" />
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="h-9 w-28 px-2"><SortButton label={copy.salePrice} value="salePrice" onSort={changeSort} align="right" /></TableHead>
                  <TableHead className="h-9 w-[60px] px-2"><SortButton label={copy.rating} value="rating" onSort={changeSort} align="right" /></TableHead>
                  <TableHead className="h-9 w-20 px-2"><SortButton label={copy.stock} value="stock" onSort={changeSort} align="right" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-56 text-center">
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
                      className="group/article h-[68px] cursor-pointer"
                      onClick={() => setDetailArticle(article)}
                    >
                      <TableCell className="w-12 px-0 py-2 text-center" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={selected.has(article.id)}
                            onCheckedChange={(checked) => toggleOne(article.id, checked)}
                            aria-label={article.name}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-0 py-2 text-left">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <ArticleThumbnail
                            src={article.images[0]}
                            alt={article.name}
                            className="size-10 shrink-0 rounded-lg"
                            fallback={<Package className="size-4" />}
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/articles/${article.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate text-left text-sm font-semibold underline-offset-4 hover:underline focus-visible:underline"
                              onClick={(event) => event.stopPropagation()}
                            >{article.name}</Link>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                              {copy.sku}: {article.sku}
                            </p>
                            {article.information && (
                              <p className="mt-0.5 hidden max-w-64 truncate text-xs text-muted-foreground xl:block">
                                {article.information}
                              </p>
                            )}
                            {article.images.length > 1 && (
                              <span className="mt-0.5 hidden items-center gap-1 text-xs text-muted-foreground xl:flex">
                                <ImageIcon className="size-3" />
                                {article.images.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        <Badge className="max-w-full truncate px-2 py-0 text-[11px] font-medium" variant="secondary" title={article.category}>
                          {article.category}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="px-2 py-2 text-right">
                          <p className="truncate font-mono text-[13px] font-medium tabular-nums">
                            {purchasePricesVisible && article.purchasePrice !== null
                              ? formatPrice(article.purchasePrice, priceSettings, locale)
                              : "••••••"}
                          </p>
                        </TableCell>
                      )}
                      <TableCell className="px-2 py-2 text-right">
                        <p className="truncate font-mono text-[13px] font-semibold tabular-nums text-foreground">
                          {formatPrice(article.salePrice, priceSettings, locale)}
                        </p>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        <span className="font-mono text-[13px] font-medium tabular-nums">
                          {article.rating.toLocaleString(locale, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        <span
                          className={cn(
                            "whitespace-nowrap font-mono text-[13px] font-medium tabular-nums",
                            article.stock === 0 && "text-destructive",
                            article.stock > 0 && article.stock < 20 && "text-destructive",
                            article.stock >= 20 && article.stock < 50 && "text-status-warning",
                            article.stock >= 50 && "text-primary",
                          )}
                        >
                          {article.stock} {copy.units}
                        </span>
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
          canViewPurchasePrice={isAdmin}
          showPurchasePrice={purchasePricesVisible}
          priceSettings={priceSettings}
          orders={detailArticle ? orderHistory.filter((order) => order.articleId === detailArticle.id) : []}
          movements={detailArticle ? stockHistory.filter((movement) => movement.articleId === detailArticle.id) : []}
          onClose={() => setDetailArticle(null)}
        />
      </div>
    </div>
  );
}
