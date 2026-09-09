import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ArticleThumbnail({
  src,
  alt,
  fallback,
  className,
  sizes = "56px",
}: {
  src?: string;
  alt: string;
  fallback: ReactNode;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/20 text-muted-foreground",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          className="object-cover"
        />
      ) : (
        fallback
      )}
    </div>
  );
}
