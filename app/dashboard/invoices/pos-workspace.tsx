"use client";

import { useActionState, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  Minus,
  Package,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Smartphone,
  University,
} from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatPrice, type PriceSettings } from "@/lib/pricing";
import { CreateClientDialog } from "../clients/create-client-dialog";
import type { DashboardLanguage } from "../language";
import { completePosSale } from "./actions";
import {
  initialCompleteSaleState,
  type CompleteSaleState,
} from "./sale-state";

type PosArticle = {
  id: string;
  sku: string;
  name: string;
  category: string;
  salePrice: number;
  stock: number;
};

type PosClient = { id: string; name: string; phone: string };
type CartLine = PosArticle & { quantity: number };
type PaymentMethod = "cash" | "card" | "mobile" | "bank";

const copy = {
  en: {
    title: "Point of sale",
    description: "Create and print a customer invoice.",
    search: "Search an article or SKU...",
    catalog: "Article catalog",
    available: "available",
    outOfStock: "Out of stock",
    add: "Add",
    emptyCatalog: "No article matches your search.",
    currentSale: "Current sale",
    emptyCart: "Add an article to start an invoice.",
    customer: "Customer",
    walkIn: "Walk-in customer",
    searchCustomer: "Search by name or phone...",
    noCustomer: "No customer found.",
    payment: "Payment method",
    cash: "Cash",
    card: "Card",
    mobile: "Mobile money",
    bank: "Bank transfer",
    discount: "Discount (%)",
    subtotal: "Subtotal",
    discountAmount: "Discount",
    total: "Total",
    print: "Print invoice",
    completeSale: "Complete sale and print",
    completingSale: "Recording sale...",
    saleSaved: "Sale recorded. The stock has been updated.",
    errors: {
      invalid: "Your sale could not be validated.",
      insufficient: "One or more articles no longer have enough stock.",
      unauthorized: "Your session has expired. Sign in again.",
      unknown: "The sale could not be recorded. Please try again.",
    },
    reset: "New sale",
    date: "Date",
    quantity: "Qty",
    unitPrice: "Unit price",
  },
  fr: {
    title: "Point de vente",
    description: "Créez et imprimez une facture client.",
    search: "Rechercher un article ou un SKU…",
    catalog: "Catalogue des articles",
    available: "disponible(s)",
    outOfStock: "Rupture de stock",
    add: "Ajouter",
    emptyCatalog: "Aucun article ne correspond à votre recherche.",
    currentSale: "Vente en cours",
    emptyCart: "Ajoutez un article pour commencer la facture.",
    customer: "Client",
    walkIn: "Client de passage",
    searchCustomer: "Rechercher par nom ou téléphone…",
    noCustomer: "Aucun client trouvé.",
    payment: "Mode de paiement",
    cash: "Espèces",
    card: "Carte",
    mobile: "Mobile money",
    bank: "Virement bancaire",
    discount: "Remise (%)",
    subtotal: "Sous-total",
    discountAmount: "Remise",
    total: "Total",
    print: "Imprimer la facture",
    completeSale: "Finaliser et imprimer",
    completingSale: "Enregistrement de la vente…",
    saleSaved: "Vente enregistrée. Le stock a été mis à jour.",
    errors: {
      invalid: "La vente ne peut pas être validée.",
      insufficient: "Un ou plusieurs articles ne sont plus suffisamment en stock.",
      unauthorized: "Votre session a expiré. Reconnectez-vous.",
      unknown: "La vente n’a pas pu être enregistrée. Réessayez.",
    },
    reset: "Nouvelle vente",
    date: "Date",
    quantity: "Qté",
    unitPrice: "Prix unitaire",
  },
} as const;

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  mobile: Smartphone,
  bank: University,
} as const;

