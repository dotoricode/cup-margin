export type ProductCategory = "drink" | "bakery" | "dessert";
export type PurchaseUnit = "kg" | "g" | "L" | "ml" | "ea" | "box" | "bottle";
export type BaseUnit = "g" | "ml" | "ea";

export type RecipeIngredientInput = {
  name: string;
  purchasePrice: number;
  purchaseQuantity: number;
  purchaseUnit: PurchaseUnit;
  baseUnit: BaseUnit;
  recipeQuantity: number;
  recipeUnit: BaseUnit | "kg" | "L" | "shot" | "scoop" | "pump" | "spoon" | "piece";
  customUnitAmount?: number;
  lossRate?: number;
};

export type ProductCostingInput = {
  id: string;
  name: string;
  category: ProductCategory;
  salePrice: number;
  targetMarginRate: number;
  competitorAveragePrice?: number;
  ingredients: RecipeIngredientInput[];
  packagingCost: number;
  laborCost: number;
  allocatedFixedCost: number;
  batchYieldCount?: number;
  batchLossRate?: number;
  defectiveCount?: number;
};

export type IngredientCostLine = {
  name: string;
  baseUnit: BaseUnit;
  baseUnitCost: number;
  convertedQuantity: number;
  lossAdjustedQuantity: number;
  cost: number;
  detail: string;
};

export type TargetCostRatePrice = {
  costRate: number;
  price: number;
};

export type ProductCostingResult = ProductCostingInput & {
  productionType: "single" | "batch";
  ingredientLines: IngredientCostLine[];
  sellableYieldCount: number | null;
  materialCost: number;
  totalCost: number;
  profit: number;
  marginRate: number;
  costRate: number;
  recommendedPrice: number;
  safePriceRange: { min: number; max: number };
  targetCostRatePrices: TargetCostRatePrice[];
  marketPosition: "below_market" | "near_market" | "above_market" | "unknown";
  warnings: string[];
};

export type PriceSimulationOptions = {
  minPrice: number;
  maxPrice: number;
  step: number;
};

export type PriceSimulationPoint = {
  price: number;
  profit: number;
  marginRate: number;
  costRate: number;
  expectedSalesIndex: number;
  meetsTarget: boolean;
};

export type SalesSensitivity = "low" | "medium" | "high";

export type PriceDecisionOptions = {
  selectedPrice: number;
  monthlyCups: number;
  sensitivity: SalesSensitivity;
};

export type PriceDecisionSummary = {
  recommendedReviewPrice: number;
  selectedPrice: number;
  currentMonthlyCups: number;
  projectedMonthlyCups: number;
  currentMonthlyProfit: number;
  projectedMonthlyProfit: number;
  monthlyProfitDelta: number;
  selectedProfitPerCup: number;
  expectedSalesIndex: number;
  breakEvenSalesDropRate: number | null;
  sensitivity: SalesSensitivity;
  sensitivityLabel: string;
  summary: string;
};

export type TradeAreaInput = {
  address: string;
  radiusMeters: number;
  cafeCount: number;
  bakeryCount: number;
  lowPriceFranchiseCount: number;
  transitStopCount: number;
  schoolCount: number;
};

export type TradeAreaSummary = TradeAreaInput & {
  competitionLevel: "low" | "medium" | "high";
  opportunitySignal: string;
  warning: string;
  headline: string;
};

