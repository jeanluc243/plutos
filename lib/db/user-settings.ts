import "server-only";

import { eq } from "drizzle-orm";

import { defaultPriceSettings, isDisplayCurrency } from "@/lib/pricing";
import { getDatabase } from "./client";
import { userSettings } from "./schema";

export async function getUserPriceSettings(ownerId: string) {
  const [record] = await getDatabase()
    .select({
      exchangeRate: userSettings.exchangeRate,
      displayCurrency: userSettings.displayCurrency,
    })
    .from(userSettings)
    .where(eq(userSettings.ownerId, ownerId))
    .limit(1);

  const exchangeRate = Number(record?.exchangeRate);
  const displayCurrency = record?.displayCurrency ?? "";

  if (
    !record ||
    !Number.isFinite(exchangeRate) ||
    exchangeRate <= 0 ||
    !isDisplayCurrency(displayCurrency)
  ) {
    return defaultPriceSettings;
  }

  return { exchangeRate, displayCurrency };
}
