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
  monthlyFixedCost: 1200000,
  menus: [
    {
      id: "americano",
      menuName: "아메리카노",
      salePrice: 4500,
      ingredientCost: 850,
      packagingCost: 180,
      platformFeeRate: 0,
      wasteRate: 2,
      laborCostPerCup: 250,
      extraCost: 0,
      expectedMonthlyCups: 900,
    },
    {
      id: "vanilla-latte",
      menuName: "바닐라 라떼",
      salePrice: 5500,
      ingredientCost: 1850,
      packagingCost: 250,
      platformFeeRate: 0,
      wasteRate: 3,
      laborCostPerCup: 350,
      extraCost: 0,
      expectedMonthlyCups: 520,
    },
    {
      id: "strawberry-latte",
      menuName: "딸기 라떼",
      salePrice: 6200,
      ingredientCost: 2650,
      packagingCost: 300,
      platformFeeRate: 0,
      wasteRate: 8,
      laborCostPerCup: 420,
      extraCost: 0,
      expectedMonthlyCups: 240,
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
