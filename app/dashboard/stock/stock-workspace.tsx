"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  LoaderCircle,
  Package,
  PackageCheck,
  Search,
} from "lucide-react";

import { ArticleThumbnail } from "../articles/article-thumbnail";
import type { DashboardLanguage } from "../language";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { adjustStock } from "./actions";
import { stockCopy } from "./copy";
import { StockProductDetailSheet, type StockOrderRecord } from "./stock-product-detail-sheet";
import { initialStockActionState, type StockActionState } from "./stock-state";

export type StockArticle = {
  id: string;
  name: string;
  sku: string;
  category: string;
  images: string[];
  stock: number;
  information: string | null;
};

export type StockMovementRecord = {
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

function stockTone(stock: number) {
  if (stock === 0) return "destructive" as const;
  if (stock < 20) return "outline" as const;
  return "secondary" as const;
}

function AdjustmentDialog({
  article,
  language,
  onClose,
}: {
  article: StockArticle;
  language: DashboardLanguage;
  onClose: () => void;
}) {
  const copy = stockCopy[language];
  const [operation, setOperation] = useState<"entry" | "exit">("entry");
  const [quantity, setQuantity] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    previousState: StockActionState,
    formData: FormData,
  ) => {
    const nextState = await adjustStock(previousState, formData);
    if (nextState.status === "success") onClose();
    return nextState;
  }, initialStockActionState);
  const preview = operation === "entry"
    ? article.stock + Math.max(quantity || 0, 0)
    : article.stock - Math.max(quantity || 0, 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={formAction} className="contents">
          <input type="hidden" name="articleId" value={article.id} />
          <DialogHeader>
            <DialogTitle>{copy.adjustTitle}</DialogTitle>
            <DialogDescription>{copy.adjustDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <ArticleThumbnail
              src={article.images[0]}
              alt={article.name}
              className="size-12"
              fallback={<Package className="size-5" />}
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{article.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{article.sku}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stock-operation">{copy.operation}</Label>
                <Select
                  name="operation"
                  value={operation}
                  items={{ entry: copy.entry, exit: copy.exit }}
                  onValueChange={(value) => {
                    if (value === "entry" || value === "exit") setOperation(value);
                  }}
                >
                  <SelectTrigger id="stock-operation" className="w-full">
                    <SelectValue placeholder={copy.selectOperation} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">{copy.entry}</SelectItem>
                    <SelectItem value="exit">{copy.exit}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock-quantity">{copy.quantityLabel}</Label>
                <Input
                  id="stock-quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={1_000_000}
                  step={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border p-3 text-center">
              <div><p className="text-xs text-muted-foreground">{copy.current}</p><p className="font-mono text-xl font-semibold">{article.stock}</p></div>
              {operation === "entry" ? <ArrowDownToLine className="size-5 text-primary" /> : <ArrowUpFromLine className="size-5 text-destructive" />}
              <div><p className="text-xs text-muted-foreground">{copy.newStock}</p><p className={cn("font-mono text-xl font-semibold", preview < 0 && "text-destructive")}>{preview}</p></div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock-reason">{copy.reasonLabel}</Label>
              <Textarea
                id="stock-reason"
                name="reason"
                rows={3}
                maxLength={240}
                placeholder={copy.reasonPlaceholder}
                required
              />
            </div>

            {state.status === "error" && (
              <p role="alert" className="text-sm text-destructive">{copy.errors[state.error]}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>{copy.cancel}</DialogClose>
            <Button type="submit" disabled={pending || preview < 0}>
              {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Boxes data-icon="inline-start" />}
              {pending ? copy.saving : copy.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StockWorkspace({
  articles,
  movements,
  orders,
  language,
}: {
  articles: StockArticle[];
  movements: StockMovementRecord[];
  orders: StockOrderRecord[];
  language: DashboardLanguage;
}) {
  const copy = stockCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [query, setQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<StockArticle | null>(null);
  const [detailsArticle, setDetailsArticle] = useState<StockArticle | null>(null);
  const articleById = useMemo(
    () => new Map(articles.map((article) => [article.id, article])),
    [articles],
  );
  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return articles;
    return articles.filter((article) =>
      article.name.toLocaleLowerCase(locale).includes(normalized) ||
      article.sku.toLocaleLowerCase(locale).includes(normalized) ||
      article.category.toLocaleLowerCase(locale).includes(normalized),
    );
  }, [articles, locale, query]);
  const displayedMovements = useMemo(
    () => detailsArticle
      ? movements.filter((movement) => movement.articleId === detailsArticle.id)
      : movements,
    [detailsArticle, movements],
  );
  const totalUnits = articles.reduce((total, article) => total + article.stock, 0);
  const lowStock = articles.filter((article) => article.stock > 0 && article.stock < 20).length;
  const outOfStock = articles.filter((article) => article.stock === 0).length;

  function showStockDetails(article: StockArticle) {
    setDetailsArticle(article);
  }

  return (
    <main className="min-h-[calc(100dvh-73px)] bg-muted/20 p-3 sm:p-5">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: copy.totalUnits, value: totalUnits, icon: Boxes },
            { label: copy.products, value: articles.length, icon: PackageCheck },
            { label: copy.lowStock, value: lowStock, icon: AlertTriangle },
            { label: copy.outOfStock, value: outOfStock, icon: Package },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} size="sm">
              <CardContent className="flex items-center justify-between gap-3">
                <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-mono text-2xl font-semibold">{value.toLocaleString(locale)}</p></div>
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted"><Icon className="size-5" /></span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b px-3 py-3 sm:px-4">
            <div className="relative ml-auto w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="pl-8" />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader><TableRow><TableHead>{copy.product}</TableHead><TableHead>{copy.category}</TableHead><TableHead className="text-right">{copy.currentStock}</TableHead><TableHead>{copy.status}</TableHead><TableHead className="text-right">{copy.action}</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredArticles.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">{copy.noProducts}</TableCell></TableRow>
                ) : filteredArticles.map((article) => {
                  const statusLabel = article.stock === 0 ? copy.empty : article.stock < 20 ? copy.low : copy.available;
                  return (
                    <TableRow
                      key={article.id}
                      className="cursor-pointer"
                      onClick={() => showStockDetails(article)}
                    >
                      <TableCell>
                        <button
                          type="button"
                          className="flex min-w-56 items-center gap-3 text-left outline-none underline-offset-4 hover:[&_p:first-of-type]:underline focus-visible:[&_p:first-of-type]:underline"
                          onClick={() => showStockDetails(article)}
                          aria-label={`${copy.openDetails}: ${article.name}`}
                        >
                          <ArticleThumbnail src={article.images[0]} alt={article.name} className="size-11" fallback={<Package className="size-4" />} />
                          <span className="min-w-0">
                            <p className="truncate font-medium">{article.name}</p>
                            <p className="truncate font-mono text-xs text-muted-foreground">{article.sku}</p>
                          </span>
                        </button>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{article.category}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-auto px-2 py-1 font-mono font-semibold tabular-nums underline-offset-4 hover:underline",
                            article.stock === 0 && "text-destructive",
                          )}
                          aria-label={`${copy.openDetails}: ${article.name}`}
                          title={copy.openDetails}
                          onClick={() => showStockDetails(article)}
                        >
                          {article.stock.toLocaleString(locale)} {copy.units}
                        </Button>
                      </TableCell>
                      <TableCell><Badge variant={stockTone(article.stock)}>{statusLabel}</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setSelectedArticle(article); }}><Boxes data-icon="inline-start" />{copy.adjust}</Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <section className="scroll-mt-4">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>
                    {copy.movementHistory}
                    {detailsArticle && ` · ${detailsArticle.name}`}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.movementHistoryDescription}</p>
                </div>
                {detailsArticle && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDetailsArticle(null)}>
                    {copy.showAllMovements}
                  </Button>
                )}
              </div>

              {detailsArticle && (
                <div className="mt-1 grid gap-4 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[auto_1fr]">
                  <div className="flex min-w-0 items-center gap-3">
                    <ArticleThumbnail
                      src={detailsArticle.images[0]}
                      alt={detailsArticle.name}
                      className="size-14"
                      fallback={<Package className="size-5" />}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{detailsArticle.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{detailsArticle.sku}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{detailsArticle.category}</Badge>
                        <Badge variant={stockTone(detailsArticle.stock)}>
                          {detailsArticle.stock.toLocaleString(locale)} {copy.units}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 sm:border-l sm:pl-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.information}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {detailsArticle.information?.trim() || copy.noInformation}
                    </p>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader><TableRow><TableHead>{copy.date}</TableHead><TableHead>{copy.product}</TableHead><TableHead>{copy.movement}</TableHead><TableHead className="text-right">{copy.quantity}</TableHead><TableHead className="text-right">{copy.beforeAfter}</TableHead><TableHead>{copy.reason}</TableHead><TableHead>{copy.createdBy}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {displayedMovements.length === 0 ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">{detailsArticle ? copy.noProductMovements : copy.noMovements}</TableCell></TableRow> : displayedMovements.map((movement) => {
                    const article = articleById.get(movement.articleId);
                    const movementLabel = movement.movementType === "sale" ? copy.sale : movement.movementType === "entry" ? copy.entry : copy.exit;
                    return <TableRow key={movement.id}><TableCell className="whitespace-nowrap text-muted-foreground">{new Date(movement.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}</TableCell><TableCell><p className="font-medium">{article?.name ?? movement.articleId}</p>{article && <p className="font-mono text-xs text-muted-foreground">{article.sku}</p>}</TableCell><TableCell><Badge variant="outline">{movementLabel}</Badge></TableCell><TableCell className={cn("text-right font-mono font-semibold", movement.quantityChange > 0 ? "text-primary" : "text-destructive")}>{movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}</TableCell><TableCell className="text-right font-mono">{movement.stockBefore} → {movement.stockAfter}</TableCell><TableCell className="max-w-72 truncate text-muted-foreground" title={movement.reason ?? undefined}>{movement.reason || "—"}</TableCell><TableCell className="max-w-52 truncate text-muted-foreground">{movement.createdByEmail ?? "—"}</TableCell></TableRow>;
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>

      {selectedArticle && <AdjustmentDialog key={selectedArticle.id} article={selectedArticle} language={language} onClose={() => setSelectedArticle(null)} />}
      <StockProductDetailSheet
        article={detailsArticle}
        movements={movements}
        orders={orders}
        language={language}
        onClose={() => setDetailsArticle(null)}
      />
    </main>
  );
}
