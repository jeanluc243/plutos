"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Package,
  Plane,
  Printer,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, type PriceSettings } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { DashboardLanguage } from "../language";
import { countryName } from "./countries";
import { ordersCopy } from "./copy";
import {
  CreateOrderDialog,
  type OrderArticleOption,
} from "./create-order-dialog";
import {
  paginatePurchaseOrderItems,
  PurchaseOrderPrint,
} from "./purchase-order-print";
import { PrintOrdersDialog } from "./print-orders-dialog";
import { launchOrderRecord } from "./actions";

type OrderStatus = "draft" | "in_transit" | "delivered" | "delayed" | "on_hold";
type OrderFilter = "all" | OrderStatus;
const ALL_CLIENTS = "__all_clients__";
const ALL_MODES = "__all_modes__";

export type OrderRecord = {
  id: string;
  reference: string;
  articleId: string | null;
  clientId: string | null;
  clientName: string | null;
  originCountryCode: string;
  originCountryName: string;
  originCity: string;
  destinationCountryCode: string;
  destinationCountryName: string;
  destinationCity: string;
  cargo: string;
  carrier: string;
  transportMode: string;
  quantity: number;
  purchaseUnitPrice: number;
  transportCost: number;
  additionalCharges: number;
  createdByEmail: string | null;
  launchedAt: string | null;
  launchedByEmail: string | null;
  totalWeightKg: number | null;
  cbm: number | null;
  status: string;
  progress: number;
  eta: string;
  createdAt: string;
  items: Array<{
    id: string;
    articleId: string | null;
    description: string;
    sku: string;
    quantity: number;
    purchaseUnitPrice: number;
  }>;
};

function orderQuantity(order: OrderRecord) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function orderPurchaseTotal(order: OrderRecord) {
  return order.items.reduce(
    (sum, item) => sum + item.purchaseUnitPrice * item.quantity,
    0,
  );
}

function orderCargoLabel(order: OrderRecord) {
  const first = order.items[0]?.description ?? order.cargo;
  return order.items.length > 1 ? `${first} + ${order.items.length - 1}` : first;
}

