export type MenuMarginInput = {
  id: string;
  menuName: string;
  salePrice: number;
  ingredientCost: number;
  packagingCost: number;
  platformFeeRate: number;
  wasteRate: number;
  laborCostPerCup: number;
  extraCost: number;
  expectedMonthlyCups: number;
};

export type MultiMenuMarginInput = {
  monthlyFixedCost: number;
  menus: MenuMarginInput[];
};

export type MenuMarginResult = MenuMarginInput & {
  revenue: number;
  variableCostPerCup: number;
  fixedCostPerCup: number;
  totalCostPerCup: number;
  profitPerCup: number;
  marginRate: number;
  monthlyProfit: number;
  fixedCostShare: number;
  priceUpProfitPerCup: number;
  priceUpMonthlyProfit: number;
};

export type PriceChangeRiskInput = {
  priceDelta: number;
  volumeChangeRate: number;
};

export type PriceChangeRiskResult = {
  newSalePrice: number;
  assumedMonthlyCups: number;
  projectedRevenue: number;
  projectedProfitPerCup: number;
  projectedMonthlyProfit: number;
  profitDelta: number;
  breakEvenMonthlyCups: number | null;
  allowedDropCups: number | null;
  allowedDropRate: number | null;
  verdict: "safe" | "watch" | "risk";
  summary: string;
  warning: string;
};

export type MultiMenuMarginResult = {
  monthlyFixedCost: number;
  totalMonthlyCups: number;
  fixedCostPerCup: number;
  totalRevenue: number;
  totalVariableCost: number;
  totalFixedCost: number;
  totalProfit: number;
  blendedMarginRate: number;
  menus: MenuMarginResult[];
};

export const DEFAULT_MULTI_MENU_INPUT: MultiMenuMarginInput = {
  monthlyFixedCost: 900000,
  menus: [
    {
      id: "americano",
      menuName: "아메리카노",
      salePrice: 3500,
      ingredientCost: 520,
      packagingCost: 180,
      platformFeeRate: 0,
      wasteRate: 2,
      laborCostPerCup: 250,
      extraCost: 0,
      expectedMonthlyCups: 900,
    },
    {
      id: "financier",
      menuName: "휘낭시에",
      salePrice: 3200,
      ingredientCost: 820,
      packagingCost: 120,
      platformFeeRate: 0,
      wasteRate: 5,
      laborCostPerCup: 350,
      extraCost: 0,
      expectedMonthlyCups: 360,
    },
  ],
};

export function calculateMultiMenuMargin(input: MultiMenuMarginInput): MultiMenuMarginResult {
  const menus = input.menus.filter((menu) => safeNumber(menu.expectedMonthlyCups) > 0);
  const totalMonthlyCups = Math.max(
    1,
    menus.reduce((sum, menu) => sum + safeNumber(menu.expectedMonthlyCups), 0),
  );
  const monthlyFixedCost = safeNumber(input.monthlyFixedCost);
  const fixedCostPerCup = roundWon(monthlyFixedCost / totalMonthlyCups);

  const menuResults = menus.map((menu) => {
    const salePrice = safeNumber(menu.salePrice);
    const expectedMonthlyCups = safeNumber(menu.expectedMonthlyCups);
    const baseVariableCost =
      safeNumber(menu.ingredientCost) +
      safeNumber(menu.packagingCost) +
      safeNumber(menu.laborCostPerCup) +
      safeNumber(menu.extraCost);
    const platformFee = salePrice * (clampPercent(safeNumber(menu.platformFeeRate)) / 100);
    const wasteBuffer = baseVariableCost * (clampPercent(safeNumber(menu.wasteRate)) / 100);
    const variableCostPerCup = roundWon(baseVariableCost + platformFee + wasteBuffer);
    const totalCostPerCup = roundWon(variableCostPerCup + fixedCostPerCup);
    const profitPerCup = roundWon(salePrice - totalCostPerCup);
    const revenue = roundWon(salePrice * expectedMonthlyCups);
    const monthlyProfit = roundWon(profitPerCup * expectedMonthlyCups);
    const priceUpProfitPerCup = roundWon(salePrice + 500 - totalCostPerCup);

    return {
      ...menu,
      revenue,
      variableCostPerCup,
      fixedCostPerCup,
      totalCostPerCup,
      profitPerCup,
      marginRate: salePrice > 0 ? roundRate((profitPerCup / salePrice) * 100) : 0,
      monthlyProfit,
      fixedCostShare: roundWon(fixedCostPerCup * expectedMonthlyCups),
      priceUpProfitPerCup,
      priceUpMonthlyProfit: roundWon(priceUpProfitPerCup * expectedMonthlyCups),
    };
  });

  const totalRevenue = roundWon(menuResults.reduce((sum, menu) => sum + menu.revenue, 0));
  const totalVariableCost = roundWon(
    menuResults.reduce((sum, menu) => sum + menu.variableCostPerCup * menu.expectedMonthlyCups, 0),
  );
  const totalProfit = roundWon(menuResults.reduce((sum, menu) => sum + menu.monthlyProfit, 0));

  return {
    monthlyFixedCost,
    totalMonthlyCups,
    fixedCostPerCup,
    totalRevenue,
    totalVariableCost,
    totalFixedCost: monthlyFixedCost,
    totalProfit,
    blendedMarginRate: totalRevenue > 0 ? roundRate((totalProfit / totalRevenue) * 100) : 0,
    menus: menuResults,
  };
}

