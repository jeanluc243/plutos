import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowDownToLine,
  Bell,
  Blocks,
  CalendarDays,
  CheckSquare2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileSignature,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sun,
  Users,
  WalletCards,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
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
import { logout } from "./actions";

export const metadata: Metadata = { title: "Dashboard" };

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Clients", icon: Users },
  { label: "Project management", icon: FolderKanban, expandable: true },
  { label: "To-do's", icon: CheckSquare2, expandable: true },
  { label: "Invoices", icon: ClipboardList, expandable: true },
  { label: "Contracts", icon: FileSignature, expandable: true },
  { label: "Payments", icon: WalletCards, expandable: true },
  { label: "Calendar / Meetings", icon: CalendarDays, expandable: true },
  { label: "Notes", icon: Blocks, expandable: true },
  { label: "Settings", icon: Settings2, expandable: true },
];

const projects = [
  { label: "Design Engineering", icon: Blocks },
  { label: "Sales & Marketing", icon: CreditCard },
  { label: "Travel", icon: CalendarDays },
];

const metrics = [
  { label: "Total revenue", value: "$45,231.89", change: "+20.1% from last month", icon: WalletCards },
  { label: "Subscriptions", value: "+2,350", change: "+180.1% from last month", icon: Users },
  { label: "Sales", value: "+12,234", change: "+19% from last month", icon: CreditCard },
  { label: "Active now", value: "+573", change: "+201 since last month", icon: Bell },
];

const pipeline = [
  { label: "Lead", value: 92, count: "286 (83%)" },
  { label: "Qualified", value: 58, count: "173 (62%)" },
  { label: "Proposal", value: 76, count: "149 (51%)" },
  { label: "Negotiation", value: 64, count: "82 (29%)" },
];

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
  { name: "Mobile banking redesign", client: "Northstar Labs", status: "In progress", priority: "High", budget: "$18,400" },
  { name: "Analytics dashboard", client: "Vertex Group", status: "Review", priority: "Medium", budget: "$12,850" },
  { name: "Brand system refresh", client: "Aperture Co.", status: "Completed", priority: "Low", budget: "$9,600" },
];

function BrandMark() {
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
      <span className="absolute -left-1 size-6 rounded-full border-4 border-primary-foreground" />
      <span className="absolute right-1.5 bottom-1.5 size-1.5 rounded-full bg-primary-foreground" />
    </span>
  );
}

