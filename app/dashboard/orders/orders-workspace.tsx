"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Package,
  Plane,
  Search,
  Ship,
  TrainFront,
  Truck,
} from "lucide-react";

import { CountryFlag } from "@/components/country-flag";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { DashboardLanguage } from "../language";
import { countryName } from "./countries";
import { ordersCopy } from "./copy";
import {
  CreateOrderDialog,
  type OrderArticleOption,
} from "./create-order-dialog";

type OrderStatus = "in_transit" | "delivered" | "delayed" | "on_hold";
type OrderFilter = "all" | OrderStatus;

export type OrderRecord = {
  id: string;
  reference: string;
  articleId: string | null;
  originCountryCode: string;
  originCountryName: string;
  originCity: string;
  destinationCountryCode: string;
  destinationCountryName: string;
  destinationCity: string;
  cargo: string;
  carrier: string;
  transportMode: string;
  totalWeightKg: number | null;
  cbm: number | null;
  status: string;
  progress: number;
  eta: string;
  createdAt: string;
};

function isOrderStatus(value: string): value is OrderStatus {
  return ["in_transit", "delivered", "delayed", "on_hold"].includes(value);
}

function TransportIcon({ mode }: { mode: string }) {
  if (mode === "air") return <Plane />;
  if (mode === "sea") return <Ship />;
  if (mode === "rail") return <TrainFront />;
  return <Truck />;
}

