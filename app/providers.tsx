"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      color="var(--primary)"
      height="3px"
      delay={100}
      stopDelay={100}
      options={{ showSpinner: false }}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ProgressProvider>
  );
}