export const DEFAULT_RECIPE_PRICING_PRODUCTS: ProductCostingInput[] = [
  {
    id: "americano",
    name: "아메리카노",
    category: "drink",
    salePrice: 3500,
    targetMarginRate: 60,
    competitorAveragePrice: 3800,
    ingredients: [
      {
        name: "원두",
        purchasePrice: 28000,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
        baseUnit: "g",
        recipeQuantity: 1,
        recipeUnit: "shot",
        customUnitAmount: 18,
        lossRate: 3,
      },
    ],
    packagingCost: 180,
    laborCost: 250,
    allocatedFixedCost: 250,
  },
  {
    id: "financier",
    name: "휘낭시에",
    category: "bakery",
    salePrice: 3200,
    targetMarginRate: 58,
    competitorAveragePrice: 3500,
    batchYieldCount: 24,
    batchLossRate: 4,
    defectiveCount: 1,
    ingredients: [
      {
        name: "버터",
        purchasePrice: 12000,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
        baseUnit: "g",
        recipeQuantity: 240,
        recipeUnit: "g",
      },
      {
        name: "아몬드 가루",
        purchasePrice: 15000,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
        baseUnit: "g",
        recipeQuantity: 180,
        recipeUnit: "g",
      },
      {
        name: "설탕·달걀·밀가루",
        purchasePrice: 6000,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
        baseUnit: "g",
        recipeQuantity: 420,
        recipeUnit: "g",
      },
    ],
    packagingCost: 120,
    laborCost: 350,
    allocatedFixedCost: 180,
  },
  {
    id: "cafe-latte",
    name: "카페라떼",
    category: "drink",
    salePrice: 4800,
    targetMarginRate: 58,
    competitorAveragePrice: 5000,
    ingredients: [
      {
        name: "원두",
        purchasePrice: 28000,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
        baseUnit: "g",
        recipeQuantity: 1,
        recipeUnit: "shot",
        customUnitAmount: 18,
        lossRate: 3,
      },
      {
        name: "우유",
        purchasePrice: 3300,
        purchaseQuantity: 1,
        purchaseUnit: "L",
        baseUnit: "ml",
        recipeQuantity: 180,
        recipeUnit: "ml",
        lossRate: 2,
      },
    ],
    packagingCost: 220,
    laborCost: 320,
    allocatedFixedCost: 260,
  },
  {
    id: "strawberry-ade",
    name: "딸기 에이드",
    category: "drink",
    salePrice: 6200,
    targetMarginRate: 55,
    competitorAveragePrice: 6500,
    ingredients: [
      {
        name: "딸기 베이스",
        purchasePrice: 17000,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
        baseUnit: "g",
        recipeQuantity: 70,
        recipeUnit: "g",
        lossRate: 3,
      },
      {
        name: "탄산수",
        purchasePrice: 1100,
        purchaseQuantity: 500,
        purchaseUnit: "ml",
        baseUnit: "ml",
        recipeQuantity: 180,
        recipeUnit: "ml",
      },
    ],
    packagingCost: 260,
    laborCost: 310,
    allocatedFixedCost: 260,
  },
  {
    id: "salt-bread",
    name: "소금빵",
    category: "bakery",
    salePrice: 3800,
    targetMarginRate: 52,
    competitorAveragePrice: 4000,
    batchYieldCount: 30,
    batchLossRate: 6,
    defectiveCount: 1,
    ingredients: [
      {
        name: "강력분·버터·소금",
        purchasePrice: 7600,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
        baseUnit: "g",
        recipeQuantity: 850,
        recipeUnit: "g",
      },
      {
        name: "이스트·설탕",
        purchasePrice: 4200,
        purchaseQuantity: 1,
        purchaseUnit: "kg",
        baseUnit: "g",
        recipeQuantity: 90,
        recipeUnit: "g",
      },
    ],
    packagingCost: 130,
    laborCost: 420,
    allocatedFixedCost: 210,
  },
];

export const DEFAULT_TRADE_AREA: TradeAreaInput = {
  address: "울산 중구 반구동",
  radiusMeters: 500,
  cafeCount: 18,
  bakeryCount: 5,
  lowPriceFranchiseCount: 3,
  transitStopCount: 7,
  schoolCount: 3,
};

export function calculateProductCost(input: ProductCostingInput): ProductCostingResult {
  const ingredientLines = input.ingredients.map(calculateIngredientLine);
  const batchMaterialCost = ingredientLines.reduce((sum, line) => sum + line.cost, 0);
  const productionType = input.batchYieldCount ? "batch" : "single";
  const sellableYieldCount = productionType === "batch" ? calculateSellableYield(input) : null;
  const materialCost =
    productionType === "batch" && sellableYieldCount && sellableYieldCount > 0
      ? roundWon(batchMaterialCost / sellableYieldCount)
      : batchMaterialCost;
  const totalCost = roundWon(materialCost + safeNumber(input.packagingCost) + safeNumber(input.laborCost) + safeNumber(input.allocatedFixedCost));
  const salePrice = safeNumber(input.salePrice);
  const profit = roundWon(salePrice - totalCost);
  const marginRate = salePrice > 0 ? roundRate((profit / salePrice) * 100) : 0;
  const costRate = salePrice > 0 ? roundRate((totalCost / salePrice) * 100) : 0;
  const targetMarginRate = clampPercent(safeNumber(input.targetMarginRate));
  const recommendedPrice = targetMarginRate >= 100 ? 0 : roundWon(totalCost / (1 - targetMarginRate / 100));
  const safePriceRange = {
    min: roundUpToHundred(recommendedPrice * 0.95),
    max: roundDownToHundred(recommendedPrice * 1.05),
  };
  const targetCostRatePrices = [45, 40, 35].map((targetCostRate) => ({
    costRate: targetCostRate,
    price: roundUpToHundred(totalCost / (targetCostRate / 100)),
  }));
  const marketPosition = getMarketPosition(salePrice, input.competitorAveragePrice);
  const warnings = buildWarnings({ ...input, totalCost, profit, marginRate, costRate, recommendedPrice, marketPosition });

  return {
    ...input,
    productionType,
    ingredientLines,
    sellableYieldCount,
    materialCost,
    totalCost,
    profit,
    marginRate,
    costRate,
    recommendedPrice,
    safePriceRange,
    targetCostRatePrices,
    marketPosition,
    warnings,
  };
}

