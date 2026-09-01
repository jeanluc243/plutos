export const displayCurrencies = ["USD", "CDF"] as const;

export type DisplayCurrency = (typeof displayCurrencies)[number];

export type PriceSettings = {
  exchangeRate: number;
  displayCurrency: DisplayCurrency;
};

export const defaultPriceSettings: PriceSettings = {
  exchangeRate: 2800,
  displayCurrency: "USD",
};

export function isDisplayCurrency(value: string): value is DisplayCurrency {
  return displayCurrencies.includes(value as DisplayCurrency);
}

export function formatPrice(
  amountInUsd: number,
  settings: PriceSettings,
  locale: string,
) {
  const amount =
    settings.displayCurrency === "CDF"
      ? Math.ceil((amountInUsd * settings.exchangeRate) / 500) * 500
      : amountInUsd;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: settings.displayCurrency,
    minimumFractionDigits: settings.displayCurrency === "CDF" ? 0 : 2,
    maximumFractionDigits: settings.displayCurrency === "CDF" ? 0 : 2,
  }).format(amount);
}
