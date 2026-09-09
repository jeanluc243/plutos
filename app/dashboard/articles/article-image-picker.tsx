"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArticleThumbnail } from "./article-thumbnail";

export type PendingArticleImage = {
  id: string;
  name: string;
  dataUrl: string;
};

const maximumImages = 8;
const maximumFileSize = 1_000_000;

type ImagePickerCopy = {
  choose: string;
  drop: string;
  paste: string;
  format: string;
  invalidType: string;
  tooLarge: string;
  tooMany: string;
  remove: string;
};

export function ArticleImagePicker({
  copy,
  images,
  onImagesChange,
}: {
  copy: ImagePickerCopy;
  images: PendingArticleImage[];
  onImagesChange: (images: PendingArticleImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(async (files: File[]) => {
    const pngFiles = files.filter((file) => file.type === "image/png");
    if (pngFiles.length !== files.length) {
      setError(copy.invalidType);
      return;
    }
    if (pngFiles.some((file) => file.size > maximumFileSize)) {
      setError(copy.tooLarge);
      return;
    }
    if (images.length + pngFiles.length > maximumImages) {
      setError(copy.tooMany);
      return;
    }

    const nextImages = await Promise.all(
      pngFiles.map(
        (file) =>
          new Promise<PendingArticleImage>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              id: crypto.randomUUID(),
              name: file.name || "image.png",
              dataUrl: String(reader.result),
            });
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );

    setError(null);
    onImagesChange([...images, ...nextImages]);
  }, [copy, images, onImagesChange]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? []).filter(
        (file) => file.type.startsWith("image/"),
      );
      if (files.length === 0) return;
      event.preventDefault();
      void addFiles(files);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addFiles]);

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/png"
        multiple
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {images.map((image) => (
        <input key={image.id} type="hidden" name="images" value={image.dataUrl} />
      ))}

      <div
        className={cn(
          "flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-4 py-5 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ImagePlus className="size-5" />
        </span>
        <div>
          <p className="font-medium">{copy.drop}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.paste}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload data-icon="inline-start" />
          {copy.choose}
        </Button>
        <p className="text-xs text-muted-foreground">{copy.format}</p>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="relative rounded-xl border bg-muted/20 p-2">
              <ArticleThumbnail
                src={image.dataUrl}
                alt={image.name}
                className="h-24 w-full"
                sizes="(min-width: 640px) 140px, 50vw"
                fallback={<ImagePlus className="size-5" />}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                className="absolute top-1 right-1"
                aria-label={`${copy.remove} ${image.name}`}
                onClick={() => onImagesChange(images.filter((item) => item.id !== image.id))}
              >
                <Trash2 />
              </Button>
              <p className="mt-1 truncate text-xs text-muted-foreground">{image.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