export function generatePriceSimulation(
  product: ProductCostingResult,
  options: PriceSimulationOptions,
): PriceSimulationPoint[] {
  const minPrice = safeNumber(options.minPrice);
  const maxPrice = Math.max(minPrice, safeNumber(options.maxPrice));
  const step = Math.max(1, safeNumber(options.step));
  const points: PriceSimulationPoint[] = [];

  for (let price = minPrice; price <= maxPrice; price += step) {
    const profit = roundWon(price - product.totalCost);
    const marginRate = price > 0 ? roundRate((profit / price) * 100) : 0;
    points.push({
      price,
      profit,
      marginRate,
      costRate: price > 0 ? roundRate((product.totalCost / price) * 100) : 0,
      expectedSalesIndex: estimateSalesIndex(product.salePrice, price),
      meetsTarget: marginRate >= product.targetMarginRate,
    });
  }

  return points;
}

export function estimateSalesIndex(basePrice: number, nextPrice: number, sensitivity: SalesSensitivity = "medium") {
  const safeBasePrice = Math.max(1, safeNumber(basePrice));
  const safeNextPrice = Math.max(1, safeNumber(nextPrice));
  const priceRatio = safeBasePrice / safeNextPrice;
  const exponentBySensitivity: Record<SalesSensitivity, number> = {
    low: 0.75,
    medium: 1.15,
    high: 1.6,
  };
  return Math.max(45, Math.min(140, Math.round(100 * priceRatio ** exponentBySensitivity[sensitivity])));
}

export function buildPriceDecision(product: ProductCostingResult, options: PriceDecisionOptions): PriceDecisionSummary {
  const selectedPrice = safeNumber(options.selectedPrice);
  const currentMonthlyCups = Math.max(0, Math.round(safeNumber(options.monthlyCups)));
  const selectedProfitPerCup = roundWon(selectedPrice - product.totalCost);
  const expectedSalesIndex = estimateSalesIndex(product.salePrice, selectedPrice, options.sensitivity);
  const projectedMonthlyCups = Math.round(currentMonthlyCups * (expectedSalesIndex / 100));
  const currentMonthlyProfit = roundWon(product.profit * currentMonthlyCups);
  const projectedMonthlyProfit = roundWon(selectedProfitPerCup * projectedMonthlyCups);
  const monthlyProfitDelta = roundWon(projectedMonthlyProfit - currentMonthlyProfit);
  const possibleMonthlyProfitBeforeDrop = selectedProfitPerCup * currentMonthlyCups;
  const breakEvenSalesDropRate =
    selectedProfitPerCup > 0 && possibleMonthlyProfitBeforeDrop > 0
      ? roundRate(Math.max(0, 100 - (currentMonthlyProfit / possibleMonthlyProfitBeforeDrop) * 100))
      : null;
  const sensitivityLabel: Record<SalesSensitivity, string> = {
    low: "민감도 낮음",
    medium: "민감도 보통",
    high: "민감도 높음",
  };
  const deltaLabel = monthlyProfitDelta >= 0 ? "증가" : "감소";

  return {
    recommendedReviewPrice: roundUpToHundred(product.recommendedPrice),
    selectedPrice,
    currentMonthlyCups,
    projectedMonthlyCups,
    currentMonthlyProfit,
    projectedMonthlyProfit,
    monthlyProfitDelta,
    selectedProfitPerCup,
    expectedSalesIndex,
    breakEvenSalesDropRate,
    sensitivity: options.sensitivity,
    sensitivityLabel: sensitivityLabel[options.sensitivity],
    summary: `월 ${Math.abs(monthlyProfitDelta).toLocaleString("ko-KR")}원 ${deltaLabel} 예상`,
  };
}

export function summarizeTradeArea(input: TradeAreaInput): TradeAreaSummary {
  const competitionLevel = input.cafeCount >= 35 ? "high" : input.cafeCount >= 15 ? "medium" : "low";
  const bakeryRatio = input.bakeryCount / Math.max(1, input.cafeCount);
  const opportunitySignal =
    bakeryRatio < 0.25
      ? "베이커리/디저트 메뉴로 객단가를 보강할 여지가 있습니다."
      : "베이커리 경쟁도 함께 확인해야 하는 상권입니다.";
  const warning =
    input.lowPriceFranchiseCount >= 5
      ? "저가 프랜차이즈 신호가 강합니다. 가격을 낮추기보다 시그니처·세트·사이즈 전략으로 방어하세요."
      : "저가 프랜차이즈 압박은 제한적이지만, 주변 메뉴 가격은 직접 확인이 필요합니다.";

  return {
    ...input,
    competitionLevel,
    opportunitySignal,
    warning,
    headline: `${input.address} ${input.radiusMeters}m 기준 카페 ${input.cafeCount}곳 · 베이커리 ${input.bakeryCount}곳`,
  };
}

