"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  CalendarDays,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArticleThumbnail } from "../articles/article-thumbnail";
import type { DashboardLanguage } from "../language";
import type { StockArticle, StockMovementRecord } from "./stock-workspace";
import { stockCopy } from "./copy";

export type StockOrderRecord = {
  id: string;
  articleId: string;
  reference: string;
  quantity: number;
  status: string;
  progress: number;
  carrier: string;
  transportMode: string;
  originCity: string;
  originCountryCode: string;
  destinationCity: string;
  destinationCountryCode: string;
  eta: string;
  createdAt: string;
};

const detailCopy = {
  en: {
    description: "Complete stock history, order tracking and product flow distribution.",
    overview: "Overview",
    history: "History",
    report: "Daily report",
    orders: "Orders",
    received: "Units received",
    sold: "Units sold",
    manualExits: "Manual exits",
    ordered: "Units ordered",
    restockDays: "Restocking days",
    purchaseDays: "Customer purchase days",
    lastRestock: "Last restocking",
    lastPurchase: "Last customer purchase",
    never: "No activity",
    dailyActivity: "Daily stock activity",
    dailyActivityDescription: "Entries, customer purchases, manual exits and closing stock grouped by day.",
    day: "Day",
    entries: "Entries",
    customerPurchases: "Customer purchases",
    exits: "Exits",
    closingStock: "Closing stock",
    distribution: "Flow distribution",
    distributionDescription: "Breakdown of every recorded movement for this product.",
    noOrders: "No order is associated with this product.",
    orderTracking: "Order tracking",
    carrier: "Carrier",
    eta: "Estimated arrival",
    route: "Route",
    progress: "Progress",
    inTransit: "In transit",
    delivered: "Delivered",
    delayed: "Delayed",
    onHold: "On hold",
  },
  fr: {
    description: "Historique complet du stock, suivi des commandes et répartition des flux.",
    overview: "Aperçu",
    history: "Historique",
    report: "Rapport journalier",
    orders: "Commandes",
    received: "Unités reçues",
    sold: "Unités vendues",
    manualExits: "Sorties manuelles",
    ordered: "Unités commandées",
    restockDays: "Jours de ravitaillement",
    purchaseDays: "Jours d’achat client",
    lastRestock: "Dernier ravitaillement",
    lastPurchase: "Dernier achat client",
    never: "Aucune activité",
    dailyActivity: "Activité quotidienne du stock",
    dailyActivityDescription: "Entrées, achats clients, sorties manuelles et stock de clôture regroupés par jour.",
    day: "Jour",
    entries: "Entrées",
    customerPurchases: "Achats clients",
    exits: "Sorties",
    closingStock: "Stock de clôture",
    distribution: "Répartition des flux",
    distributionDescription: "Répartition de tous les mouvements enregistrés pour cet article.",
    noOrders: "Aucune commande n’est associée à cet article.",
    orderTracking: "Suivi des commandes",
    carrier: "Transporteur",
    eta: "Arrivée estimée",
    route: "Trajet",
    progress: "Progression",
    inTransit: "En transit",
    delivered: "Livrée",
    delayed: "Retardée",
    onHold: "En attente",
  },
} as const;

function orderStatusLabel(status: string, language: DashboardLanguage) {
  const copy = detailCopy[language];
  if (status === "delivered") return copy.delivered;
  if (status === "delayed") return copy.delayed;
  if (status === "on_hold") return copy.onHold;
  return copy.inTransit;
}

