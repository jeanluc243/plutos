export const MIN_GAIN_MULTIPLIER = 1.5;
export const MAX_GAIN_MULTIPLIER = 10;

export type ArticleCostInputs = {
  purchasePrice: number;
  transportCost: number;
  paymentCommission: number;
  chinaTransportCost: number;
  agencyTransportCost: number;
  gainMultiplier: number;
  stock: number;
};

export function calculateArticleCost(inputs: Omit<ArticleCostInputs, "gainMultiplier" | "stock">) {
  return (
    inputs.purchasePrice +
    inputs.transportCost +
    inputs.paymentCommission +
    inputs.chinaTransportCost +
    inputs.agencyTransportCost
  );
}

export function calculateSuggestedSalePrice(inputs: ArticleCostInputs) {
  if (inputs.stock <= 0) return 0;

  return Math.round(
    (calculateArticleCost(inputs) / inputs.stock) * inputs.gainMultiplier * 100,
  ) / 100;
}
