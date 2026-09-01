"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setDashboardLanguage } from "./actions";
import type { DashboardLanguage } from "./language";

type LanguageSwitcherProps = {
  language: DashboardLanguage;
  label: string;
  englishLabel: string;
  frenchLabel: string;
};

export function LanguageSwitcher({
  language,
  label,
  englishLabel,
  frenchLabel,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLanguage(value: string | null) {
    if (value !== "en" && value !== "fr") return;

    startTransition(async () => {
      await setDashboardLanguage(value);
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5 px-1">
      <div className="flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
        <Languages className="size-3.5" />
        <span>{label}</span>
      </div>
      <Select value={language} onValueChange={changeLanguage} disabled={isPending}>
        <SelectTrigger className="w-full bg-background" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="en">🇬🇧 {englishLabel}</SelectItem>
          <SelectItem value="fr">🇫🇷 {frenchLabel}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
