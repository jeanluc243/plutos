"use client";

import { CalendarDays, ImageIcon, MapPin, Package, Store } from "lucide-react";

import { CountryFlag } from "@/components/country-flag";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice, type PriceSettings } from "@/lib/pricing";
import type { DashboardLanguage } from "../language";
import { countryName } from "../orders/countries";
import type { ArticleOrderRecord, ArticleRecord, ArticleStockMovementRecord } from "./articles-workspace";
import { ArticleThumbnail } from "./article-thumbnail";
import { articlesCopy } from "./copy";

export function ArticleDetailSheet({
  article,
  language,
  canViewPurchasePrice,
  showPurchasePrice,
  priceSettings,
  orders,
  movements,
  onClose,
}: {
  article: ArticleRecord | null;
  language: DashboardLanguage;
  canViewPurchasePrice: boolean;
  showPurchasePrice: boolean;
  priceSettings: PriceSettings;
  orders: ArticleOrderRecord[];
  movements: ArticleStockMovementRecord[];
  onClose: () => void;
}) {
  const copy = articlesCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";

  return (
    <Sheet open={article !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {article && (
          <>
            <SheetHeader className="border-b pr-12">
              <div className="flex items-start gap-3">
                <ArticleThumbnail
                  src={article.images[0]}
                  alt={article.name}
                  className="size-14"
                  fallback={<Package className="size-5" />}
                />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg">{article.name}</SheetTitle>
                  <SheetDescription className="mt-1 font-mono">{article.sku}</SheetDescription>
                  <Badge variant="secondary" className="mt-2">{article.category}</Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="grid gap-5 px-4 pb-6">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium">{copy.images}</h3>
                  <span className="text-xs text-muted-foreground">
                    {article.images.length} / 8
                  </span>
                </div>
                {article.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {article.images.map((image, index) => (
                      <ArticleThumbnail
                        key={`${article.id}-${index}`}
                        src={image}
                        alt={`${article.name} ${index + 1}`}
                        className="h-36 w-full"
                        sizes="(min-width: 640px) 256px, 50vw"
                        fallback={<ImageIcon className="size-6" />}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground">
                    <ImageIcon className="size-7" />
                    <span>{copy.noImages}</span>
                  </div>
                )}
              </div>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>{copy.pricing}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {canViewPurchasePrice && (
                    <div>
                      <p className="text-xs text-muted-foreground">{copy.purchasePrice}</p>
                      <p className="mt-1 font-mono font-medium">
                        {showPurchasePrice && article.purchasePrice !== null
                          ? formatPrice(article.purchasePrice, priceSettings, locale)
                          : "••••••"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.salePrice}</p>
                    <p className="mt-1 font-mono font-semibold text-primary">{formatPrice(article.salePrice, priceSettings, locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.transportCost}</p>
                    <p className="mt-1 font-mono font-medium">{formatPrice(article.transportCost, priceSettings, locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.paymentCommission}</p>
                    <p className="mt-1 font-mono font-medium">{formatPrice(article.paymentCommission, priceSettings, locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.chinaTransportCost}</p>
                    <p className="mt-1 font-mono font-medium">{formatPrice(article.chinaTransportCost, priceSettings, locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.agencyTransportCost}</p>
                    <p className="mt-1 font-mono font-medium">{formatPrice(article.agencyTransportCost, priceSettings, locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.gainMultiplier}</p>
                    <p className="mt-1 font-mono font-medium">×{article.gainMultiplier.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3">
                  <Store className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.supplier}</p>
                    <p className="mt-1 font-medium">{article.supplier}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.location}</p>
                    <p className="mt-1 flex items-center gap-2 font-medium">
                      <CountryFlag
                        code={article.countryCode}
                        label={countryName(article.countryCode, language)}
                      />
                      <span>{article.city}, <span className="font-mono">{article.countryCode}</span></span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.stock}</p>
                    <p className="mt-1 font-medium">{article.stock.toLocaleString(locale)} {copy.units}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{copy.added}</p>
                    <p className="mt-1 font-medium">
                      {new Date(article.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3">
                <div>
                  <h3 className="font-medium">{copy.stockHistory}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.stockHistoryDescription}</p>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader><TableRow><TableHead>{copy.stockMovement}</TableHead><TableHead>{copy.quantity}</TableHead><TableHead>{copy.stock}</TableHead><TableHead>{copy.createdBy}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {movements.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">{copy.noStockMovements}</TableCell></TableRow> : movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell><p>{movement.reason || copy.stockMovement}</p><p className="text-xs text-muted-foreground">{new Date(movement.createdAt).toLocaleDateString(locale)}</p></TableCell>
                          <TableCell className={movement.quantityChange > 0 ? "font-mono text-primary" : "font-mono text-destructive"}>{movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}</TableCell>
                          <TableCell className="font-mono">{movement.stockBefore} → {movement.stockAfter}</TableCell>
                          <TableCell className="max-w-32 truncate text-muted-foreground">{movement.createdByEmail ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              <div id="order-history" className="grid gap-3">
                <div>
                  <h3 className="font-medium">{copy.orderHistory}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.orderHistoryDescription}</p>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader><TableRow><TableHead>{copy.reference}</TableHead><TableHead>{copy.carrier}</TableHead><TableHead>{copy.status}</TableHead><TableHead>{copy.orderDate}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">{copy.noOrders}</TableCell></TableRow>
                      ) : orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.reference}</TableCell>
                          <TableCell>{order.carrier}</TableCell>
                          <TableCell><Badge variant="outline">{order.status.replaceAll("_", " ")}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(order.createdAt).toLocaleDateString(locale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <h3 className="font-medium">{copy.rating}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-semibold">
                    {article.rating.toLocaleString(locale, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </span>
                  <span className="text-muted-foreground">({article.reviewCount} {copy.reviews})</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <h3 className="font-medium">{copy.information}</h3>
                <p className="whitespace-pre-wrap leading-6 text-muted-foreground">
                  {article.information || copy.noInformation}
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