export function StockProductDetailSheet({
  article,
  movements,
  orders,
  language,
  onClose,
}: {
  article: StockArticle | null;
  movements: StockMovementRecord[];
  orders: StockOrderRecord[];
  language: DashboardLanguage;
  onClose: () => void;
}) {
  const copy = stockCopy[language];
  const details = detailCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const articleMovements = article
    ? movements.filter((movement) => movement.articleId === article.id)
    : [];
  const articleOrders = article
    ? orders.filter((order) => order.articleId === article.id)
    : [];
  const received = articleMovements
    .filter((movement) => movement.movementType === "entry")
    .reduce((total, movement) => total + Math.max(0, movement.quantityChange), 0);
  const sold = articleMovements
    .filter((movement) => movement.movementType === "sale")
    .reduce((total, movement) => total + Math.abs(movement.quantityChange), 0);
  const manualExits = articleMovements
    .filter((movement) => movement.movementType === "exit")
    .reduce((total, movement) => total + Math.abs(movement.quantityChange), 0);
  const ordered = articleOrders.reduce((total, order) => total + order.quantity, 0);
  const sortedMovements = [...articleMovements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const dayKey = (value: string) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const restockDays = new Set(
    articleMovements
      .filter((movement) => movement.movementType === "entry")
      .map((movement) => dayKey(movement.createdAt)),
  ).size;
  const purchaseDays = new Set(
    articleMovements
      .filter((movement) => movement.movementType === "sale")
      .map((movement) => dayKey(movement.createdAt)),
  ).size;
  const lastRestock = sortedMovements.find((movement) => movement.movementType === "entry");
  const lastPurchase = sortedMovements.find((movement) => movement.movementType === "sale");
  const dailyActivity = Array.from(
    sortedMovements.reduce((days, movement) => {
      const key = dayKey(movement.createdAt);
      const current = days.get(key) ?? {
        key,
        date: movement.createdAt,
        entries: 0,
        purchases: 0,
        exits: 0,
        closingStock: movement.stockAfter,
      };
      if (movement.movementType === "entry") current.entries += Math.max(0, movement.quantityChange);
      if (movement.movementType === "sale") current.purchases += Math.abs(movement.quantityChange);
      if (movement.movementType === "exit") current.exits += Math.abs(movement.quantityChange);
      days.set(key, current);
      return days;
    }, new Map<string, { key: string; date: string; entries: number; purchases: number; exits: number; closingStock: number }>()),
  ).map(([, day]) => day);
  const totalFlow = Math.max(received + sold + manualExits, 1);
  const flows = [
    { label: details.received, value: received, icon: ArrowDownToLine, tone: "bg-primary" },
    { label: details.sold, value: sold, icon: ShoppingCart, tone: "bg-destructive" },
    { label: details.manualExits, value: manualExits, icon: ArrowUpFromLine, tone: "bg-muted-foreground" },
  ];

  return (
    <Sheet open={article !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{article.category}</Badge>
                    <Badge variant={article.stock === 0 ? "destructive" : "outline"}>
                      {article.stock.toLocaleString(locale)} {copy.units}
                    </Badge>
                  </div>
                </div>
              </div>
              <SheetDescription className="mt-3">{details.description}</SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="overview" className="gap-4 px-4 pb-6">
              <TabsList variant="line" className="w-full justify-start gap-5 border-b pb-1">
                <TabsTrigger value="overview">{details.overview}</TabsTrigger>
                <TabsTrigger value="history">{details.history} ({articleMovements.length})</TabsTrigger>
                <TabsTrigger value="report">{details.report}</TabsTrigger>
                <TabsTrigger value="orders">{details.orders} ({articleOrders.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: copy.currentStock, value: article.stock },
                    { label: details.received, value: received },
                    { label: details.sold, value: sold },
                    { label: details.ordered, value: ordered },
                  ].map((metric) => (
                    <Card key={metric.label} size="sm">
                      <CardContent>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                          {metric.value.toLocaleString(locale)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: details.restockDays, value: restockDays.toLocaleString(locale) },
                    { label: details.purchaseDays, value: purchaseDays.toLocaleString(locale) },
                    {
                      label: details.lastRestock,
                      value: lastRestock
                        ? new Date(lastRestock.createdAt).toLocaleDateString(locale, { dateStyle: "medium" })
                        : details.never,
                    },
                    {
                      label: details.lastPurchase,
                      value: lastPurchase
                        ? new Date(lastPurchase.createdAt).toLocaleDateString(locale, { dateStyle: "medium" })
                        : details.never,
                    },
                  ].map((metric) => (
                    <Card key={metric.label} size="sm">
                      <CardContent>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <p className="mt-1 font-medium tabular-nums">{metric.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card size="sm">
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium">{details.distribution}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{details.distributionDescription}</p>
                    </div>
                    <div className="space-y-4">
                      {flows.map(({ label, value, icon: Icon, tone }) => (
                        <div key={label} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" />{label}</span>
                            <span className="font-mono font-medium tabular-nums">{value.toLocaleString(locale)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", tone)}
                              style={{ width: `${(value / totalFlow) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {article.information && (
                  <Card size="sm">
                    <CardContent>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.information}</p>
                      <p className="mt-2 whitespace-pre-wrap leading-6">{article.information}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history">
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{copy.date}</TableHead>
                        <TableHead>{copy.movement}</TableHead>
                        <TableHead className="text-right">{copy.quantity}</TableHead>
                        <TableHead className="text-right">{copy.beforeAfter}</TableHead>
                        <TableHead>{copy.reason}</TableHead>
                        <TableHead>{copy.createdBy}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articleMovements.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">{copy.noProductMovements}</TableCell></TableRow>
                      ) : articleMovements.map((movement) => {
                        const label = movement.movementType === "sale" ? copy.sale : movement.movementType === "entry" ? copy.entry : copy.exit;
                        return (
                          <TableRow key={movement.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {new Date(movement.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                            </TableCell>
                            <TableCell><Badge variant="outline">{label}</Badge></TableCell>
                            <TableCell className={cn("text-right font-mono font-semibold", movement.quantityChange > 0 ? "text-primary" : "text-destructive")}>
                              {movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}
                            </TableCell>
                            <TableCell className="text-right font-mono">{movement.stockBefore} → {movement.stockAfter}</TableCell>
                            <TableCell className="max-w-52 truncate text-muted-foreground" title={movement.reason ?? undefined}>{movement.reason || "—"}</TableCell>
                            <TableCell className="max-w-52 truncate text-muted-foreground" title={movement.createdByEmail ?? undefined}>{movement.createdByEmail ?? "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="report" className="space-y-3">
                <div>
                  <h3 className="flex items-center gap-2 font-medium">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    {details.dailyActivity}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{details.dailyActivityDescription}</p>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{details.day}</TableHead>
                        <TableHead className="text-right">{details.entries}</TableHead>
                        <TableHead className="text-right">{details.customerPurchases}</TableHead>
                        <TableHead className="text-right">{details.exits}</TableHead>
                        <TableHead className="text-right">{details.closingStock}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyActivity.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                            {copy.noProductMovements}
                          </TableCell>
                        </TableRow>
                      ) : dailyActivity.map((day) => (
                        <TableRow key={day.key}>
                          <TableCell className="whitespace-nowrap font-medium">
                            {new Date(day.date).toLocaleDateString(locale, { dateStyle: "medium" })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-primary">{day.entries > 0 ? `+${day.entries}` : "—"}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">{day.purchases > 0 ? `-${day.purchases}` : "—"}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">{day.exits > 0 ? `-${day.exits}` : "—"}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{day.closingStock.toLocaleString(locale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="space-y-3">
                <div>
                  <h3 className="font-medium">{details.orderTracking}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{details.description}</p>
                </div>
                {articleOrders.length === 0 ? (
                  <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    {details.noOrders}
                  </div>
                ) : articleOrders.map((order) => (
                  <Card key={order.id} size="sm">
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono font-semibold">{order.reference}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString(locale, { dateStyle: "medium" })}</p>
                        </div>
                        <Badge variant={order.status === "delayed" ? "destructive" : "outline"}>{orderStatusLabel(order.status, language)}</Badge>
                      </div>
                      <Progress value={order.progress}>
                        <ProgressLabel>{details.progress}</ProgressLabel>
                        <span className="ml-auto text-sm text-muted-foreground tabular-nums">{order.progress}%</span>
                      </Progress>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div className="flex gap-2"><Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{details.carrier}</p><p>{order.carrier}</p></div></div>
                        <div className="flex gap-2"><ShoppingCart className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{copy.quantity}</p><p className="font-mono">{order.quantity.toLocaleString(locale)}</p></div></div>
                        <div className="flex gap-2"><Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{details.route}</p><p>{order.originCity} <span className="font-mono text-xs text-muted-foreground">{order.originCountryCode}</span> → {order.destinationCity} <span className="font-mono text-xs text-muted-foreground">{order.destinationCountryCode}</span></p></div></div>
                        <div className="flex gap-2"><CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{details.eta}</p><p>{new Date(order.eta).toLocaleDateString(locale, { dateStyle: "medium" })}</p></div></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
