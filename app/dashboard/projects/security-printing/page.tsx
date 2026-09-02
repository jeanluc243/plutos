import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardContext } from "../../dashboard-context";

export const metadata: Metadata = { title: "Security Printing" };

export default async function SecurityPrintingPage() {
  const { language } = await getDashboardContext();

  const description =
    language === "fr"
      ? "Espace de travail du projet d’impression sécurisée."
      : "Secure printing project workspace.";

  return (
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
  );
}
