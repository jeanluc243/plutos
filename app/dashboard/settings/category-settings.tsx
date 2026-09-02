"use client";

import { useActionState, useRef, useTransition } from "react";
import { FolderTree, LoaderCircle, Plus, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { DashboardLanguage } from "../language";
import { createCategory, deleteCategory } from "./category-actions";
import { initialCategoryActionState, type CategoryActionState } from "./category-state";
import { settingsCopy } from "./copy";

export type CategoryRecord = { id: string; name: string };

export function CategorySettings({
  language,
  categories,
}: {
  language: DashboardLanguage;
  categories: CategoryRecord[];
}) {
  const copy = settingsCopy[language];
  const formRef = useRef<HTMLFormElement>(null);
  const [deleting, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (previousState: CategoryActionState, formData: FormData) => {
      const nextState = await createCategory(previousState, formData);
      if (nextState.status === "success") formRef.current?.reset();
      return nextState;
    },
    initialCategoryActionState,
  );
  const errorMessage = state.error ? copy.categoryErrors[state.error] : null;

  return (
    <Card className="max-w-3xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="size-5 text-muted-foreground" />
          {copy.categories}
        </CardTitle>
        <CardDescription>{copy.categoriesDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1 space-y-2">
            <Label htmlFor="category-name">{copy.categoryName}</Label>
            <Input id="category-name" name="name" maxLength={120} required />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
            {pending ? copy.addingCategory : copy.addCategory}
          </Button>
        </form>
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{copy.categoryList}</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.noCategories}</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center gap-3 rounded-lg border p-4">
                <FolderTree className="size-5 shrink-0 text-muted-foreground" />
                <p className="min-w-0 flex-1 truncate font-medium">{category.name}</p>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" />}>
                    <Trash2 />
                    <span className="sr-only">{copy.deleteCategory}</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{copy.deleteCategory}</AlertDialogTitle>
                      <AlertDialogDescription>{copy.deleteCategoryConfirmation}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={deleting}
                        onClick={() => startTransition(async () => { await deleteCategory(category.id); })}
                      >
                        {copy.delete}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
