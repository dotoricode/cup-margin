import type { CupMarginInput, CupMarginResult, MarginVerdict, PriceScenario } from "./types";

export const DEFAULT_MARGIN_INPUT: CupMarginInput = {
  menuName: "바닐라 라떼",
  salePrice: 5500,
  ingredientCost: 1850,
  packagingCost: 250,
  platformFeeRate: 0,
  wasteRate: 3,
  laborCostPerCup: 350,
  extraCost: 0,
  monthlyFixedCost: 1200000,
  expectedMonthlyCups: 900,
};

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);
const safeNumber = (value: number) => (Number.isFinite(value) ? Math.max(value, 0) : 0);

export function calculateCupMargin(input: CupMarginInput): CupMarginResult {
  const salePrice = safeNumber(input.salePrice);
  const expectedMonthlyCups = Math.max(Math.floor(safeNumber(input.expectedMonthlyCups)), 1);
  const platformFeeRate = clampPercent(safeNumber(input.platformFeeRate)) / 100;
  const wasteRate = clampPercent(safeNumber(input.wasteRate)) / 100;
  const monthlyFixedCost = safeNumber(input.monthlyFixedCost);

  const baseVariableCost =
    safeNumber(input.ingredientCost) +
    safeNumber(input.packagingCost) +
    safeNumber(input.laborCostPerCup) +
    safeNumber(input.extraCost);
  const platformFee = salePrice * platformFeeRate;
  const wasteBuffer = baseVariableCost * wasteRate;
  const variableCostPerCup = roundWon(baseVariableCost + platformFee + wasteBuffer);
  const allocatedFixedCostPerCup = roundWon(monthlyFixedCost / expectedMonthlyCups);
  const totalCostPerCup = roundWon(variableCostPerCup + allocatedFixedCostPerCup);
  const profitPerCup = roundWon(salePrice - totalCostPerCup);
  const marginRate = salePrice > 0 ? roundRate((profitPerCup / salePrice) * 100) : 0;
  const monthlyRevenue = roundWon(salePrice * expectedMonthlyCups);
  const monthlyProfit = roundWon(profitPerCup * expectedMonthlyCups);
  const breakEvenCups = salePrice > variableCostPerCup ? Math.ceil(monthlyFixedCost / (salePrice - variableCostPerCup)) : null;

  return {
    menuName: input.menuName.trim() || "이 메뉴",
    revenuePerCup: salePrice,
    variableCostPerCup,
    allocatedFixedCostPerCup,
    totalCostPerCup,
    profitPerCup,
    marginRate,
    monthlyRevenue,
    monthlyProfit,
    breakEvenCups,
    verdict: getVerdict(marginRate, profitPerCup),
    scenarios: [500, 1000].map((increase) => buildScenario(input, increase, variableCostPerCup, allocatedFixedCostPerCup, expectedMonthlyCups)),
  };
}

function buildScenario(
  input: CupMarginInput,
  increase: number,
  variableCostPerCup: number,
  allocatedFixedCostPerCup: number,
  expectedMonthlyCups: number,
): PriceScenario {
  const salePrice = safeNumber(input.salePrice) + increase;
  const totalCostPerCup = variableCostPerCup + allocatedFixedCostPerCup;
  const profitPerCup = roundWon(salePrice - totalCostPerCup);
  return {
    label: `+${increase.toLocaleString("ko-KR")}원`,
    salePrice,
    profitPerCup,
    marginRate: salePrice > 0 ? roundRate((profitPerCup / salePrice) * 100) : 0,
    monthlyProfit: roundWon(profitPerCup * expectedMonthlyCups),
  };
}

function getVerdict(marginRate: number, profitPerCup: number): MarginVerdict {
  if (profitPerCup <= 0 || marginRate < 20) return "danger";
  if (marginRate < 35) return "watch";
  return "healthy";
}

function roundWon(value: number) {
  return Math.round(value);
}

function roundRate(value: number) {
  return Math.round(value * 10) / 10;
}
