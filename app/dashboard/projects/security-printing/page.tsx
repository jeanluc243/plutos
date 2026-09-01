import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../../dashboard-shell";
import {
  isDashboardLanguage,
  type DashboardLanguage,
} from "../../language";

export const metadata: Metadata = { title: "Security Printing" };

export default async function SecurityPrintingPage() {
  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get("plutos-language")?.value ?? "en";
  const language: DashboardLanguage = isDashboardLanguage(savedLanguage)
    ? savedLanguage
    : "en";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const description =
    language === "fr"
      ? "Espace de travail du projet d’impression sécurisée."
      : "Secure printing project workspace.";

  return (
    <DashboardShell
      email={user.email ?? "member@plutos.app"}
      language={language}
      activeSection="projectManagement"
    >
      <div className="min-h-[calc(100dvh-73px)] bg-muted/20 p-4 sm:p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle className="text-xl">Security Printing</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    </DashboardShell>
  );
}