export function calculatePriceChangeRisk(
  menu: MenuMarginResult,
  scenario: PriceChangeRiskInput,
): PriceChangeRiskResult {
  const currentCups = safeNumber(menu.expectedMonthlyCups);
  const newSalePrice = roundWon(safeNumber(menu.salePrice) + scenario.priceDelta);
  const assumedMonthlyCups = roundWon(currentCups * (1 + scenario.volumeChangeRate / 100));
  const baseVariableCostWithoutPlatform =
    safeNumber(menu.ingredientCost) +
    safeNumber(menu.packagingCost) +
    safeNumber(menu.laborCostPerCup) +
    safeNumber(menu.extraCost);
  const platformFee = newSalePrice * (clampPercent(safeNumber(menu.platformFeeRate)) / 100);
  const wasteBuffer = baseVariableCostWithoutPlatform * (clampPercent(safeNumber(menu.wasteRate)) / 100);
  const projectedVariableCostPerCup = roundWon(baseVariableCostWithoutPlatform + platformFee + wasteBuffer);
  const projectedProfitPerCup = roundWon(newSalePrice - projectedVariableCostPerCup - safeNumber(menu.fixedCostPerCup));
  const projectedRevenue = roundWon(newSalePrice * assumedMonthlyCups);
  const projectedMonthlyProfit = roundWon(projectedProfitPerCup * assumedMonthlyCups);
  const profitDelta = roundWon(projectedMonthlyProfit - safeNumber(menu.monthlyProfit));
  const breakEvenMonthlyCups =
    projectedProfitPerCup > 0 ? Math.ceil(safeNumber(menu.monthlyProfit) / projectedProfitPerCup) : null;
  const allowedDropCups =
    breakEvenMonthlyCups === null ? null : roundWon(currentCups - breakEvenMonthlyCups);
  const allowedDropRate =
    allowedDropCups === null || currentCups <= 0 ? null : roundRate((allowedDropCups / currentCups) * 100);
  const verdict = profitDelta < 0 ? "risk" : scenario.volumeChangeRate < -10 ? "watch" : "safe";

  return {
    newSalePrice,
    assumedMonthlyCups,
    projectedRevenue,
    projectedProfitPerCup,
    projectedMonthlyProfit,
    profitDelta,
    breakEvenMonthlyCups,
    allowedDropCups,
    allowedDropRate,
    verdict,
    summary:
      profitDelta < 0
        ? "현재 가정에서는 기존보다 이익이 줄어듭니다. 가격보다 원가·판매량 방어를 먼저 점검하세요."
        : "현재 가정에서는 이익이 늘지만, 판매량 변화에 따라 결과가 달라집니다.",
    warning: "가격 변경 결과는 예측이 아니라 가정 계산입니다. 실제 판매량은 상권, 시즌, 경쟁 메뉴, 고객층에 따라 달라질 수 있습니다.",
  };
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function roundWon(value: number) {
  return Math.round(value);
}

function roundRate(value: number) {
  return Math.round(value * 10) / 10;
}
