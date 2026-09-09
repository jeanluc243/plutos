"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PendingTodoPhoto = {
  name: string;
  dataUrl: string;
};

type TodoPhotoPickerCopy = {
  choose: string;
  replace: string;
  drop: string;
  format: string;
  invalidType: string;
  tooLarge: string;
  processingFailed: string;
  remove: string;
};

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumSourceSize = 8_000_000;
const maximumStoredLength = 1_350_000;

async function optimizePhoto(file: File): Promise<PendingTodoPhoto | null> {
  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return null;

    for (const maximumDimension of [1600, 1280, 1024]) {
      const scale = Math.min(
        1,
        maximumDimension / Math.max(bitmap.width, bitmap.height),
      );
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.7, 0.58]) {
        const dataUrl = canvas.toDataURL("image/webp", quality);
        if (dataUrl.length <= maximumStoredLength) {
          return {
            name: file.name.replace(/\.[^.]+$/, "") + ".webp",
            dataUrl,
          };
        }
      }
    }

    return null;
  } finally {
    bitmap.close();
  }
}

export function TodoPhotoPicker({
  copy,
  photo,
  onPhotoChange,
  disabled = false,
}: {
  copy: TodoPhotoPickerCopy;
  photo: PendingTodoPhoto | null;
  onPhotoChange: (photo: PendingTodoPhoto | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addFile(file: File | undefined) {
    if (!file || disabled) return;
    if (!acceptedTypes.has(file.type)) {
      setError(copy.invalidType);
      return;
    }
    if (file.size > maximumSourceSize) {
      setError(copy.tooLarge);
      return;
    }

    setProcessing(true);
    try {
      const nextPhoto = await optimizePhoto(file);
      if (!nextPhoto) {
        setError(copy.tooLarge);
        return;
      }
      onPhotoChange(nextPhoto);
      setError(null);
    } catch {
      setError(copy.processingFailed);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="image" value={photo?.dataUrl ?? ""} />
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label={copy.choose}
        disabled={disabled || processing}
        onChange={(event) => {
          void addFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {photo ? (
        <div className="relative overflow-hidden rounded-xl border bg-muted/20">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={photo.dataUrl}
              alt={photo.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 576px"
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {photo.name}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || processing}
                onClick={() => inputRef.current?.click()}
              >
                <Upload data-icon="inline-start" />
                {copy.replace}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled || processing}
                aria-label={copy.remove}
                onClick={() => {
                  onPhotoChange(null);
                  setError(null);
                }}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-4 py-5 text-center transition-colors",
            dragging && "border-primary bg-primary/5",
            disabled && "cursor-not-allowed opacity-60",
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void addFile(event.dataTransfer.files[0]);
          }}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {processing ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
          </span>
          <div>
            <p className="font-medium">{copy.drop}</p>
            <p className="mt-1 text-xs text-muted-foreground">{copy.format}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || processing}
            onClick={() => inputRef.current?.click()}
          >
            {processing ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            {copy.choose}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
