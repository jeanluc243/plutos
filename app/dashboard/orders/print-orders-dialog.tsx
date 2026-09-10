"use client";

import { useState } from "react";
import { FileText, Printer, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DashboardLanguage } from "../language";
import type { OrderRecord } from "./orders-workspace";

const copy = {
  en: {
    trigger: "Print purchase orders",
    title: "Choose purchase orders",
    description: "Select one or more orders, then choose the paper format.",
    selectAll: "Select all filtered orders",
    selected: "selected",
    noOrders: "No order matches the current filters.",
    noClient: "No client",
    cancel: "Cancel",
    a4: "Print A4 · client + stock",
    thermal: "Print in 80 mm",
  },
  fr: {
    trigger: "Imprimer des bons",
    title: "Choisir les bons de commande",
    description: "Sélectionnez un ou plusieurs bons, puis choisissez le format du papier.",
    selectAll: "Sélectionner toutes les commandes filtrées",
    selected: "sélectionné(s)",
    noOrders: "Aucune commande ne correspond aux filtres actuels.",
    noClient: "Sans client",
    cancel: "Annuler",
    a4: "Imprimer A4 · client + stock",
    thermal: "Imprimer en 80 mm",
  },
} as const;

export function PrintOrdersDialog({
  orders,
  language,
  onPrint,
}: {
  orders: OrderRecord[];
  language: DashboardLanguage;
  onPrint: (format: "a4" | "thermal", orderIds: string[]) => void;
}) {
  const text = copy[language];
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = orders.length > 0 && selectedIds.length === orders.length;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setSelectedIds(orders.map((order) => order.id));
  }

  function toggleOrder(orderId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? current.includes(orderId) ? current : [...current, orderId]
        : current.filter((id) => id !== orderId),
    );
  }

  function print(format: "a4" | "thermal") {
    if (selectedIds.length === 0) return;
    setOpen(false);
    onPrint(format, selectedIds);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" disabled={orders.length === 0} />}>
        <Printer data-icon="inline-start" />
        {text.trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) =>
              setSelectedIds(checked ? orders.map((order) => order.id) : [])
            }
          />
          <span className="flex-1 font-medium">{text.selectAll}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {selectedIds.length}/{orders.length}
          </span>
        </label>

        <div className="max-h-[min(48vh,420px)] divide-y overflow-y-auto rounded-lg border">
          {orders.map((order) => (
            <label key={order.id} className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-muted/30">
              <Checkbox
                className="mt-0.5"
                checked={selectedIds.includes(order.id)}
                onCheckedChange={(checked) => toggleOrder(order.id, checked)}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs font-semibold">{order.reference}</span>
                <span className="mt-0.5 block truncate font-medium">{order.cargo}</span>
                <span className="block text-xs text-muted-foreground">
                  {order.clientName ?? text.noClient} · {order.carrier}
                </span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ×{order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </label>
          ))}
          {orders.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">{text.noOrders}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {selectedIds.length} {text.selected}
        </p>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {text.cancel}
          </DialogClose>
          <Button type="button" variant="outline" disabled={selectedIds.length === 0} onClick={() => print("thermal")}>
            <ReceiptText data-icon="inline-start" />
            {text.thermal}
          </Button>
          <Button type="button" disabled={selectedIds.length === 0} onClick={() => print("a4")}>
            <FileText data-icon="inline-start" />
            {text.a4}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
