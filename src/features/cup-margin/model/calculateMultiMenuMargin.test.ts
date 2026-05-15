import { describe, expect, it } from "vitest";
import { calculateMultiMenuMargin } from "./calculateMultiMenuMargin";

describe("calculateMultiMenuMargin", () => {
  it("고정 운영비를 전체 판매 잔 수 기준으로 한 잔당 배부한다", () => {
    const result = calculateMultiMenuMargin({
      monthlyFixedCost: 300000,
      menus: [
        {
          id: "a",
          menuName: "아메리카노",
          salePrice: 4000,
          ingredientCost: 800,
          packagingCost: 200,
          platformFeeRate: 0,
          wasteRate: 0,
          laborCostPerCup: 0,
          extraCost: 0,
          expectedMonthlyCups: 100,
        },
        {
          id: "b",
          menuName: "라떼",
          salePrice: 5000,
          ingredientCost: 1500,
          packagingCost: 300,
          platformFeeRate: 0,
          wasteRate: 0,
          laborCostPerCup: 0,
          extraCost: 0,
          expectedMonthlyCups: 200,
        },
      ],
    });

    expect(result.totalMonthlyCups).toBe(300);
    expect(result.fixedCostPerCup).toBe(1000);
    expect(result.menus[0].fixedCostShare).toBe(100000);
    expect(result.menus[1].fixedCostShare).toBe(200000);
    expect(result.menus[0].profitPerCup).toBe(2000);
    expect(result.menus[1].profitPerCup).toBe(2200);
  });

  it("메뉴별 판매 잔 수를 반영해 전체 월 이익을 계산한다", () => {
    const result = calculateMultiMenuMargin({
      monthlyFixedCost: 0,
      menus: [
        {
          id: "a",
          menuName: "아메리카노",
          salePrice: 4000,
          ingredientCost: 1000,
          packagingCost: 0,
          platformFeeRate: 0,
          wasteRate: 0,
          laborCostPerCup: 0,
          extraCost: 0,
          expectedMonthlyCups: 100,
        },
        {
          id: "b",
          menuName: "라떼",
          salePrice: 5000,
          ingredientCost: 3000,
          packagingCost: 0,
          platformFeeRate: 0,
          wasteRate: 0,
          laborCostPerCup: 0,
          extraCost: 0,
          expectedMonthlyCups: 50,
        },
      ],
    });

    expect(result.totalRevenue).toBe(650000);
    expect(result.totalProfit).toBe(400000);
    expect(result.blendedMarginRate).toBe(61.5);
  });
});
