import { describe, expect, it } from "vitest";
import { calculateMultiMenuMargin, calculatePriceChangeRisk } from "./calculateMultiMenuMargin";

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

  it("가격 변경은 판매량 변화 가정을 반영하고 기존 이익 유지 한계 잔수를 계산한다", () => {
    const [menu] = calculateMultiMenuMargin({
      monthlyFixedCost: 0,
      menus: [
        {
          id: "latte",
          menuName: "라떼",
          salePrice: 5000,
          ingredientCost: 3000,
          packagingCost: 0,
          platformFeeRate: 0,
          wasteRate: 0,
          laborCostPerCup: 0,
          extraCost: 0,
          expectedMonthlyCups: 100,
        },
      ],
    }).menus;

    const risk = calculatePriceChangeRisk(menu, { priceDelta: 500, volumeChangeRate: -10 });

    expect(risk.newSalePrice).toBe(5500);
    expect(risk.assumedMonthlyCups).toBe(90);
    expect(risk.projectedMonthlyProfit).toBe(225000);
    expect(risk.profitDelta).toBe(25000);
    expect(risk.breakEvenMonthlyCups).toBe(80);
    expect(risk.allowedDropCups).toBe(20);
    expect(risk.allowedDropRate).toBe(20);
    expect(risk.warning).toContain("예측이 아니라 가정 계산");
  });

  it("가격 인상 후 판매량이 너무 줄면 손익이 악화된다는 신호를 낸다", () => {
    const [menu] = calculateMultiMenuMargin({
      monthlyFixedCost: 0,
      menus: [
        {
          id: "americano",
          menuName: "아메리카노",
          salePrice: 4000,
          ingredientCost: 3000,
          packagingCost: 0,
          platformFeeRate: 0,
          wasteRate: 0,
          laborCostPerCup: 0,
          extraCost: 0,
          expectedMonthlyCups: 100,
        },
      ],
    }).menus;

    const risk = calculatePriceChangeRisk(menu, { priceDelta: 500, volumeChangeRate: -40 });

    expect(risk.projectedMonthlyProfit).toBe(90000);
    expect(risk.profitDelta).toBe(-10000);
    expect(risk.verdict).toBe("risk");
    expect(risk.summary).toContain("기존보다 이익이 줄어듭니다");
  });
});