export function PosWorkspace({
  articles,
  clients,
  priceSettings,
  language,
  invoiceNumber,
  issuedAt,
}: {
  articles: PosArticle[];
  clients: PosClient[];
  priceSettings: PriceSettings;
  language: DashboardLanguage;
  invoiceNumber: string;
  issuedAt: string;
}) {
  const text = copy[language];
  const locale = language === "fr" ? "fr-CD" : "en-US";
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientOptions, setClientOptions] = useState(clients);
  const [clientId, setClientId] = useState("walk-in");
  const [clientSearch, setClientSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState(0);
  const [saleState, saleAction, salePending] = useActionState(
    async (previousState: CompleteSaleState, formData: FormData) => {
      const nextState = await completePosSale(previousState, formData);
      if (nextState.status === "success") {
        window.print();
        resetSale();
      }
      return nextState;
    },
    initialCompleteSaleState,
  );

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return articles;
    return articles.filter((article) =>
      [article.name, article.sku, article.category].some((value) =>
        value.toLocaleLowerCase(locale).includes(normalized),
      ),
    );
  }, [articles, locale, query]);

  const selectedClient = clientOptions.find((client) => client.id === clientId);
  const filteredClients = useMemo(() => {
    const normalized = clientSearch.trim().toLocaleLowerCase(locale);
    if (!normalized) return clientOptions;

    return clientOptions.filter((client) =>
      [client.name, client.phone].some((value) =>
        value.toLocaleLowerCase(locale).includes(normalized),
      ),
    );
  }, [clientOptions, clientSearch, locale]);
  const subtotal = cart.reduce(
    (sum, line) => sum + line.salePrice * line.quantity,
    0,
  );
  const discountAmount = subtotal * (discount / 100);
  const total = Math.max(0, subtotal - discountAmount);
  const PaymentIcon = paymentIcons[paymentMethod];

  function addArticle(article: PosArticle) {
    if (article.stock <= 0) return;
    setCart((current) => {
      const existing = current.find((line) => line.id === article.id);
      if (!existing) return [...current, { ...article, quantity: 1 }];
      if (existing.quantity >= article.stock) return current;
      return current.map((line) =>
        line.id === article.id
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      );
    });
  }

  function changeQuantity(id: string, amount: number) {
    setCart((current) =>
      current.flatMap((line) => {
        if (line.id !== id) return [line];
        const quantity = Math.min(line.stock, line.quantity + amount);
        return quantity > 0 ? [{ ...line, quantity }] : [];
      }),
    );
  }

  function resetSale() {
    setCart([]);
    setClientId("walk-in");
    setClientSearch("");
    setPaymentMethod("cash");
    setDiscount(0);
    setQuery("");
  }

  return (
    <div className="min-h-[calc(100dvh-73px)] bg-muted/20 p-4 print:min-h-0 print:bg-white print:p-0 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText className="size-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{text.description}</p>
          </div>
          <Badge variant="outline" className="font-mono">{invoiceNumber}</Badge>
        </header>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-4 print:hidden" aria-labelledby="catalog-title">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={text.search}
                aria-label={text.search}
                className="h-10 bg-background pl-9"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <h2 id="catalog-title" className="font-medium">{text.catalog}</h2>
              <span className="text-xs text-muted-foreground">
                {filteredArticles.length} {text.available}
              </span>
            </div>

            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {text.emptyCatalog}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredArticles.map((article) => (
                  <Card key={article.id} size="sm" className="justify-between">
                    <CardHeader>
                      <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Package className="size-4" />
                      </div>
                      <CardTitle className="line-clamp-2">{article.name}</CardTitle>
                      <CardDescription>{article.sku} · {article.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between gap-3">
                      <div>
                        <p className="font-semibold">{formatPrice(article.salePrice, priceSettings, locale)}</p>
                        <p className="text-xs text-muted-foreground">
                          {article.stock > 0 ? `${article.stock} ${text.available}` : text.outOfStock}
                        </p>
                      </div>
                      <Button type="button" size="sm" onClick={() => addArticle(article)} disabled={article.stock <= 0}>
                        <Plus />
                        {text.add}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Card className="xl:sticky xl:top-5 print:static print:overflow-visible print:ring-0">
            <CardHeader className="border-b print:px-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{text.currentSale}</CardTitle>
                  <CardDescription className="font-mono">{invoiceNumber}</CardDescription>
                </div>
                <ShoppingCart className="size-5 text-muted-foreground print:hidden" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4 print:px-0">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 print:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{text.customer}</Label>
                  <DropdownMenu onOpenChange={(open) => !open && setClientSearch("")}>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between font-normal print:hidden"
                        />
                      }
                    >
                      <span className="truncate">{selectedClient?.name ?? text.walkIn}</span>
                      <ChevronDown className="text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-(--anchor-width) min-w-64 p-1.5">
                      <div className="relative mb-1" onKeyDown={(event) => event.stopPropagation()}>
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={clientSearch}
                          onChange={(event) => setClientSearch(event.target.value)}
                          placeholder={text.searchCustomer}
                          aria-label={text.searchCustomer}
                          className="h-8 pl-8"
                          autoFocus
                        />
                      </div>
                      <DropdownMenuSeparator />
                      {!clientSearch.trim() && (
                        <DropdownMenuItem onClick={() => setClientId("walk-in")}>
                          <Check className={clientId === "walk-in" ? "opacity-100" : "opacity-0"} />
                          <span>{text.walkIn}</span>
                        </DropdownMenuItem>
                      )}
                      {filteredClients.length === 0 ? (
                        <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                          {text.noCustomer}
                        </p>
                      ) : (
                        filteredClients.map((client) => (
                          <DropdownMenuItem key={client.id} onClick={() => setClientId(client.id)}>
                            <Check className={clientId === client.id ? "opacity-100" : "opacity-0"} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{client.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">{client.phone}</span>
                            </span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="print:hidden">
                    <CreateClientDialog
                      language={language}
                      inline
                      onCreated={(client) => {
                        setClientOptions((current) =>
                          [...current, client].sort((a, b) => a.name.localeCompare(b.name, locale)),
                        );
                        setClientId(client.id);
                      }}
                    />
                  </div>
                  <p className="hidden text-sm print:block">
                    {selectedClient ? `${selectedClient.name} · ${selectedClient.phone}` : text.walkIn}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>{text.payment}</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => {
                      if (value && value in paymentIcons) setPaymentMethod(value as PaymentMethod);
                    }}
                  >
                    <SelectTrigger className="w-full print:hidden">
                      <PaymentIcon />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{text.cash}</SelectItem>
                      <SelectItem value="card">{text.card}</SelectItem>
                      <SelectItem value="mobile">{text.mobile}</SelectItem>
                      <SelectItem value="bank">{text.bank}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="hidden text-sm print:block">{text[paymentMethod]}</p>
                </div>
              </div>

              <div className="hidden items-center justify-between border-y py-3 text-sm print:flex">
                <span>{text.date}</span>
                <span>{new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(new Date(issuedAt))}</span>
              </div>

              {cart.length === 0 ? (
                <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground print:hidden">
                  <ShoppingCart className="size-8 opacity-50" />
                  <p>{text.emptyCart}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map((line) => (
                    <div key={line.id} className="space-y-2 py-3 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{line.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {line.sku} · {formatPrice(line.salePrice, priceSettings, locale)}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold">
                          {formatPrice(line.salePrice * line.quantity, priceSettings, locale)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1 print:hidden">
                          <Button type="button" variant="outline" size="icon-xs" onClick={() => changeQuantity(line.id, -1)} aria-label={`Diminuer ${line.name}`}>
                            <Minus />
                          </Button>
                          <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                          <Button type="button" variant="outline" size="icon-xs" onClick={() => changeQuantity(line.id, 1)} disabled={line.quantity >= line.stock} aria-label={`Augmenter ${line.name}`}>
                            <Plus />
                          </Button>
                        </div>
                        <span className="hidden text-xs text-muted-foreground print:inline">
                          {text.quantity}: {line.quantity} · {text.unitPrice}: {formatPrice(line.salePrice, priceSettings, locale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 print:hidden">
                <Label htmlFor="pos-discount">{text.discount}</Label>
                <Input
                  id="pos-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discount}
                  onChange={(event) => setDiscount(Math.min(100, Math.max(0, Number(event.target.value) || 0)))}
                />
              </div>

              <Separator />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{text.subtotal}</dt>
                  <dd>{formatPrice(subtotal, priceSettings, locale)}</dd>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{text.discountAmount} ({discount}%)</dt>
                    <dd>-{formatPrice(discountAmount, priceSettings, locale)}</dd>
                  </div>
                ) : null}
                <div className="flex items-end justify-between gap-4 pt-2 text-lg font-semibold">
                  <dt>{text.total}</dt>
                  <dd className="text-2xl">{formatPrice(total, priceSettings, locale)}</dd>
                </div>
              </dl>

              <div className="grid gap-2 print:hidden sm:grid-cols-2 xl:grid-cols-1">
                <form action={saleAction}>
                  <input type="hidden" name="invoiceNumber" value={invoiceNumber} />
                  <input type="hidden" name="lines" value={JSON.stringify(cart.map(({ id, quantity }) => ({ id, quantity })))} />
                  <Button type="submit" size="lg" className="w-full" disabled={cart.length === 0 || salePending}>
                    {salePending ? <ReceiptText className="animate-pulse" /> : <Printer />}
                    {salePending ? text.completingSale : text.completeSale}
                  </Button>
                </form>
                <Button type="button" size="lg" variant="outline" onClick={resetSale}>
                  <RotateCcw />
                  {text.reset}
                </Button>
              </div>
              {saleState.status === "error" && saleState.error && (
                <p className="text-sm text-destructive" role="alert">{text.errors[saleState.error]}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
