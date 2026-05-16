import { describe, expect, it } from "vitest";
import {
  buildPriceDecision,
  calculateProductCost,
  generatePriceSimulation,
  summarizeTradeArea,
  type ProductCostingInput,
} from "./calculateRecipePricing";

const latte: ProductCostingInput = {
  id: "ice-latte",
  name: "아이스 카페라떼",
  category: "drink",
  salePrice: 5500,
  targetMarginRate: 60,
  competitorAveragePrice: 5200,
  ingredients: [
    {
      name: "원두",
      purchasePrice: 28000,
      purchaseQuantity: 1,
      purchaseUnit: "kg",
      baseUnit: "g",
      recipeQuantity: 2,
      recipeUnit: "shot",
      customUnitAmount: 18,
      lossRate: 3,
    },
    {
      name: "우유",
      purchasePrice: 2500,
      purchaseQuantity: 1,
      purchaseUnit: "L",
      baseUnit: "ml",
      recipeQuantity: 180,
      recipeUnit: "ml",
      lossRate: 1,
    },
  ],
  packagingCost: 180,
  laborCost: 400,
  allocatedFixedCost: 600,
};

const cookieBatch: ProductCostingInput = {
  id: "cookie",
  name: "초코칩 쿠키",
  category: "bakery",
  salePrice: 2800,
  targetMarginRate: 58,
  competitorAveragePrice: 3200,
  batchYieldCount: 50,
  batchLossRate: 5,
  defectiveCount: 2,
  ingredients: [
    {
      name: "밀가루",
      purchasePrice: 18000,
      purchaseQuantity: 10,
      purchaseUnit: "kg",
      baseUnit: "g",
      recipeQuantity: 1000,
      recipeUnit: "g",
    },
    {
      name: "버터",
      purchasePrice: 12000,
      purchaseQuantity: 1,
      purchaseUnit: "kg",
      baseUnit: "g",
      recipeQuantity: 500,
      recipeUnit: "g",
    },
    {
      name: "초코칩",
      purchasePrice: 9000,
      purchaseQuantity: 1,
      purchaseUnit: "kg",
      baseUnit: "g",
      recipeQuantity: 300,
      recipeUnit: "g",
    },
  ],
  packagingCost: 80,
  laborCost: 300,
  allocatedFixedCost: 200,
};

describe("calculateProductCost", () => {
  it("1kg 원재료를 샷·ml 사용량으로 환산하고 손실률을 반영해 음료 한 잔 원가를 계산한다", () => {
    const result = calculateProductCost(latte);

    expect(result.ingredientLines[0]).toMatchObject({
      name: "원두",
      baseUnitCost: 28,
      convertedQuantity: 36,
      lossAdjustedQuantity: 37.11,
      cost: 1039,
    });
    expect(result.materialCost).toBe(1494);
    expect(result.totalCost).toBe(2674);
    expect(result.profit).toBe(2826);
    expect(result.marginRate).toBe(51.4);
    expect(result.recommendedPrice).toBe(6685);
    expect(result.safePriceRange).toEqual({ min: 6400, max: 7000 });
    expect(result.targetCostRatePrices).toEqual([
      { costRate: 45, price: 6000 },
      { costRate: 40, price: 6700 },
      { costRate: 35, price: 7700 },
    ]);
    expect(result.warnings).toContain("주변 평균보다 높은 편입니다. 시그니처 가치나 구성 차이를 함께 보여주세요.");
    expect(result.marketPosition).toBe("above_market");
  });

  it("베이커리 배치 총 원가를 판매 가능 수량으로 나눠 1개당 원가를 계산한다", () => {
    const result = calculateProductCost(cookieBatch);

    expect(result.productionType).toBe("batch");
    expect(result.sellableYieldCount).toBe(45.5);
    expect(result.materialCost).toBe(231);
    expect(result.totalCost).toBe(811);
    expect(result.recommendedPrice).toBe(1931);
    expect(result.safePriceRange).toEqual({ min: 1900, max: 2000 });
    expect(result.marketPosition).toBe("below_market");
  });
});

describe("generatePriceSimulation", () => {
  it("좌우 가격 슬라이더용 가격별 마진율·예상 판매량·목표 달성 데이터를 만든다", () => {
    const product = calculateProductCost(latte);
    const points = generatePriceSimulation(product, { minPrice: 5000, maxPrice: 7000, step: 500 });

    expect(points).toHaveLength(5);
    expect(points[0]).toMatchObject({ price: 5000, profit: 2326, marginRate: 46.5, expectedSalesIndex: 112, meetsTarget: false });
    expect(points[1]).toMatchObject({ price: 5500, expectedSalesIndex: 100 });
    expect(points[4]).toMatchObject({ price: 7000, profit: 4326, marginRate: 61.8, expectedSalesIndex: 76, meetsTarget: true });
  });
});

describe("buildPriceDecision", () => {
  it("목표 마진 기준 추천 검토가와 월 이익 변화, 판매량 감소 허용폭을 계산한다", () => {
    const product = calculateProductCost(latte);
    const decision = buildPriceDecision(product, {
      selectedPrice: 6700,
      monthlyCups: 600,
      sensitivity: "medium",
    });

    expect(decision.recommendedReviewPrice).toBe(6700);
    expect(decision.currentMonthlyProfit).toBe(1695600);
    expect(decision.projectedMonthlyCups).toBe(480);
    expect(decision.projectedMonthlyProfit).toBe(1932480);
    expect(decision.monthlyProfitDelta).toBe(236880);
    expect(decision.breakEvenSalesDropRate).toBe(29.8);
    expect(decision.summary).toContain("월 236,880원 증가");
  });

  it("판매량 민감도가 높으면 같은 가격에서도 더 보수적인 월 이익을 보여준다", () => {
    const product = calculateProductCost(latte);
    const low = buildPriceDecision(product, { selectedPrice: 6700, monthlyCups: 600, sensitivity: "low" });
    const high = buildPriceDecision(product, { selectedPrice: 6700, monthlyCups: 600, sensitivity: "high" });

    expect(low.projectedMonthlyCups).toBe(516);
    expect(high.projectedMonthlyCups).toBe(438);
    expect(high.projectedMonthlyProfit).toBeLessThan(low.projectedMonthlyProfit);
    expect(high.sensitivityLabel).toBe("민감도 높음");
  });
});

describe("summarizeTradeArea", () => {
  it("입력 위치 주변 경쟁 강도를 카페·베이커리·프랜차이즈 신호로 요약한다", () => {
    const summary = summarizeTradeArea({
      address: "서울 마포구 연남동",
      radiusMeters: 500,
      cafeCount: 42,
      bakeryCount: 8,
      lowPriceFranchiseCount: 6,
      transitStopCount: 5,
      schoolCount: 2,
    });

    expect(summary.competitionLevel).toBe("high");
    expect(summary.opportunitySignal).toContain("베이커리");
    expect(summary.warning).toContain("저가 프랜차이즈");
  });
});
