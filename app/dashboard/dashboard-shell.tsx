"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
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
  Package,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Users,
  WalletCards,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { PlutosLogo, PlutosMark } from "@/components/plutos-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logout } from "./actions";
import { LanguageSwitcher } from "./language-switcher";
import { dashboardCopy, type DashboardLanguage } from "./language";

const navigation = [
  { copyKey: "dashboard", icon: LayoutDashboard, href: "/dashboard", expandable: false },
  { copyKey: "clients", icon: Users, href: "/dashboard/clients", expandable: false },
  { copyKey: "activeOrders", icon: ShoppingCart, href: "/dashboard/orders", expandable: false },
  { copyKey: "articles", icon: Package, href: "/dashboard/articles", expandable: false },
  { copyKey: "stock", icon: PackageOpen, href: "/dashboard/stock", expandable: false },
  { copyKey: "projectManagement", icon: FolderKanban, href: null, expandable: true },
  { copyKey: "todos", icon: CheckSquare2, href: "/dashboard/todos", expandable: false },
  { copyKey: "invoices", icon: ClipboardList, href: "/dashboard/invoices", expandable: false },
  { copyKey: "contracts", icon: FileSignature, href: null, expandable: true },
  { copyKey: "payments", icon: WalletCards, href: null, expandable: true },
  { copyKey: "calendar", icon: CalendarDays, href: null, expandable: true },
  { copyKey: "notes", icon: Blocks, href: null, expandable: true },
  { copyKey: "settings", icon: Settings2, href: "/dashboard/settings", expandable: false },
] as const;

export type DashboardSection = (typeof navigation)[number]["copyKey"];

function getActiveSection(pathname: string): DashboardSection {
  if (pathname.startsWith("/dashboard/clients")) return "clients";
  if (pathname.startsWith("/dashboard/orders")) return "activeOrders";
  if (pathname.startsWith("/dashboard/articles")) return "articles";
  if (pathname.startsWith("/dashboard/stock")) return "stock";
  if (pathname.startsWith("/dashboard/todos")) return "todos";
  if (pathname.startsWith("/dashboard/invoices")) return "invoices";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  if (pathname.startsWith("/dashboard/projects")) return "projectManagement";
  return "dashboard";
}

const projects = [
  { copyKey: "designEngineering", icon: Blocks, href: null },
  { copyKey: "salesMarketing", icon: CreditCard, href: null },
  { copyKey: "travel", icon: CalendarDays, href: null },
  {
    copyKey: "securityPrinting",
    icon: ShieldCheck,
    href: "/dashboard/projects/security-printing",
  },
] as const;