function Sidebar({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r bg-muted/35 lg:flex">
      <div className="flex items-center gap-3 px-4 py-5">
        <BrandMark />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Plutos</p>
          <p className="truncate text-xs text-muted-foreground">Workspace</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar">
          <PanelLeft />
        </Button>
      </div>

      <nav className="space-y-1 px-3" aria-label="Main navigation">
        {navigation.map(({ label, icon: Icon, active, expandable }) => (
          <Button
            key={label}
            variant={active ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Icon data-icon="inline-start" />
            <span className="truncate">{label}</span>
            {expandable && <ChevronRight className="ml-auto" />}
          </Button>
        ))}
      </nav>

      <Separator className="my-4" />
      <div className="px-4 text-xs font-medium text-muted-foreground">Projects</div>
      <nav className="mt-2 space-y-1 px-3" aria-label="Projects">
        {projects.map(({ label, icon: Icon }) => (
          <Button key={label} variant="ghost" className="w-full justify-start">
            <Icon data-icon="inline-start" />
            <span className="truncate">{label}</span>
          </Button>
        ))}
        <Button variant="ghost" className="w-full justify-start">
          <MoreHorizontal data-icon="inline-start" />
          More
        </Button>
      </nav>

      <div className="mt-auto space-y-2 p-3">
        <Button variant="ghost" className="w-full justify-start">
          <CircleHelp data-icon="inline-start" />
          Help center
        </Button>
        <Card size="sm" className="gap-2 bg-background py-2">
          <CardContent className="flex items-center gap-2 px-2">
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">Signed in</p>
              <p className="truncate text-[11px] text-muted-foreground">{email}</p>
            </div>
            <form action={logout}>
              <Button variant="ghost" size="icon-sm" type="submit" aria-label="Sign out">
                <ChevronRight />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}

function Toolbar() {
  return (
    <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-6">
      <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
        <Menu />
      </Button>
      <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search" aria-label="Search" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
        <Button variant="outline" size="icon" aria-label="Toggle theme">
          <Sun />
        </Button>
        <AvatarGroup className="hidden sm:flex">
          {['AN', 'MK', 'JR', 'SL'].map((name) => (
            <Avatar key={name} size="sm">
              <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <Button variant="outline" className="hidden sm:inline-flex">
          <Plus data-icon="inline-start" />
          Invite
        </Button>
      </div>
    </header>
  );
}

function MetricCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {metrics.map(({ label, value, change, icon: Icon }) => (
        <Card key={label} size="sm" className="min-h-32">
          <CardHeader>
            <CardTitle className="text-sm">{label}</CardTitle>
            <CardAction>
              <Icon className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PipelineCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads-to-clients</CardTitle>
        <CardDescription>Deploy your next project in one click.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">View all</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {pipeline.map((item) => (
          <Progress key={item.label} value={item.value}>
            <div className="flex w-full items-center justify-between text-xs font-medium">
              <span>{item.label}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
          </Progress>
        ))}
      </CardContent>
    </Card>
  );
}

function OverviewChart() {
  return (
    <Card className="min-h-[330px] lg:col-span-2">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Monthly revenue performance</CardDescription>
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

function TasksCard() {
  const tasks = [
    ["Prepare client proposal", "Due today"],
    ["Review new contracts", "Due tomorrow"],
    ["Send weekly invoices", "Due Friday"],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>To-do lists</CardTitle>
        <CardDescription>Manage today&apos;s work here.</CardDescription>
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

function RecentProjects() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent projects</CardTitle>
        <CardDescription>Track your latest client work.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            <SlidersHorizontal data-icon="inline-start" />
            View
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Filter projects..." aria-label="Filter projects" />
          </div>
          <Button variant="outline" size="sm"><Plus data-icon="inline-start" />Status</Button>
          <Button variant="outline" size="sm"><Plus data-icon="inline-start" />Priority</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Budget</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentProjects.map((project) => (
              <TableRow key={project.name}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="text-muted-foreground">{project.client}</TableCell>
                <TableCell><Badge variant="secondary">{project.status}</Badge></TableCell>
                <TableCell><Badge variant="outline">{project.priority}</Badge></TableCell>
                <TableCell className="text-right font-medium">{project.budget}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="min-h-dvh bg-muted/50 p-2 sm:p-4 xl:p-8">
      <div className="mx-auto flex min-h-[calc(100dvh-16px)] max-w-[1400px] overflow-hidden rounded-2xl bg-background shadow-sm ring-1 ring-foreground/10 sm:min-h-[calc(100dvh-32px)] xl:min-h-[calc(100dvh-64px)]">
        <Sidebar email={user.email ?? "member@plutos.app"} />

        <div className="min-w-0 flex-1">
          <Toolbar />
          <div className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Workspace overview</p>
                <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline">
                  <CalendarDays data-icon="inline-start" />
                  Oct 17, 2024 – Nov 6, 2024
                </Button>
                <Button>
                  <ArrowDownToLine data-icon="inline-start" />
                  Download
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-2 space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
                  <MetricCards />
                  <PipelineCard />
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <OverviewChart />
                  <TasksCard />
                </div>
                <RecentProjects />
              </TabsContent>
              {['analytics', 'reports', 'notifications'].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="capitalize">{tab}</CardTitle>
                      <CardDescription>This section is ready for your live data.</CardDescription>
                    </CardHeader>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
