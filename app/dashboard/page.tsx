import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowDownToLine,
  Bell,
  CalendarDays,
  CreditCard,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getUserPriceSettings } from "@/lib/db/user-settings";
import { formatPrice, type PriceSettings } from "@/lib/pricing";
import { DashboardShell } from "./dashboard-shell";
import {
  dashboardCopy,
  isDashboardLanguage,
  type DashboardCopy,
  type DashboardLanguage,
} from "./language";

export const metadata: Metadata = { title: "Dashboard" };

const metrics = [
  { labelKey: "totalRevenue", amountUsd: 45231.89, value: null, changeKey: "lastMonth20", icon: WalletCards },
  { labelKey: "subscriptions", amountUsd: null, value: "+2,350", changeKey: "lastMonth180", icon: Users },
  { labelKey: "sales", amountUsd: null, value: "+12,234", changeKey: "lastMonth19", icon: CreditCard },
  { labelKey: "activeNow", amountUsd: null, value: "+573", changeKey: "sinceLastMonth", icon: Bell },
] as const;

const pipeline = [
  { labelKey: "lead", value: 92, count: "286 (83%)" },
  { labelKey: "qualified", value: 58, count: "173 (62%)" },
  { labelKey: "proposal", value: 76, count: "149 (51%)" },
  { labelKey: "negotiation", value: 64, count: "82 (29%)" },
] as const;

const chart = [
  { month: "Jan", value: 68 },
  { month: "Feb", value: 49 },
  { month: "Mar", value: 28 },
  { month: "Apr", value: 43 },
  { month: "May", value: 96 },
  { month: "Jun", value: 49 },
  { month: "Jul", value: 41 },
  { month: "Aug", value: 58 },
  { month: "Sep", value: 27 },
  { month: "Oct", value: 27 },
  { month: "Nov", value: 68 },
  { month: "Dec", value: 36 },
];

const recentProjects = [
  { name: "Mobile banking redesign", client: "Northstar Labs", statusKey: "inProgress", priorityKey: "high", budgetUsd: 18400 },
  { name: "Analytics dashboard", client: "Vertex Group", statusKey: "review", priorityKey: "medium", budgetUsd: 12850 },
  { name: "Brand system refresh", client: "Aperture Co.", statusKey: "completed", priorityKey: "low", budgetUsd: 9600 },
] as const;

function MetricCards({
  copy,
  priceSettings,
  locale,
}: {
  copy: DashboardCopy;
  priceSettings: PriceSettings;
  locale: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {metrics.map(({ labelKey, value, amountUsd, changeKey, icon: Icon }) => (
        <Card key={labelKey} size="sm" className="min-h-32">
          <CardHeader>
            <CardTitle className="text-sm">{copy[labelKey]}</CardTitle>
            <CardAction>
              <Icon className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">
              {amountUsd === null
                ? value
                : formatPrice(amountUsd, priceSettings, locale)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{copy[changeKey]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PipelineCard({ copy }: { copy: DashboardCopy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.leadsToClients}</CardTitle>
        <CardDescription>{copy.deployProject}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">{copy.viewAll}</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {pipeline.map((item) => (
          <Progress key={item.labelKey} value={item.value}>
            <div className="flex w-full items-center justify-between text-xs font-medium">
              <span>{copy[item.labelKey]}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
          </Progress>
        ))}
      </CardContent>
    </Card>
  );
}

function OverviewChart({ copy }: { copy: DashboardCopy }) {
  return (
    <Card className="min-h-[330px] lg:col-span-2">
      <CardHeader>
        <CardTitle>{copy.overview}</CardTitle>
        <CardDescription>{copy.monthlyRevenue}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-56 items-end gap-2 sm:gap-3">
        {chart.map((item) => (
          <div key={item.month} className="flex h-52 min-w-0 flex-1 flex-col justify-end gap-2">
            <div
              className="w-full rounded-md bg-primary transition-opacity hover:opacity-80"
              style={{ height: `${item.value}%` }}
              title={`${item.month}: ${item.value}%`}
            />
            <span className="text-center text-[10px] text-muted-foreground sm:text-xs">{item.month}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TasksCard({ copy }: { copy: DashboardCopy }) {
  const tasks = [
    [copy.prepareProposal, copy.dueToday],
    [copy.reviewContracts, copy.dueTomorrow],
    [copy.sendInvoices, copy.dueFriday],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.todoLists}</CardTitle>
        <CardDescription>{copy.manageWork}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {tasks.map(([title, subtitle], index) => (
          <div key={title} className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <Switch defaultChecked={index !== 1} aria-label={title} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentProjects({
  copy,
  priceSettings,
  locale,
}: {
  copy: DashboardCopy;
  priceSettings: PriceSettings;
  locale: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{copy.recentProjects}</CardTitle>
        <CardDescription>{copy.trackWork}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            <SlidersHorizontal data-icon="inline-start" />
            {copy.view}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={copy.filterProjects} aria-label={copy.filterProjects} />
          </div>
          <Button variant="outline" size="sm"><Plus data-icon="inline-start" />{copy.status}</Button>
          <Button variant="outline" size="sm"><Plus data-icon="inline-start" />{copy.priority}</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.project}</TableHead>
              <TableHead>{copy.client}</TableHead>
              <TableHead>{copy.status}</TableHead>
              <TableHead>{copy.priority}</TableHead>
              <TableHead className="text-right">{copy.budget}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentProjects.map((project) => (
              <TableRow key={project.name}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="text-muted-foreground">{project.client}</TableCell>
                <TableCell><Badge variant="secondary">{copy[project.statusKey]}</Badge></TableCell>
                <TableCell><Badge variant="outline">{copy[project.priorityKey]}</Badge></TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(project.budgetUsd, priceSettings, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get("plutos-language")?.value ?? "en";
  const language: DashboardLanguage = isDashboardLanguage(savedLanguage)
    ? savedLanguage
    : "en";
  const copy = dashboardCopy[language];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const priceSettings = await getUserPriceSettings(user.id);
  const locale = language === "fr" ? "fr-FR" : "en-US";

  return (
    <DashboardShell email={user.email ?? "member@plutos.app"} language={language}>
      <div className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{copy.workspaceOverview}</p>
                <h1 className="text-3xl font-semibold tracking-tight">{copy.dashboard}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline">
                  <CalendarDays data-icon="inline-start" />
                  Oct 17, 2024 – Nov 6, 2024
                </Button>
                <Button>
                  <ArrowDownToLine data-icon="inline-start" />
                  {copy.download}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">{copy.overview}</TabsTrigger>
                <TabsTrigger value="analytics">{copy.analytics}</TabsTrigger>
                <TabsTrigger value="reports">{copy.reports}</TabsTrigger>
                <TabsTrigger value="notifications">{copy.notifications}</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-2 space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
              <MetricCards copy={copy} priceSettings={priceSettings} locale={locale} />
                  <PipelineCard copy={copy} />
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <OverviewChart copy={copy} />
                  <TasksCard copy={copy} />
                </div>
            <RecentProjects copy={copy} priceSettings={priceSettings} locale={locale} />
              </TabsContent>
              {(['analytics', 'reports', 'notifications'] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{copy[tab]}</CardTitle>
                      <CardDescription>{copy.sectionReady}</CardDescription>
                    </CardHeader>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
      </div>
    </DashboardShell>
  );
}