function NavigationPanel({
  email,
  collapsed = false,
  onCollapse,
  mobile = false,
  language,
  activeSection,
}: {
  email: string;
  collapsed?: boolean;
  onCollapse?: () => void;
  mobile?: boolean;
  language: DashboardLanguage;
  activeSection: DashboardSection;
}) {
  const initials = email.slice(0, 2).toUpperCase();
  const copy = dashboardCopy[language];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        className={cn(
          "flex h-[73px] shrink-0 items-center gap-3 px-4",
          mobile && "h-16",
          collapsed && "gap-1 px-2",
        )}
      >
        <Link
          href="/dashboard"
          prefetch={false}
          className={cn(
            "flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            !collapsed && "flex-1",
          )}
          aria-label={collapsed ? copy.dashboard : undefined}
        >
          {collapsed ? (
            <PlutosMark eager />
          ) : (
            <div className="min-w-0 flex-1">
              <PlutosLogo className="w-36" eager />
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{copy.workspace}</p>
            </div>
          )}
        </Link>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(collapsed && "ml-auto")}
            aria-label={collapsed ? copy.openNavigation : copy.collapseSidebar}
            aria-pressed={collapsed}
            aria-keyshortcuts="Control+B Meta+B"
            onClick={onCollapse}
            title={collapsed ? copy.openNavigation : copy.collapseSidebar}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        <nav className={cn("space-y-1 px-3", collapsed && "px-2")} aria-label={copy.mainNavigation}>
          {navigation.map(({ copyKey, icon: Icon, href, expandable }) => {
            const active = activeSection === copyKey;
            const content = (
              <>
                <Icon data-icon={collapsed ? undefined : "inline-start"} />
                {!collapsed && <span className="truncate">{copy[copyKey]}</span>}
                {!collapsed && expandable && <ChevronRight className="ml-auto" />}
              </>
            );
            const sharedProps = {
              className: cn(
                "w-full justify-start",
                mobile && "h-9 gap-3 px-3 text-sm",
                collapsed && "justify-center px-0",
              ),
              "aria-label": collapsed ? copy[copyKey] : undefined,
              "aria-current": active ? ("page" as const) : undefined,
              title: collapsed ? copy[copyKey] : undefined,
            };

            return href ? (
              <Button
                key={copyKey}
                render={
                  <Link
                    href={href}
                    prefetch={false}
                    target={copyKey === "invoices" ? "_blank" : undefined}
                    rel={copyKey === "invoices" ? "noopener noreferrer" : undefined}
                  />
                }
                nativeButton={false}
                variant={active ? "secondary" : "ghost"}
                {...sharedProps}
              >
                {content}
              </Button>
            ) : (
              <Button key={copyKey} variant={active ? "secondary" : "ghost"} {...sharedProps}>
                {content}
              </Button>
            );
          })}
          {!collapsed && (
            <LanguageSwitcher
              language={language}
              label={copy.language}
              englishLabel={copy.english}
              frenchLabel={copy.french}
            />
          )}
        </nav>

        <Separator className="my-4" />
        {!collapsed && <div className="px-4 text-xs font-medium text-muted-foreground">{copy.projects}</div>}
        <nav className={cn("mt-2 space-y-1 px-3", collapsed && "px-2")} aria-label={copy.projects}>
          {projects.map(({ copyKey, icon: Icon, href }) => {
            const content = (
              <>
                <Icon data-icon={collapsed ? undefined : "inline-start"} />
                {!collapsed && <span className="truncate">{copy[copyKey]}</span>}
              </>
            );
            const sharedProps = {
              className: cn(
                "w-full justify-start",
                mobile && "h-9 gap-3 px-3 text-sm",
                collapsed && "justify-center px-0",
              ),
              "aria-label": collapsed ? copy[copyKey] : undefined,
              title: collapsed ? copy[copyKey] : undefined,
            };

            return href ? (
              <Button
                key={copyKey}
                render={<Link href={href} prefetch={false} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
                variant="ghost"
                {...sharedProps}
              >
                {content}
              </Button>
            ) : (
              <Button key={copyKey} variant="ghost" {...sharedProps}>
                {content}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              mobile && "h-9 gap-3 px-3 text-sm",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? copy.more : undefined}
            title={collapsed ? copy.more : undefined}
          >
            <MoreHorizontal data-icon={collapsed ? undefined : "inline-start"} />
            {!collapsed && copy.more}
          </Button>
        </nav>
      </div>

      <div className={cn("shrink-0 space-y-2 p-3", collapsed && "px-2")}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            mobile && "h-9 gap-3 px-3 text-sm",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? copy.helpCenter : undefined}
          title={collapsed ? copy.helpCenter : undefined}
        >
          <CircleHelp data-icon={collapsed ? undefined : "inline-start"} />
          {!collapsed && copy.helpCenter}
        </Button>

        {collapsed ? (
          <div className="flex flex-col items-center gap-1 border-t pt-2">
            <Avatar size="sm" title={email}>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <form action={logout}>
              <Button variant="ghost" size="icon-sm" type="submit" aria-label={copy.signOut} title={copy.signOut}>
                <ChevronRight />
              </Button>
            </form>
          </div>
        ) : (
          <Card size="sm" className="gap-2 bg-background py-2">
            <CardContent className="flex items-center gap-2 px-2">
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{copy.signedIn}</p>
                <p className="truncate text-[11px] text-muted-foreground">{email}</p>
              </div>
              <form action={logout}>
                <Button variant="ghost" size="icon-sm" type="submit" aria-label={copy.signOut}>
                  <ChevronRight />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MobileNavigation({
  email,
  language,
  activeSection,
}: {
  email: string;
  language: DashboardLanguage;
  activeSection: DashboardSection;
}) {
  const copy = dashboardCopy[language];

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" aria-label={copy.openNavigation} />}>
        <Menu />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="gap-0 p-0 data-[side=left]:w-[min(20rem,calc(100vw-1rem))] data-[side=left]:sm:max-w-80"
      >
        <SheetTitle className="sr-only">{copy.mainNavigation}</SheetTitle>
        <NavigationPanel email={email} language={language} activeSection={activeSection} mobile />
      </SheetContent>
    </Sheet>
  );
}

function Toolbar({
  email,
  language,
  activeSection,
}: {
  email: string;
  language: DashboardLanguage;
  activeSection: DashboardSection;
}) {
  const copy = dashboardCopy[language];

  return (
    <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3 print:hidden sm:px-6">
      <MobileNavigation email={email} language={language} activeSection={activeSection} />
      <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder={copy.search} aria-label={copy.search} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label={copy.notifications}>
          <Bell />
        </Button>
        <Button variant="outline" size="icon" aria-label={copy.toggleTheme}>
          <Sun />
        </Button>
        <AvatarGroup className="hidden sm:flex">
          {["AN", "MK", "JR", "SL"].map((name) => (
            <Avatar key={name} size="sm">
              <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <Button variant="outline" className="hidden sm:inline-flex">
          <Plus data-icon="inline-start" />
          {copy.invite}
        </Button>
      </div>
    </header>
  );
}

export function DashboardShell({
  email,
  language,
  children,
}: {
  email: string;
  language: DashboardLanguage;
  children: ReactNode;
}) {
  const activeSection = getActiveSection(usePathname());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const toggleSidebar = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setCollapsed((value) => !value);
      }
    };

    window.addEventListener("keydown", toggleSidebar);
    return () => window.removeEventListener("keydown", toggleSidebar);
  }, []);

  return (
    <main className="min-h-dvh bg-background" lang={language}>
      <div className="flex min-h-dvh w-full bg-background">
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-muted/35 transition-[width] duration-200 ease-out print:hidden lg:flex",
            collapsed ? "w-20" : "w-[248px]",
          )}
        >
          <NavigationPanel
            email={email}
            language={language}
            activeSection={activeSection}
            collapsed={collapsed}
            onCollapse={() => setCollapsed((value) => !value)}
          />
        </aside>

        <div className="min-h-dvh min-w-0 flex-1">
          <Toolbar email={email} language={language} activeSection={activeSection} />
          {children}
        </div>
      </div>
    </main>
  );
}
