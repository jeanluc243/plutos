"use server";

import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { userSettings } from "@/lib/db/schema";
import { isDisplayCurrency } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import type { SaveSettingsState } from "./settings-state";

export async function savePriceSettings(
  _previousState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", error: "unauthorized" };

  const exchangeRate = Number(formData.get("exchangeRate"));
  const displayCurrency = String(formData.get("displayCurrency") ?? "");

  if (
    !Number.isFinite(exchangeRate) ||
    exchangeRate <= 0 ||
    exchangeRate > 1_000_000 ||
    !isDisplayCurrency(displayCurrency)
  ) {
    return { status: "error", error: "invalid" };
  }

  try {
    await getDatabase()
      .insert(userSettings)
      .values({
        ownerId: user.id,
        exchangeRate: exchangeRate.toFixed(4),
        displayCurrency,
      })
      .onConflictDoUpdate({
        target: userSettings.ownerId,
        set: {
          exchangeRate: exchangeRate.toFixed(4),
          displayCurrency,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("Price settings update failed", error);
    return { status: "error", error: "unknown" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { status: "success" };
}
