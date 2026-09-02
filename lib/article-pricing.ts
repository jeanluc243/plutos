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
  const sharedFees =
    inputs.paymentCommission +
    inputs.chinaTransportCost +
    inputs.agencyTransportCost;
  const feePerUnit = inputs.stock > 0 ? sharedFees / inputs.stock : 0;

  return Math.round((inputs.purchasePrice + feePerUnit * inputs.gainMultiplier) * 100) / 100;
}