export function OrdersWorkspace({
  language,
  orders,
  carriers,
  articles,
}: {
  language: DashboardLanguage;
  orders: OrderRecord[];
  carriers: { id: string; name: string; information: string | null }[];
  articles: OrderArticleOption[];
}) {
  const copy = ordersCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? "");

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return orders.filter((order) => {
      const status = isOrderStatus(order.status) ? order.status : "in_transit";
      const matchesFilter = filter === "all" || status === filter;
      const matchesSearch =
        !normalized ||
        order.reference.toLocaleLowerCase(locale).includes(normalized) ||
        order.cargo.toLocaleLowerCase(locale).includes(normalized) ||
        order.originCity.toLocaleLowerCase(locale).includes(normalized) ||
        order.destinationCity.toLocaleLowerCase(locale).includes(normalized);
      return matchesFilter && matchesSearch;
    });
  }, [filter, locale, orders, query]);

  const selectedOrder =
    orders.find((order) => order.id === selectedId) ?? filteredOrders[0] ?? null;

  function statusLabel(status: string) {
    if (status === "delivered") return copy.delivered;
    if (status === "delayed") return copy.delayed;
    if (status === "on_hold") return copy.onHold;
    return copy.inTransit;
  }

  function statusIcon(status: string) {
    if (status === "delivered") return <CheckCircle2 data-icon="inline-start" />;
    if (status === "delayed") return <CircleAlert data-icon="inline-start" />;
    return <Clock3 data-icon="inline-start" />;
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  const counts = {
    all: orders.length,
    in_transit: orders.filter((order) => order.status === "in_transit").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    delayed: orders.filter((order) => order.status === "delayed").length,
  };

  return (
    <div className="min-h-[calc(100dvh-73px)] bg-muted/20">
      <div className="flex flex-wrap items-center gap-4 border-b bg-background px-4 py-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <CreateOrderDialog
          language={language}
          carriers={carriers}
          articles={articles}
        />
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => {
          if (value && ["all", "in_transit", "delivered", "delayed", "on_hold"].includes(value)) {
            setFilter(value as OrderFilter);
          }
        }}
        className="gap-0"
      >
        <div className="border-b bg-background px-4 sm:px-6">
          <TabsList variant="line" className="h-12 gap-5">
            <TabsTrigger value="all">{copy.all} ({counts.all})</TabsTrigger>
            <TabsTrigger value="in_transit">{copy.inTransit} ({counts.in_transit})</TabsTrigger>
            <TabsTrigger value="delivered">{copy.delivered} ({counts.delivered})</TabsTrigger>
            <TabsTrigger value="delayed">{copy.delayed} ({counts.delayed})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={filter} className="m-0 p-4 sm:p-6">
          <div className="grid min-h-[680px] gap-4 min-[1100px]:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.search}
                  aria-label={copy.search}
                  className="bg-background pl-9"
                />
              </div>

              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {filteredOrders.length === 0 ? (
                  <Card>
                    <CardContent className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                      <Package className="size-8" />
                      <p className="text-sm">{copy.noOrders}</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredOrders.map((order) => {
                    const active = selectedOrder?.id === order.id;
                    return (
                      <Button
                        key={order.id}
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedId(order.id)}
                        className={cn(
                          "h-auto w-full flex-col items-stretch gap-4 rounded-xl bg-card px-0 py-4 text-left whitespace-normal hover:bg-muted/40 dark:bg-card dark:hover:bg-muted/30",
                          active && "border-primary",
                        )}
                        aria-pressed={active}
                      >
                        <div className="flex w-full flex-col gap-4">
                          <CardHeader className="px-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <CardTitle className="font-mono text-sm">{order.reference}</CardTitle>
                                <CardDescription className="mt-1">{order.cargo}</CardDescription>
                              </div>
                              <Badge
                                variant={order.status === "delayed" ? "destructive" : "secondary"}
                              >
                                {statusIcon(order.status)}
                                {statusLabel(order.status)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 px-4">
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 font-medium">
                                  <CountryFlag
                                    code={order.originCountryCode}
                                    label={countryName(order.originCountryCode, language)}
                                  />
                                  <span className="font-mono">{order.originCountryCode}</span>
                                </div>
                                {order.originCity && (
                                  <p className="truncate text-xs text-muted-foreground">{order.originCity}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Separator className="w-5" />
                                <TransportIcon mode={order.transportMode} />
                                <Separator className="w-5" />
                              </div>
                              <div className="min-w-0 text-right">
                                <div className="flex items-center justify-end gap-2 font-medium">
                                  <span className="font-mono">{order.destinationCountryCode}</span>
                                  <CountryFlag
                                    code={order.destinationCountryCode}
                                    label={countryName(order.destinationCountryCode, language)}
                                  />
                                </div>
                                {order.destinationCity && (
                                  <p className="truncate text-xs text-muted-foreground">{order.destinationCity}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                              <span>{order.carrier}</span>
                              <span>{formatDate(order.eta)}</span>
                            </div>
                          </CardContent>
                        </div>
                      </Button>
                    );
                  })
                )}
              </div>
            </div>

            {selectedOrder ? (
              <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="border-b px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardDescription>{copy.orderDetails}</CardDescription>
                      <CardTitle className="mt-1 font-mono text-xl">{selectedOrder.reference}</CardTitle>
                    </div>
                    <Badge variant={selectedOrder.status === "delayed" ? "destructive" : "outline"}>
                      {statusIcon(selectedOrder.status)}
                      {statusLabel(selectedOrder.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-5 sm:p-6">
                  <Progress value={selectedOrder.progress}>
                    <ProgressLabel>{selectedOrder.carrier}</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                      {selectedOrder.progress}% {copy.progress}
                    </span>
                  </Progress>

                  <Tabs defaultValue="overview">
                    <TabsList variant="line" className="gap-5">
                      <TabsTrigger value="overview">{copy.overview}</TabsTrigger>
                      <TabsTrigger value="route">{copy.route}</TabsTrigger>
                      <TabsTrigger value="cargo">{copy.cargoTab}</TabsTrigger>
                      <TabsTrigger value="activity">{copy.activity}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 pt-4">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{copy.cargo}</p>
                          <p className="mt-1 font-medium">{selectedOrder.cargo}</p>
                        </div>
                        {selectedOrder.totalWeightKg !== null && (
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.weight}</p>
                            <p className="mt-1 font-medium">{selectedOrder.totalWeightKg.toLocaleString(locale)} kg</p>
                          </div>
                        )}
                        {selectedOrder.cbm !== null && (
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.cbm}</p>
                            <p className="mt-1 font-medium">{selectedOrder.cbm.toLocaleString(locale)} CBM</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">{copy.transportMode}</p>
                          <p className="mt-1 flex items-center gap-2 font-medium">
                            <TransportIcon mode={selectedOrder.transportMode} />
                            {copy[selectedOrder.transportMode as "air" | "sea" | "road" | "rail"] ?? selectedOrder.transportMode}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{copy.estimatedArrival}</p>
                          <p className="mt-1 font-medium">{formatDate(selectedOrder.eta)}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h2 className="text-sm font-semibold">{copy.routeSummary}</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                          <div className="rounded-lg border bg-muted/20 p-4">
                            <CountryFlag
                              code={selectedOrder.originCountryCode}
                              label={countryName(selectedOrder.originCountryCode, language)}
                              className="h-8 w-12"
                            />
                            <p className="mt-2 font-mono font-semibold">{selectedOrder.originCountryCode}</p>
                            {selectedOrder.originCity && (
                              <p className="text-sm text-muted-foreground">{selectedOrder.originCity}</p>
                            )}
                          </div>
                          <div className="hidden items-center gap-2 text-muted-foreground sm:flex">
                            <Separator className="w-8" />
                            <TransportIcon mode={selectedOrder.transportMode} />
                            <Separator className="w-8" />
                          </div>
                          <div className="rounded-lg border bg-muted/20 p-4 sm:text-right">
                            <CountryFlag
                              code={selectedOrder.destinationCountryCode}
                              label={countryName(selectedOrder.destinationCountryCode, language)}
                              className="ml-auto h-8 w-12"
                            />
                            <p className="mt-2 font-mono font-semibold">{selectedOrder.destinationCountryCode}</p>
                            {selectedOrder.destinationCity && (
                              <p className="text-sm text-muted-foreground">{selectedOrder.destinationCity}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedOrder.status === "delayed" && (
                        <Alert variant="destructive">
                          <CircleAlert />
                          <AlertTitle>{copy.delayed}</AlertTitle>
                          <AlertDescription>{copy.estimatedArrival}: {formatDate(selectedOrder.eta)}</AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="route" className="pt-4">
                      <Alert>
                        <Truck />
                        <AlertTitle>{copy.routeSummary}</AlertTitle>
                        <AlertDescription>
                          {selectedOrder.originCountryCode}
                          {selectedOrder.originCity ? `, ${selectedOrder.originCity}` : ""}
                          {" → "}
                          {selectedOrder.destinationCountryCode}
                          {selectedOrder.destinationCity ? `, ${selectedOrder.destinationCity}` : ""}
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    <TabsContent value="cargo" className="pt-4">
                      <Alert>
                        <Package />
                        <AlertTitle>{copy.cargoDetails}</AlertTitle>
                        <AlertDescription>
                          {[
                            selectedOrder.cargo,
                            selectedOrder.totalWeightKg !== null
                              ? `${selectedOrder.totalWeightKg.toLocaleString(locale)} kg`
                              : null,
                            selectedOrder.cbm !== null
                              ? `${selectedOrder.cbm.toLocaleString(locale)} CBM`
                              : null,
                            selectedOrder.carrier,
                          ].filter(Boolean).join(" · ")}
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    <TabsContent value="activity" className="pt-4">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{copy.created}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{copy.estimatedArrival}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.eta)}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Package className="size-10" />
                  <p>{copy.noSelection}</p>
                  <CreateOrderDialog
                    language={language}
                    carriers={carriers}
                    articles={articles}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