function calculateIngredientLine(ingredient: RecipeIngredientInput): IngredientCostLine {
  const baseQuantity = safeNumber(ingredient.purchaseQuantity) * purchaseUnitFactor(ingredient.purchaseUnit, ingredient.baseUnit);
  const baseUnitCost = baseQuantity > 0 ? safeNumber(ingredient.purchasePrice) / baseQuantity : 0;
  const convertedQuantity = safeNumber(ingredient.recipeQuantity) * recipeUnitFactor(ingredient);
  const yieldRate = 1 - clampPercent(safeNumber(ingredient.lossRate ?? 0)) / 100;
  const lossAdjustedQuantity = yieldRate > 0 ? convertedQuantity / yieldRate : convertedQuantity;
  const cost = roundWon(lossAdjustedQuantity * baseUnitCost);

  return {
    name: ingredient.name,
    baseUnit: ingredient.baseUnit,
    baseUnitCost: roundRate(baseUnitCost),
    convertedQuantity: roundQuantity(convertedQuantity),
    lossAdjustedQuantity: roundQuantity(lossAdjustedQuantity),
    cost,
    detail: `${ingredient.recipeQuantity}${ingredient.recipeUnit} → ${roundQuantity(convertedQuantity)}${ingredient.baseUnit}`,
  };
}

function calculateSellableYield(input: ProductCostingInput) {
  const batchYieldCount = safeNumber(input.batchYieldCount ?? 0);
  const yieldAfterLoss = batchYieldCount * (1 - clampPercent(safeNumber(input.batchLossRate ?? 0)) / 100);
  return roundQuantity(yieldAfterLoss - safeNumber(input.defectiveCount ?? 0));
}

function purchaseUnitFactor(unit: PurchaseUnit, baseUnit: BaseUnit) {
  if (unit === "kg" && baseUnit === "g") return 1000;
  if (unit === "L" && baseUnit === "ml") return 1000;
  if (unit === "g" && baseUnit === "g") return 1;
  if (unit === "ml" && baseUnit === "ml") return 1;
  if (unit === "ea" && baseUnit === "ea") return 1;
  if ((unit === "box" || unit === "bottle") && baseUnit === "ea") return 1;
  if (unit === "bottle" && baseUnit === "ml") return 1000;
  return 1;
}

function recipeUnitFactor(ingredient: RecipeIngredientInput) {
  if (ingredient.recipeUnit === "kg" && ingredient.baseUnit === "g") return 1000;
  if (ingredient.recipeUnit === "L" && ingredient.baseUnit === "ml") return 1000;
  if (["shot", "scoop", "pump", "spoon", "piece"].includes(ingredient.recipeUnit)) {
    return safeNumber(ingredient.customUnitAmount ?? 1);
  }
  return 1;
}

function getMarketPosition(salePrice: number, competitorAveragePrice?: number): ProductCostingResult["marketPosition"] {
  if (!competitorAveragePrice || competitorAveragePrice <= 0) return "unknown";
  const difference = salePrice - competitorAveragePrice;
  if (difference >= 300) return "above_market";
  if (difference <= -300) return "below_market";
  return "near_market";
}

function buildWarnings(input: ProductCostingInput & {
  totalCost: number;
  profit: number;
  marginRate: number;
  costRate: number;
  recommendedPrice: number;
  marketPosition: ProductCostingResult["marketPosition"];
}) {
  const warnings: string[] = [];
  if (input.profit <= 0) warnings.push("현재 판매가는 한 잔 원가보다 낮아 팔수록 손해입니다.");
  if (input.costRate >= 50) warnings.push("원가가 높은 편입니다. 우유·컵·포장비부터 확인하세요.");
  if (input.costRate <= 42 && input.profit > 0) warnings.push("지금 가격은 원가 기준으로 무리 없는 편입니다. 주변 가격과 고객 반응만 함께 확인하세요.");
  if (input.marketPosition === "above_market") warnings.push("주변 평균보다 높은 편입니다. 시그니처 가치나 구성 차이를 함께 보여주세요.");
  if (input.marketPosition === "below_market") warnings.push("주변 평균보다 낮은 편입니다. 가격을 올리기 어렵다면 원가·용량·세트 구성을 먼저 조정해보세요.");
  return warnings;
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

function roundQuantity(value: number) {
  return Math.round(value * 100) / 100;
}

function roundUpToHundred(value: number) {
  return Math.ceil(value / 100) * 100;
}

function roundDownToHundred(value: number) {
  return Math.floor(value / 100) * 100;
}
