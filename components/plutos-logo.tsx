import Image from "next/image";

import { cn } from "@/lib/utils";

type PlutosBrandProps = {
  className?: string;
  eager?: boolean;
};

type PlutosLogoProps = PlutosBrandProps & {
  /** Use light for light surfaces, including paper, or monochrome for thermal printing. */
  appearance?: "auto" | "light" | "monochrome";
};

export function PlutosLogo({
  className,
  appearance = "auto",
  eager = false,
}: PlutosLogoProps) {
  return (
    <span
      role="img"
      aria-label="Plutos"
      className={cn("inline-block aspect-[4/1] w-40 max-w-full shrink-0 align-middle", className)}
    >
      <Image
        src={appearance === "monochrome" ? "/brand/plutos-logo-monochrome.svg" : "/brand/plutos-logo.svg"}
        alt=""
        width={1280}
        height={320}
        sizes="176px"
        loading={eager ? "eager" : "lazy"}
        unoptimized={appearance !== "auto"}
        className={cn("block h-auto w-full", appearance === "auto" && "dark:hidden dark:print:block")}
      />
      {appearance === "auto" && (
        <Image
          src="/brand/plutos-logo-light.svg"
          alt=""
          width={1280}
          height={320}
          sizes="176px"
          loading={eager ? "eager" : "lazy"}
          className="hidden h-auto w-full dark:block dark:print:hidden"
        />
      )}
    </span>
  );
}

export function PlutosMark({ className, eager = false }: PlutosBrandProps) {
  return (
    <Image
      src="/brand/plutos-mark.svg"
      alt="Plutos"
      width={512}
      height={512}
      sizes="32px"
      loading={eager ? "eager" : "lazy"}
      className={cn("aspect-square size-8 shrink-0 object-contain", className)}
    />
  );
}
