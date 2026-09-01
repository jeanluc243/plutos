import {
  AE,
  AO,
  BE,
  CD,
  CN,
  DE,
  FR,
  GB,
  ID,
  IN,
  KE,
  MY,
  RW,
  SG,
  TH,
  TR,
  TZ,
  UG,
  US,
  ZA,
  ZM,
} from "country-flag-icons/react/3x2";

import { cn } from "@/lib/utils";

const flagComponents = {
  AE,
  AO,
  BE,
  CD,
  CN,
  DE,
  FR,
  GB,
  ID,
  IN,
  KE,
  MY,
  RW,
  SG,
  TH,
  TR,
  TZ,
  UG,
  US,
  ZA,
  ZM,
} as const;

export function CountryFlag({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const normalizedCode = code.toUpperCase() as keyof typeof flagComponents;
  const Flag = flagComponents[normalizedCode];

  if (!Flag) {
    return (
      <span
        className={cn(
          "inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-sm border bg-muted text-[8px] font-semibold text-muted-foreground",
          className,
        )}
        aria-label={label ?? code}
      >
        {normalizedCode}
      </span>
    );
  }

  return (
    <Flag
      className={cn("h-4 w-6 shrink-0 object-cover", className)}
      aria-label={label ?? normalizedCode}
      role="img"
    />
  );
}
