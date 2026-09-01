"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  MessageCircle,
  Phone,
  Search,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { dashboardCopy, type DashboardLanguage } from "../language";
import { ClientDetailSheet } from "./client-detail-sheet";
import { CreateClientDialog } from "./create-client-dialog";

export type ClientRecord = {
  id: string;
  name: string;
  phone: string;
  hasWhatsApp: boolean;
  createdAt: string;
};

type WhatsAppFilter = "all" | "yes" | "no";
type DateFilter = "all" | "7" | "30";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ClientsTable({
  clients,
  language,
}: {
  clients: ClientRecord[];
  language: DashboardLanguage;
}) {
  const copy = dashboardCopy[language];
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [query, setQuery] = useState("");
  const [whatsAppFilter, setWhatsAppFilter] = useState<WhatsAppFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [dateCutoff, setDateCutoff] = useState<number | null>(null);
  const [descending, setDescending] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [detailClient, setDetailClient] = useState<ClientRecord | null>(null);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return clients
      .filter((client) => {
        const matchesSearch =
          !normalizedQuery ||
          client.name.toLocaleLowerCase(locale).includes(normalizedQuery) ||
          client.phone.includes(normalizedQuery);
        const matchesWhatsApp =
          whatsAppFilter === "all" ||
          (whatsAppFilter === "yes" ? client.hasWhatsApp : !client.hasWhatsApp);
        const matchesDate =
          dateCutoff === null || new Date(client.createdAt).getTime() >= dateCutoff;

        return matchesSearch && matchesWhatsApp && matchesDate;
      })
      .toSorted((first, second) => {
        const difference =
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
        return descending ? difference : -difference;
      });
  }, [clients, dateCutoff, descending, locale, query, whatsAppFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleClients = filteredClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const allVisibleSelected =
    visibleClients.length > 0 && visibleClients.every((client) => selected.has(client.id));

  function updateWhatsAppFilter(value: string | null) {
    if (value !== "all" && value !== "yes" && value !== "no") return;
    setWhatsAppFilter(value);
    setPage(1);
  }

  function updateDateFilter(value: string | null) {
    if (value !== "all" && value !== "7" && value !== "30") return;
    setDateFilter(value);
    setDateCutoff(value === "all" ? null : Date.now() - Number(value) * 86_400_000);
    setPage(1);
  }

  function updatePageSize(value: string | null) {
    if (!value) return;
    setPageSize(Number(value));
    setPage(1);
  }

  function toggleVisibleClients(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      visibleClients.forEach((client) => {
        if (checked) next.add(client.id);
        else next.delete(client.id);
      });
      return next;
    });
  }

  function toggleClient(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function exportClients() {
    const header = [copy.client, copy.phone, copy.whatsapp, copy.joined];
    const rows = filteredClients.map((client) => [
      client.name,
      client.phone,
      client.hasWhatsApp ? copy.yes : copy.no,
      new Date(client.createdAt).toLocaleString(locale),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clients.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Card className="m-4 gap-0 py-0 sm:m-6">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-xl font-semibold">
          {clients.length.toLocaleString(locale)} {copy.clients}
        </CardTitle>
        <CardDescription>{copy.clientRecordsDescription}</CardDescription>
        <CardAction className="flex items-center gap-2">
          <Button variant="outline" onClick={exportClients} disabled={filteredClients.length === 0}>
            <Download data-icon="inline-start" />
            {copy.export}
          </Button>
          <CreateClientDialog language={language} />
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="pl-9"
              placeholder={copy.searchClients}
              aria-label={copy.searchClients}
            />
          </div>

          <Select value={whatsAppFilter} onValueChange={updateWhatsAppFilter}>
            <SelectTrigger className="min-w-44" aria-label={copy.whatsapp}>
              <MessageCircle />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">{copy.allWhatsAppStatuses}</SelectItem>
              <SelectItem value="yes">{copy.withWhatsApp}</SelectItem>
              <SelectItem value="no">{copy.withoutWhatsApp}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={updateDateFilter}>
            <SelectTrigger className="min-w-36" aria-label={copy.joined}>
              <CalendarDays />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">{copy.allDates}</SelectItem>
              <SelectItem value="7">{copy.lastSevenDays}</SelectItem>
              <SelectItem value="30">{copy.lastThirtyDays}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="sm:ml-auto"
            onClick={() => setDescending((value) => !value)}
          >
            {descending ? <ArrowDownAZ data-icon="inline-start" /> : <ArrowUpAZ data-icon="inline-start" />}
            {copy.sort}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12 pl-4">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleVisibleClients}
                    aria-label={copy.selectedRows}
                  />
                </TableHead>
                <TableHead>{copy.client}</TableHead>
                <TableHead>{copy.whatsapp}</TableHead>
                <TableHead>{copy.phone}</TableHead>
                <TableHead>{copy.joined}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    {copy.noClients}
                  </TableCell>
                </TableRow>
              ) : (
                visibleClients.map((client) => {
                  const createdAt = new Date(client.createdAt);

                  return (
                    <TableRow key={client.id} data-state={selected.has(client.id) ? "selected" : undefined}>
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selected.has(client.id)}
                          onCheckedChange={(checked) => toggleClient(client.id, checked)}
                          aria-label={client.name}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0 text-left shadow-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0"
                          onClick={() => setDetailClient(client)}
                          aria-label={`${copy.client}: ${client.name}`}
                        >
                          <Avatar className="size-9 rounded-lg after:hidden">
                            <AvatarFallback className="rounded-lg">{initials(client.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{client.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">#{client.id.slice(0, 8)}</p>
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {client.hasWhatsApp ? (
                            <CheckCircle2 className="text-primary" />
                          ) : (
                            <Phone className="text-muted-foreground" />
                          )}
                          {client.hasWhatsApp ? copy.yes : copy.no}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{client.phone}</TableCell>
                      <TableCell>
                        <p>{createdAt.toLocaleDateString(locale, { dateStyle: "medium" })}</p>
                        <p className="text-xs text-muted-foreground">
                          {createdAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-3 bg-background">
        <p className="mr-auto text-sm text-muted-foreground">
          {selected.size} {copy.of} {filteredClients.length} {copy.selectedRows}.
        </p>
        <span className="text-sm font-medium">{copy.rowsPerPage}</span>
        <Select value={String(pageSize)} onValueChange={updatePageSize}>
          <SelectTrigger className="w-20" aria-label={copy.rowsPerPage}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {[5, 10, 20].map((size) => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="min-w-24 text-center text-sm font-medium">
          {copy.page} {currentPage} {copy.of} {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={currentPage === 1} aria-label={copy.firstPage}>
            <ChevronsLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label={copy.previousPage}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} aria-label={copy.nextPage}>
            <ChevronRight />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} aria-label={copy.lastPage}>
            <ChevronsRight />
          </Button>
        </div>
      </CardFooter>
      </Card>
      <ClientDetailSheet
        client={detailClient}
        language={language}
        onClose={() => setDetailClient(null)}
      />
    </>
  );
}
