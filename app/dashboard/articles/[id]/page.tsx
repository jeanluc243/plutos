import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDatabase } from "@/lib/db/client";
import { articles, orders } from "@/lib/db/schema";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { formatPrice } from "@/lib/pricing";
import { calculateArticleCost } from "@/lib/article-pricing";
import { getDashboardContext } from "../../dashboard-context";
import { ArticleEditor } from "./article-editor";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { language, user, isAdmin }] = await Promise.all([
    params,
    getDashboardContext(),
  ]);
  const fr = language === "fr";
  const locale = fr ? "fr-FR" : "en-US";

  const [[article], priceSettings, allOrders] = await Promise.all([
    getDatabase()
      .select()
      .from(articles)
      .where(isAdmin ? eq(articles.id, id) : and(eq(articles.id, id), eq(articles.ownerId, user.id)))
      .limit(1),
    getUserPriceSettings(user.id),
    getDatabase()
      .select()
      .from(orders)
      .where(isAdmin ? eq(orders.articleId, id) : and(eq(orders.ownerId, user.id), eq(orders.articleId, id)))
      .orderBy(desc(orders.createdAt)),
  ]);
  if (!article) notFound();

  const purchasePrice = Number(article.purchasePrice);
  const salePrice = Number(article.salePrice);
  const transportCost = Number(article.transportCost);
  const paymentCommission = Number(article.paymentCommission);
  const chinaTransportCost = Number(article.chinaTransportCost);
  const agencyTransportCost = Number(article.agencyTransportCost);
  const gainMultiplier = Number(article.gainMultiplier);
  const totalCost = calculateArticleCost({
    purchasePrice,
    transportCost,
    paymentCommission,
    chinaTransportCost,
    agencyTransportCost,
  });
  const markupAmount = salePrice - totalCost;
  const markupPercent = totalCost > 0 ? (markupAmount / totalCost) * 100 : 0;
  const history = allOrders;

  return (
    <main className="min-h-[calc(100dvh-73px)] space-y-6 bg-muted/20 p-4 sm:p-6">
        <div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold">{article.name}</h1><Badge variant="secondary">{article.sku}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{article.category} · {article.supplier}</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [fr ? "Prix d’achat" : "Purchase price", purchasePrice],
            [fr ? "Prix de vente" : "Sale price", salePrice],
            [fr ? "Coût de transport" : "Transport cost", transportCost],
            [fr ? "Commission de paiement" : "Payment commission", paymentCommission],
            [fr ? "Transport achat" : "Purchase transport", chinaTransportCost],
            [fr ? "Transport agence" : "Agency transport", agencyTransportCost],
          ].map(([label, value]) => <Card key={String(label)}><CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatPrice(Number(value), priceSettings, locale)}</CardContent></Card>)}
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{fr ? "Indice de gain" : "Gain multiplier"}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">×{gainMultiplier.toFixed(2)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{fr ? "Majoration" : "Markup"}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatPrice(markupAmount, priceSettings, locale)}</p><p className="text-sm text-muted-foreground">{markupPercent.toFixed(1)}%</p></CardContent></Card>
        </div>

        {article.ownerId === user.id ? (
          <ArticleEditor language={language} article={{ id: article.id, name: article.name, category: article.category, supplier: article.supplier, city: article.city, purchasePrice, salePrice, transportCost, paymentCommission, chinaTransportCost, agencyTransportCost, gainMultiplier, stock: article.stock, information: article.information, images: article.images }} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {fr ? "Cet article est consultable en lecture seule." : "This product is available in read-only mode."}
          </p>
        )}

        <Card>
          <CardHeader><CardTitle>{fr ? "Historique des commandes" : "Order history"}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>{fr ? "Référence" : "Reference"}</TableHead><TableHead>{fr ? "Transporteur" : "Carrier"}</TableHead><TableHead>{fr ? "Statut" : "Status"}</TableHead><TableHead>{fr ? "Créée le" : "Created"}</TableHead></TableRow></TableHeader><TableBody>
              {history.length === 0 ? <TableRow><TableCell colSpan={4} className="h-28 text-center text-muted-foreground">{fr ? "Aucune commande associée à cet article." : "No order associated with this product."}</TableCell></TableRow> : history.map((order) => <TableRow key={order.id}><TableCell className="font-mono">{order.reference}</TableCell><TableCell>{order.carrier}</TableCell><TableCell><Badge variant="outline">{order.status}</Badge></TableCell><TableCell>{order.createdAt.toLocaleDateString(locale)}</TableCell></TableRow>)}
            </TableBody></Table>
          </CardContent>
        </Card>
    </main>
  );
}
