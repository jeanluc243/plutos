"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardLanguage } from "../language";
import { createCategory } from "../settings/category-actions";
import { initialCategoryActionState } from "../settings/category-state";
import { articlesCopy } from "./copy";

const CREATE_CATEGORY_VALUE = "__create_category__";

type Category = { id: string; name: string };

export function ArticleCategorySelect({
  language,
  categories,
}: {
  language: DashboardLanguage;
  categories: Category[];
}) {
  const copy = articlesCopy[language];
  const router = useRouter();
  const [availableCategories, setAvailableCategories] = useState(categories);
  const [value, setValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<"invalid" | "duplicate" | "unauthorized" | "unknown" | null>(null);
  const [pending, startTransition] = useTransition();

  function handleValueChange(nextValue: string | null) {
    if (nextValue === CREATE_CATEGORY_VALUE) {
      setValue("");
      setIsCreating(true);
      setError(null);
      return;
    }

    setValue(nextValue ?? "");
  }

  function createNewCategory() {
    const name = newCategoryName.trim();
    const formData = new FormData();
    formData.set("name", name);

    startTransition(async () => {
      const result = await createCategory(initialCategoryActionState, formData);
      if (result.status !== "success") {
        setError(result.error ?? "unknown");
        return;
      }

      setAvailableCategories((current) => [
        ...current,
        { id: `created-${name.toLocaleLowerCase()}`, name },
      ]);
      setValue(name);
      setNewCategoryName("");
      setIsCreating(false);
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <Select name="category" value={value} onValueChange={handleValueChange} required>
        <SelectTrigger id="article-category" className="w-full">
          <SelectValue placeholder={copy.selectCategory} />
        </SelectTrigger>
        <SelectContent align="start">
          {availableCategories.map((category) => (
            <SelectItem key={category.id} value={category.name}>
              {category.name}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={CREATE_CATEGORY_VALUE}>
            <Plus />
            {copy.createCategoryFromList}
          </SelectItem>
        </SelectContent>
      </Select>

      {isCreating && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
          <Input
            aria-label={copy.newCategoryName}
            className="h-8 min-w-44 flex-1"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            maxLength={120}
            placeholder={copy.categoryPlaceholder}
          />
          <Button
            type="button"
            size="sm"
            disabled={pending || !newCategoryName.trim()}
            onClick={createNewCategory}
          >
            {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
            {pending ? copy.creatingCategory : copy.createCategory}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              setIsCreating(false);
              setError(null);
            }}
          >
            {copy.cancel}
          </Button>
          {error && <p className="basis-full text-xs text-destructive">{copy.categoryErrors[error]}</p>}
        </div>
      )}
    </div>
  );
}
