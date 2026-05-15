export type MarginVerdict = "healthy" | "watch" | "danger";

export type CupMarginInput = {
  menuName: string;
  salePrice: number;
  ingredientCost: number;
  packagingCost: number;
  platformFeeRate: number;
  wasteRate: number;
  laborCostPerCup: number;
  extraCost: number;
  monthlyFixedCost: number;
  expectedMonthlyCups: number;
};

export type PriceScenario = {
  label: string;
  salePrice: number;
  profitPerCup: number;
  marginRate: number;
  monthlyProfit: number;
};

export type CupMarginResult = {
  menuName: string;
  revenuePerCup: number;
  variableCostPerCup: number;
  allocatedFixedCostPerCup: number;
  totalCostPerCup: number;
  profitPerCup: number;
  marginRate: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  breakEvenCups: number | null;
  verdict: MarginVerdict;
  scenarios: PriceScenario[];
};