function isOrderStatus(value: string): value is OrderStatus {
  return ["draft", "in_transit", "delivered", "delayed", "on_hold"].includes(value);
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
  clients,
  priceSettings,
}: {
  language: DashboardLanguage;
  orders: OrderRecord[];
  carriers: { id: string; name: string; information: string | null }[];
  articles: OrderArticleOption[];
  clients: { id: string; name: string }[];
  priceSettings: PriceSettings;
}) {
  const copy = ordersCopy[language];
  const router = useRouter();
  const [launching, startLaunchTransition] = useTransition();
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS);
  const [transportFilter, setTransportFilter] = useState(ALL_MODES);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? "");
  const [printMode, setPrintMode] = useState<"receipt-a4" | "receipt-thermal" | null>(null);
  const [printOrderIds, setPrintOrderIds] = useState<string[]>([]);
  const [printTimestamp, setPrintTimestamp] = useState<string | null>(null);

  useEffect(() => {
    if (!printMode) return;

    let cancelled = false;
    const resetPrintMode = () => {
      setPrintMode(null);
      setPrintOrderIds([]);
      setPrintTimestamp(null);
    };
    const printWhenReady = async () => {
      await document.fonts.ready;
      const printRoot = document.getElementById("orders-print");
      const images = Array.from(printRoot?.querySelectorAll("img") ?? []);
      await Promise.all(images.map(async (image) => {
        if (!image.complete) {
          await new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }
        await image.decode().catch(() => undefined);
      }));
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      });
      if (!cancelled) window.print();
    };

    void printWhenReady();
    window.addEventListener("afterprint", resetPrintMode);
    return () => {
      cancelled = true;
      window.removeEventListener("afterprint", resetPrintMode);
    };
  }, [printMode]);

  function startPrint(mode: "receipt-a4" | "receipt-thermal", orderIds: string[]) {
    setPrintTimestamp(new Date().toISOString());
    setPrintOrderIds(orderIds);
    setPrintMode(mode);
  }

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return orders.filter((order) => {
      const status = isOrderStatus(order.status) ? order.status : "in_transit";
      const matchesFilter = filter === "all" || status === filter;
      const createdDate = order.createdAt.slice(0, 10);
      const matchesClient =
        clientFilter === ALL_CLIENTS ||
        (clientFilter === "__no_client__" ? order.clientId === null : order.clientId === clientFilter);
      const matchesTransport = transportFilter === ALL_MODES || order.transportMode === transportFilter;
      const matchesDates = (!dateFrom || createdDate >= dateFrom) && (!dateTo || createdDate <= dateTo);
      const matchesSearch =
        !normalized ||
        order.reference.toLocaleLowerCase(locale).includes(normalized) ||
        order.items.some((item) => item.description.toLocaleLowerCase(locale).includes(normalized)) ||
        (order.clientName ?? "").toLocaleLowerCase(locale).includes(normalized) ||
        order.originCity.toLocaleLowerCase(locale).includes(normalized) ||
        order.destinationCity.toLocaleLowerCase(locale).includes(normalized);
      return matchesFilter && matchesClient && matchesTransport && matchesDates && matchesSearch;
    });
  }, [clientFilter, dateFrom, dateTo, filter, locale, orders, query, transportFilter]);

  const selectedOrder =
    orders.find((order) => order.id === selectedId) ?? filteredOrders[0] ?? null;

  function statusLabel(status: string) {
    if (status === "draft") return copy.draft;
    if (status === "delivered") return copy.delivered;
    if (status === "delayed") return copy.delayed;
    if (status === "on_hold") return copy.onHold;
    return copy.inTransit;
  }

  function statusIcon(status: string) {
    if (status === "draft") return <Clock3 data-icon="inline-start" />;
    if (status === "delivered") return <CheckCircle2 data-icon="inline-start" />;
    if (status === "delayed") return <CircleAlert data-icon="inline-start" />;
    return <Clock3 data-icon="inline-start" />;
  }

  function formatDate(value: string) {
    const date = new Date(value);
    const monthNames = language === "fr"
      ? ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getUTCDate();
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    if (language === "fr") {
      return `${day} ${month} ${year} à ${date.getUTCHours()}:${minutes} UTC`;
    }

    const hour = date.getUTCHours() % 12 || 12;
    const period = date.getUTCHours() >= 12 ? "PM" : "AM";
    return `${month} ${day}, ${year} at ${hour}:${minutes} ${period} UTC`;
  }

  const counts = {
    all: orders.length,
    draft: orders.filter((order) => order.status === "draft").length,
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
          clients={clients}
        />
        <PrintOrdersDialog
          orders={filteredOrders}
          language={language}
          onPrint={(format, orderIds) => startPrint(`receipt-${format}`, orderIds)}
        />
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => {
          if (value && ["all", "draft", "in_transit", "delivered", "delayed", "on_hold"].includes(value)) {
            setFilter(value as OrderFilter);
          }
        }}
        className="gap-0"
      >
        <div className="overflow-x-auto border-b bg-background px-3 sm:px-6">
          <TabsList variant="line" className="h-12 min-w-max gap-5">
            <TabsTrigger value="all">{copy.all} ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">{copy.draft} ({counts.draft})</TabsTrigger>
            <TabsTrigger value="in_transit">{copy.inTransit} ({counts.in_transit})</TabsTrigger>
            <TabsTrigger value="delivered">{copy.delivered} ({counts.delivered})</TabsTrigger>
            <TabsTrigger value="delayed">{copy.delayed} ({counts.delayed})</TabsTrigger>
          </TabsList>
        </div>

        <div className="grid gap-3 border-b bg-background p-3 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
          <Select value={clientFilter} onValueChange={(value) => setClientFilter(value ?? ALL_CLIENTS)}>
            <SelectTrigger className="w-full">{clients.find((client) => client.id === clientFilter)?.name ?? copy.allClients}</SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={ALL_CLIENTS}>{copy.allClients}</SelectItem>
              <SelectItem value="__no_client__">{copy.noClient}</SelectItem>
              {clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={transportFilter} onValueChange={(value) => setTransportFilter(value ?? ALL_MODES)}>
            <SelectTrigger className="w-full">{transportFilter === ALL_MODES ? copy.allTransportModes : copy[transportFilter as "air" | "sea" | "road" | "rail"]}</SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={ALL_MODES}>{copy.allTransportModes}</SelectItem>
              <SelectItem value="air">{copy.air}</SelectItem>
              <SelectItem value="sea">{copy.sea}</SelectItem>
              <SelectItem value="road">{copy.road}</SelectItem>
              <SelectItem value="rail">{copy.rail}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label={copy.dateFrom} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label={copy.dateTo} />
        </div>

        <TabsContent value={filter} className="m-0 p-0 min-[1100px]:p-6">
          <div className="grid gap-0 min-[1100px]:min-h-[680px] min-[1100px]:grid-cols-[360px_minmax(0,1fr)] min-[1100px]:gap-4">
            <div className="space-y-3">
              <div className="relative px-3 pt-3 min-[1100px]:px-0 min-[1100px]:pt-0">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.search}
                  aria-label={copy.search}
                  className="bg-background pl-9"
                />
              </div>

              <div className="space-y-0 overflow-visible min-[1100px]:max-h-[620px] min-[1100px]:space-y-3 min-[1100px]:overflow-y-auto min-[1100px]:pr-1">
                {filteredOrders.length === 0 ? (
                  <Card className="rounded-none border-x-0 shadow-none min-[1100px]:rounded-xl min-[1100px]:border">
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
                          "h-auto w-full flex-col items-stretch gap-2 rounded-none border-x-0 border-t-0 bg-transparent px-0 py-2 text-left whitespace-normal shadow-none hover:bg-muted/40 min-[1100px]:gap-4 min-[1100px]:rounded-xl min-[1100px]:border min-[1100px]:bg-card min-[1100px]:py-4 dark:bg-transparent dark:hover:bg-muted/30 min-[1100px]:dark:bg-card",
                          active && "border-b-primary bg-muted/30 min-[1100px]:border-primary",
                        )}
                        aria-pressed={active}
                      >
                        <div className="flex w-full flex-col gap-2 min-[1100px]:gap-4">
                          <CardHeader className="gap-0 px-3 min-[1100px]:gap-1 min-[1100px]:px-4">
                            <div className="flex items-start justify-between gap-2 min-[1100px]:gap-3">
                              <div>
                                <CardTitle className="font-mono text-xs min-[1100px]:text-sm">{order.reference}</CardTitle>
                                <CardDescription className="mt-0.5 text-xs min-[1100px]:mt-1 min-[1100px]:text-sm">{orderCargoLabel(order)}</CardDescription>
                              </div>
                              <Badge
                                variant={order.status === "delayed" ? "destructive" : "secondary"}
                                className="h-5 px-1.5 text-[11px] min-[1100px]:h-auto min-[1100px]:px-2"
                              >
                                {statusIcon(order.status)}
                                {statusLabel(order.status)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 px-3 min-[1100px]:space-y-4 min-[1100px]:px-4">
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 text-xs min-[1100px]:gap-2 min-[1100px]:text-sm">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 font-medium min-[1100px]:gap-2">
                                  <CountryFlag
                                    code={order.originCountryCode}
                                    label={countryName(order.originCountryCode, language)}
                                  />
                                  <span className="font-mono">{order.originCountryCode}</span>
                                </div>
                                {order.originCity && (
                                  <p className="truncate text-[11px] text-muted-foreground min-[1100px]:text-xs">{order.originCity}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Separator className="w-5" />
                                <TransportIcon mode={order.transportMode} />
                                <Separator className="w-5" />
                              </div>
                              <div className="min-w-0 text-right">
                                <div className="flex items-center justify-end gap-1.5 font-medium min-[1100px]:gap-2">
                                  <span className="font-mono">{order.destinationCountryCode}</span>
                                  <CountryFlag
                                    code={order.destinationCountryCode}
                                    label={countryName(order.destinationCountryCode, language)}
                                  />
                                </div>
                                {order.destinationCity && (
                                  <p className="truncate text-[11px] text-muted-foreground min-[1100px]:text-xs">{order.destinationCity}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground min-[1100px]:text-xs">
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
              <Card className="mt-3 gap-0 overflow-hidden rounded-none border-x-0 border-b-0 py-0 shadow-none min-[1100px]:mt-0 min-[1100px]:rounded-xl min-[1100px]:border min-[1100px]:shadow-sm">
                <CardHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardDescription>{copy.orderDetails}</CardDescription>
                      <CardTitle className="mt-1 font-mono text-xl">{selectedOrder.reference}</CardTitle>
                    </div>
                    <Badge variant={selectedOrder.status === "delayed" ? "destructive" : "outline"}>
                      {statusIcon(selectedOrder.status)}
                      {statusLabel(selectedOrder.status)}
                    </Badge>
                    {selectedOrder.status === "draft" && (
                      <Button
                        type="button"
                        disabled={launching}
                        onClick={() => startLaunchTransition(async () => {
                          const result = await launchOrderRecord(selectedOrder.id);
                          if (result.status === "success") router.refresh();
                        })}
                      >
                        {launching ? <Clock3 className="animate-spin" data-icon="inline-start" /> : <Package data-icon="inline-start" />}
                        {launching ? copy.launching : copy.launchThisOrder}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" />}>
                        <Printer data-icon="inline-start" />
                        {copy.printReceipt}
                        <ChevronDown data-icon="inline-end" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-56">
                        <DropdownMenuItem onClick={() => startPrint("receipt-a4", [selectedOrder.id])}>
                          {copy.printA4}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startPrint("receipt-thermal", [selectedOrder.id])}>
                          {copy.printThermal}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-4 sm:p-6">
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
                          <p className="mt-1 font-medium">{orderCargoLabel(selectedOrder)}</p>
                        </div>
                        {selectedOrder.totalWeightKg !== null && (
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.weight}</p>
                            <p className="mt-1 font-medium">{selectedOrder.totalWeightKg.toLocaleString(locale)} kg</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">{copy.quantity}</p>
                          <p className="mt-1 font-medium">{orderQuantity(selectedOrder).toLocaleString(locale)}</p>
                        </div>
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
                        <h2 className="text-sm font-semibold">{copy.purchaseInformation}</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.purchaseUnitPrice}</p>
                            <p className="mt-1 font-medium">
                              {selectedOrder.items.length === 1
                                ? formatPrice(selectedOrder.items[0].purchaseUnitPrice, priceSettings, locale)
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.totalPurchase}</p>
                            <p className="mt-1 font-medium">{formatPrice(orderPurchaseTotal(selectedOrder), priceSettings, locale)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.createdBy}</p>
                            <p className="mt-1 break-all font-medium">{selectedOrder.createdByEmail ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.transportCost}</p>
                            <p className="mt-1 font-medium">{formatPrice(selectedOrder.transportCost, priceSettings, locale)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{copy.additionalCharges}</p>
                            <p className="mt-1 font-medium">{formatPrice(selectedOrder.additionalCharges, priceSettings, locale)}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h2 className="text-sm font-semibold">{copy.routeSummary}</h2>
                        <div className="mt-4 grid gap-4 min-[1100px]:grid-cols-[1fr_auto_1fr] min-[1100px]:items-center">
                          <div className="border-b pb-4 min-[1100px]:rounded-lg min-[1100px]:border min-[1100px]:bg-muted/20 min-[1100px]:p-4">
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
                          <div className="hidden items-center gap-2 text-muted-foreground min-[1100px]:flex">
                            <Separator className="w-8" />
                            <TransportIcon mode={selectedOrder.transportMode} />
                            <Separator className="w-8" />
                          </div>
                          <div className="pt-1 min-[1100px]:rounded-lg min-[1100px]:border min-[1100px]:bg-muted/20 min-[1100px]:p-4 min-[1100px]:text-right">
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
                          <span className="grid gap-2">
                            {selectedOrder.items.map((item) => (
                              <span key={item.id} className="flex items-baseline justify-between gap-4">
                                <span className="min-w-0 truncate">
                                  {item.description} · <span className="font-mono text-xs">{item.sku}</span>
                                </span>
                                <span className="shrink-0 font-mono">×{item.quantity.toLocaleString(locale)}</span>
                              </span>
                            ))}
                            <span className="text-xs text-muted-foreground">
                              {[
                                selectedOrder.totalWeightKg !== null
                                  ? `${selectedOrder.totalWeightKg.toLocaleString(locale)} kg`
                                  : null,
                                selectedOrder.cbm !== null
                                  ? `${selectedOrder.cbm.toLocaleString(locale)} CBM`
                                  : null,
                                selectedOrder.carrier,
                              ].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    <TabsContent value="activity" className="pt-4">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{copy.created}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.createdAt)}{selectedOrder.createdByEmail ? ` · ${selectedOrder.createdByEmail}` : ""}</p>
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
              <Card className="rounded-none border-x-0 border-b-0 shadow-none min-[1100px]:rounded-xl min-[1100px]:border min-[1100px]:shadow-sm">
                <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Package className="size-10" />
                  <p>{copy.noSelection}</p>
                  <CreateOrderDialog
                    language={language}
                    carriers={carriers}
                    articles={articles}
                    clients={clients}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      {printMode && printTimestamp
        ? createPortal(
            <section
              id="orders-print"
              className={cn("hidden", printMode === "receipt-thermal" && "purchase-order--thermal")}
            >
              {orders
                .filter((order) => printOrderIds.includes(order.id))
                .flatMap((order) => printMode === "receipt-a4"
                  ? paginatePurchaseOrderItems(order).map((items, pageIndex, pages) => (
                    <div className="purchase-order-sheet" key={`${order.id}-${pageIndex}`}>
                      <PurchaseOrderPrint
                        order={order}
                        items={items}
                        pageIndex={pageIndex}
                        pageCount={pages.length}
                        language={language}
                        priceSettings={priceSettings}
                        printedAt={printTimestamp}
                        copyType="client"
                      />
                      <PurchaseOrderPrint
                        order={order}
                        items={items}
                        pageIndex={pageIndex}
                        pageCount={pages.length}
                        language={language}
                        priceSettings={priceSettings}
                        printedAt={printTimestamp}
                        copyType="stock"
                      />
                    </div>
                  ))
                  : [(
                  <PurchaseOrderPrint
                    key={order.id}
                    order={order}
                    language={language}
                    priceSettings={priceSettings}
                    printedAt={printTimestamp}
                    thermal={printMode === "receipt-thermal"}
                  />
                  )])}
            </section>,
            document.body,
          )
        : null}
    </div>
  );
}
